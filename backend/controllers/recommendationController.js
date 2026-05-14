const { pool } = require('../db');
const {
  calculateInterventionScore,
  calculateInterventionScoreDetailed,
  calculateGarageScore,
  calculateGarageScoreDetailed,
  getUrgency,
  haversine
} = require('../utils/algorithms');

const DEFAULT_INTERVENTION_TYPES = [
  { id: 'default-vidange', type: 'vidange', km_recommande: 10000, jours_recommandes: 180 },
  { id: 'default-revision', type: 'rÃ©vision', km_recommande: 20000, jours_recommandes: 365 },
  { id: 'default-reparation', type: 'rÃ©paration', km_recommande: 40000, jours_recommandes: 730 }
];

// Convertit en nombre avec fallback si valeur absente/invalide.
function toNumber(value, fallback = null) {
  if (value === undefined || value === null || value === '') return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

// Parse un entier strictement positif.
function parsePositiveInt(value, fallback) {
  const n = Number.parseInt(value, 10);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return n;
}

// Normalise les clÃ©s de tri supportÃ©es.
function normalizeSortBy(value) {
  const sortBy = String(value || 'urgence').toLowerCase();
  if (['urgence', 'score', 'distance', 'type'].includes(sortBy)) {
    return sortBy;
  }
  return 'urgence';
}

// Normalise l'ordre de tri (asc|desc).
function normalizeSortOrder(value) {
  const order = String(value || 'desc').toLowerCase();
  return order === 'asc' ? 'asc' : 'desc';
}

// Compare deux valeurs en tenant compte de l'ordre et des null.
function compareValues(a, b, order = 'desc') {
  if (a === b) return 0;
  if (a === null || a === undefined) return 1;
  if (b === null || b === undefined) return -1;
  const base = a > b ? 1 : -1;
  return order === 'asc' ? base : -base;
}

// Transforme un niveau d'urgence en rang numÃ©rique.
function getUrgencyRank(label) {
  const ranks = { URGENT: 3, 'RECOMMANDÃ‰': 2, FUTUR: 1 };
  return ranks[label] || 0;
}

// Uniformise la valeur d'urgence reÃ§ue depuis la query string.
function normalizeUrgency(value) {
  if (value === undefined || value === null || value === '') return null;
  const raw = String(value).toUpperCase();
  if (raw === 'RECOMMANDE') return 'RECOMMANDÃ‰';
  if (['URGENT', 'RECOMMANDÃ‰', 'FUTUR'].includes(raw)) return raw;
  return null;
}

// Retourne la derniÃ¨re intervention pour un type et un vÃ©hicule.
async function getLastInterventionByType(vehicleId, type) {
  const result = await pool.query(
    `SELECT id, date_intervention, kilometrage, created_at
     FROM interventions
     WHERE vehicle_id = $1 AND type = $2
     ORDER BY date_intervention DESC, id DESC
     LIMIT 1`,
    [vehicleId, type]
  );

  return result.rows[0] || null;
}

function pushUniqueReason(reasons, reason) {
  if (!reason) return;
  if (!reasons.includes(reason)) {
    reasons.push(reason);
  }
}

function buildInterventionReasons(interventionDetail, kmActuel, kmRecommande, kmRestant) {
  const reasons = [];

  // Kilometer-based scoring in tiers
  const kmScore = interventionDetail.kmScorePercent || 0;
  if (kmScore >= 90) {
    pushUniqueReason(reasons, 'Kilométrage très élevé - intervention urgente');
  } else if (kmScore >= 70) {
    pushUniqueReason(reasons, 'Kilométrage élevé par rapport aux recommandations');
  } else if (kmScore >= 50) {
    pushUniqueReason(reasons, 'Kilométrage approchant le seuil recommandé');
  }

  // Date-based scoring in tiers
  const dateScore = interventionDetail.dateScorePercent || 0;
  if (dateScore >= 90) {
    pushUniqueReason(reasons, 'Dernière intervention très ancienne');
  } else if (dateScore >= 70) {
    pushUniqueReason(reasons, 'Dernière intervention ancienne');
  } else if (dateScore >= 50) {
    pushUniqueReason(reasons, 'Intervalle recommandé approchant');
  }

  // Granular km restant checks
  if (kmRestant !== null && kmRestant !== undefined) {
    if (kmRestant <= 500) {
      pushUniqueReason(reasons, 'Entretien à prévoir très rapidement - moins de 500 km');
    } else if (kmRestant <= 1000) {
      pushUniqueReason(reasons, 'Entretien à prévoir rapidement - moins de 1000 km');
    } else if (kmRestant <= 2000) {
      pushUniqueReason(reasons, 'Entretien recommandé dans les 2000 km');
    }
  }

  // Score-based reasoning
  const combinedScore = (kmScore + dateScore) / 2;
  if (combinedScore >= 70) {
    pushUniqueReason(reasons, 'Score de priorite d\'entretien eleve');
  }

  if (reasons.length === 0) {
    pushUniqueReason(reasons, 'Entretien coherent avec l\'historique du vehicule');
  }

  return reasons;
}

function buildGarageReasons(garageDetail) {
  const reasons = [];

  // Distance score in multiple tiers
  const distanceScore = garageDetail.distanceScore0to10 || 0;
  if (distanceScore >= 9) {
    pushUniqueReason(reasons, 'Garage très proche - localisation excellente');
  } else if (distanceScore >= 8) {
    pushUniqueReason(reasons, 'Garage proche - localisation optimale');
  } else if (distanceScore >= 6) {
    pushUniqueReason(reasons, 'Garage à distance raisonnable');
  } else if (distanceScore >= 4) {
    pushUniqueReason(reasons, 'Garage accessible');
  }

  // Rating score in multiple tiers
  const ratingScore = garageDetail.ratingScore0to10 || 0;
  if (ratingScore >= 9) {
    pushUniqueReason(reasons, 'Garage excellent - très bien noté');
  } else if (ratingScore >= 8) {
    pushUniqueReason(reasons, 'Garage bien noté');
  } else if (ratingScore >= 6) {
    pushUniqueReason(reasons, 'Garage correctement noté');
  }

  // Availability score with better logic
  const availabilityScore = garageDetail.availabilityScore0to10 || 0;
  if (availabilityScore >= 9) {
    pushUniqueReason(reasons, 'Disponible aujourd\'hui - excellente réactivité');
  } else if (availabilityScore >= 7) {
    pushUniqueReason(reasons, 'Bonne disponibilité');
  } else if (availabilityScore >= 5) {
    pushUniqueReason(reasons, 'Disponibilité acceptable');
  }

  // Overall garage score evaluation
  const overallScore = (distanceScore + ratingScore + availabilityScore) / 3;
  if (overallScore >= 8) {
    pushUniqueReason(reasons, 'Garage très recommandé - excellent profil global');
  } else if (overallScore >= 6) {
    pushUniqueReason(reasons, 'Garage pertinent selon tous les critères');
  }

  if (reasons.length === 0) {
    pushUniqueReason(reasons, 'Garage pertinent selon la localisation et la disponibilité');
  }

  return reasons;
}

/**
 * Generates human-readable recommendation summary based on scores
 * Helps user understand why a recommendation is suggested
 * 
 * SCORE INTERPRETATION:
 * 80+: Excellent - urgent maintenance with high-quality garage match
 * 60-79: Good - moderate maintenance need, solid garage option
 * <60: Fair - future maintenance, basic garage match
 */
function buildRecommendationSummary(finalScore, interventionScore, garageScore) {
  if (finalScore >= 80 && interventionScore >= 70 && garageScore >= 70) {
    return 'Décision Auto Bot priorisant le meilleur équilibre entre entretien et garage';
  }

  if (finalScore >= 60) {
    return 'Recommandation Auto Bot basée sur les signaux véhicule et garage';
  }

  return 'Recommandation de continuité calculée par le moteur intelligent Auto Bot';
}

function buildRecommendationRole() {
  return 'Moteur intelligent Auto Bot: analyse le kilométrage, la dernière intervention, le type de véhicule, la distance, le rating et la disponibilité pour classer les meilleurs garages et entretiens.';
}

function clamp(value, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

function getHistoryState(interventionScoreDetail) {
  const signals = [
    interventionScoreDetail?.kmRecommande,
    interventionScoreDetail?.kmRestant,
    interventionScoreDetail?.dateScorePercent
  ].filter((value) => value !== null && value !== undefined).length;

  if (signals === 0) return 'missing';
  if (signals >= 3) return 'complete';
  return 'partial';
}

function getVehicleScore(kmActuel) {
  if (!Number.isFinite(kmActuel)) {
    return { score: 60, label: 'Kilométrage manquant' };
  }

  if (kmActuel < 80000) {
    return { score: 85, label: 'Kilométrage sain' };
  }

  if (kmActuel <= 150000) {
    return { score: 60, label: 'Kilométrage intermédiaire' };
  }

  return { score: 30, label: 'Kilométrage élevé' };
}

function getRiskLevel(kmActuel, historyState) {
  if ((Number.isFinite(kmActuel) && kmActuel > 150000) || historyState !== 'complete') {
    return {
      level: 'HIGH',
      tone: 'rose',
      message: "Le véhicule est classé HIGH car le kilométrage est critique ou l'historique est incomplet."
    };
  }

  if (Number.isFinite(kmActuel) && kmActuel >= 80000) {
    return {
      level: 'MEDIUM',
      tone: 'amber',
      message: 'Le véhicule est classé MEDIUM car il se situe dans la zone de vigilance kilométrique.'
    };
  }

  return {
    level: 'LOW',
    tone: 'emerald',
    message: 'Le véhicule est classé LOW car le kilométrage est faible et l\'historique est complet.'
  };
}

function buildDecisionAnalysis({ kmActuel, kmRecommande, kmRestant, historyState, risk }) {
  const kmNowText = Number.isFinite(kmActuel) ? `${Math.round(kmActuel)} km` : 'km inconnu';
  const kmTargetText = Number.isFinite(kmRecommande) ? `${Math.round(kmRecommande)} km` : 'seuil non renseigné';

  const trigger = `Déclencheur: ${kmNowText} observés pour un seuil conseillé à ${kmTargetText}.`;

  const history =
    historyState === 'missing'
      ? "Historique incomplet: le moteur applique une stratégie prudente par défaut."
      : historyState === 'partial'
        ? 'Historique partiel: la décision combine les signaux disponibles sans interpolation agressive.'
        : 'Historique complet: la décision exploite toutes les informations de maintenance disponibles.';

  const riskReason =
    Number.isFinite(kmRestant)
      ? `Risque ${risk.level}: marge restante estimée à ${Math.max(0, Math.round(kmRestant))} km avant le prochain seuil.`
      : `Risque ${risk.level}: calcul fondé sur le kilométrage et la complétude de l'historique.`;

  return { trigger, history, riskReason };
}

function normalizeDecisionType(type) {
  const raw = String(type || '').toLowerCase();
  if (raw.includes('vidange')) return 'Vidange';
  if (raw.includes('revision') || raw.includes('révision')) return 'Révision';
  if (raw.includes('reparation') || raw.includes('réparation')) return 'Réparation';
  return 'Révision';
}

function buildEmptyGarageFallback() {
  return {
    id: null,
    name: 'Garage à confirmer',
    adresse: null,
    telephone: null,
    distance_km: null,
    rating: null,
    score_global: 0,
    score_breakdown: null,
    isOpen: false
  };
}

function buildFallbackDecision({ vehicle = null, garage = null, service = 'Révision' } = {}) {
  const fallbackGarage = garage || buildEmptyGarageFallback();
  const safeVehicle = vehicle
    ? {
        id: vehicle.id ?? null,
        marque: null,
        modele: vehicle.modele_voiture ?? vehicle.modele ?? null,
        kilometrage: Number(vehicle.kilometrage_voiture ?? vehicle.kilometrage ?? 0),
        type: vehicle.type_vehicule ?? vehicle.type ?? 'Essence',
        fuel: vehicle.type_vehicule ?? vehicle.fuel ?? null,
        current_state: vehicle.current_state ?? 'À vérifier',
        matricule: vehicle.matricule_voiture ?? vehicle.matricule ?? null
      }
    : {
        id: null,
        marque: null,
        modele: 'Votre véhicule',
        kilometrage: 0,
        type: 'Essence',
        fuel: null,
        current_state: 'À vérifier',
        matricule: null
      };

  return {
    decision: normalizeDecisionType(service),
    recommendation_summary: 'Recommandation générée avec les données disponibles par le moteur intelligent Auto Bot',
    recommendation_role: buildRecommendationRole(),
    risk: 'MEDIUM',
    risk_message: "Le moteur applique un niveau MEDIUM par défaut lorsqu'il manque des informations.",
    risk_tone: 'amber',
    final_score: 50,
    vehicle_score: 50,
    garage_score: 50,
    vehicle_score_label: 'Score par défaut',
    history_state: 'missing',
    reasons: [
      'Décision de secours calculée pour garantir une recommandation continue.',
      'Complétez les données véhicule et historique pour affiner le score.'
    ],
    analysis: {
      trigger: 'Déclencheur: mode fallback activé.',
      history: 'Historique insuffisant: le moteur applique une stratégie prudente.',
      riskReason: 'Risque MEDIUM: valeur de sécurité en attendant des données plus complètes.'
    },
    vehicle: safeVehicle,
    intervention: {
      id: null,
      type: normalizeDecisionType(service),
      urgence: 'RECOMMANDÉ',
      score: 50,
      score_breakdown: null,
      km_recommande: null,
      km_actuel: safeVehicle.kilometrage,
      km_restant: null,
      jours_recommandes: null
    },
    recommended_garage: fallbackGarage,
    top_garages: [fallbackGarage]
  };
}

function toDecisionPayload(candidate) {
  if (!candidate) return buildFallbackDecision();

  const intervention = candidate.intervention || {};
  const vehicle = candidate.vehicle || {};
  const garages = Array.isArray(candidate.garages) ? candidate.garages.slice(0, 3) : [];
  const bestGarage = garages[0] || null;

  const kmActuel = toNumber(vehicle.kilometrage, null);
  const kmRecommande = toNumber(intervention.km_recommande, null);
  const kmRestant = toNumber(intervention.km_restant, null);
  const historyState = getHistoryState(intervention.score_breakdown);
  const vehicleScoreDetail = getVehicleScore(kmActuel);
  const garageScore = toNumber(bestGarage?.score_global, 0) || 0;
  const finalScore = clamp(Math.round(0.5 * vehicleScoreDetail.score + 0.5 * garageScore));
  const risk = getRiskLevel(kmActuel, historyState);
  const analysis = buildDecisionAnalysis({
    kmActuel,
    kmRecommande,
    kmRestant,
    historyState,
    risk
  });

  return {
    decision: normalizeDecisionType(intervention.type),
    recommendation_summary: candidate.recommendationSummary || 'Recommandation principale du moteur Auto Bot',
    recommendation_role: buildRecommendationRole(),
    risk: risk.level,
    risk_message: risk.message,
    risk_tone: risk.tone,
    final_score: finalScore,
    vehicle_score: vehicleScoreDetail.score,
    garage_score: Math.round(garageScore),
    vehicle_score_label: vehicleScoreDetail.label,
    history_state: historyState,
    reasons: Array.isArray(candidate.reasons) ? candidate.reasons.slice(0, 3) : [],
    analysis,
    vehicle,
    intervention,
    recommended_garage: bestGarage || buildEmptyGarageFallback(),
    top_garages: garages.length > 0 ? garages : [buildEmptyGarageFallback()]
  };
}

function buildVehicleCurrentState(kmActuel, kmRecommande, urgency) {
  const normalizedUrgency = String(urgency || '').toUpperCase();
  const remainingKm = Number.isFinite(kmRecommande) ? Math.max(0, kmRecommande - kmActuel) : null;

  if (normalizedUrgency === 'URGENT' || (remainingKm !== null && remainingKm <= 500)) {
    return 'Entretien urgent';
  }

  if (normalizedUrgency === 'RECOMMANDÉ' || normalizedUrgency === 'RECOMMANDE' || (remainingKm !== null && remainingKm <= 1500)) {
    return 'Entretien recommandé';
  }

  if (remainingKm !== null && remainingKm <= 3000) {
    return 'À surveiller';
  }

  return 'État correct';
}

// Construit une liste classÃ©e de recommandations dynamiques pour l'utilisateur connectÃ©.
/**
 * AUTO BOT INTELLIGENT RECOMMENDATION ENGINE
 * 
 * This is the core AI-powered matching system that analyzes vehicle maintenance needs
 * and ranks the best garages for each maintenance type.
 * 
 * SCORING FACTORS:
 * 1. Intervention Score (0-100): Based on mileage, last maintenance date
 * 2. Garage Score (0-100): Based on distance, ratings, availability
 * 3. Risk Level: URGENT/RECOMMANDE/FUTUR
 * 
 * HOW TO USE:
 * GET /api/recommendations/classees?sortBy=score&order=desc&page=1&limit=50
 * Returns ranked recommendations with best garage match for each maintenance need.
 */
async function getRecommendations(req, res) {
  try {
    // Default coordinates for Tunis (fallback when user location unavailable)
    const TUNIS_DEFAULT_LAT = 36.8065;
    const TUNIS_DEFAULT_LON = 10.1815;
    const LEGACY_DEFAULT_LAT = 33.8869;
    const LEGACY_DEFAULT_LON = 9.5375;

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Non authentifiÃ©' });
    }

    const errors = [];

    const rawMinInterventionScore = req.query.minInterventionScore;
    const rawUrgency = req.query.urgency;
    const rawSortBy = req.query.sortBy;
    const rawOrder = req.query.order;
    const rawGarageLimit = req.query.garageLimit;
    const rawPage = req.query.page;
    const rawLimit = req.query.limit;
    const rawVehicleId = req.query.vehicleId;

    if (rawMinInterventionScore !== undefined) {
      const parsed = toNumber(rawMinInterventionScore, null);
      if (parsed === null || parsed < 0 || parsed > 100) {
        errors.push('minInterventionScore doit etre un nombre entre 0 et 100');
      }
    }

    if (rawUrgency !== undefined && normalizeUrgency(rawUrgency) === null) {
      errors.push('urgency doit etre URGENT, RECOMMANDÃ‰ (ou RECOMMANDE), ou FUTUR');
    }

    if (rawSortBy !== undefined && !['urgence', 'score', 'distance', 'type'].includes(String(rawSortBy).toLowerCase())) {
      errors.push('sortBy doit etre urgence, score, distance ou type');
    }

    if (rawOrder !== undefined && !['asc', 'desc'].includes(String(rawOrder).toLowerCase())) {
      errors.push('order doit etre asc ou desc');
    }

    if (rawGarageLimit !== undefined) {
      const parsed = parsePositiveInt(rawGarageLimit, 0);
      if (parsed < 1 || parsed > 10) {
        errors.push('garageLimit doit etre un entier entre 1 et 10');
      }
    }

    if (rawPage !== undefined) {
      const parsed = parsePositiveInt(rawPage, 0);
      if (parsed < 1) {
        errors.push('page doit etre un entier >= 1');
      }
    }

    if (rawLimit !== undefined) {
      const parsed = parsePositiveInt(rawLimit, 0);
      if (parsed < 1 || parsed > 50) {
        errors.push('limit doit etre un entier entre 1 et 50');
      }
    }

    if (rawVehicleId !== undefined) {
      const parsed = parsePositiveInt(rawVehicleId, 0);
      if (parsed < 1) {
        errors.push('vehicleId doit etre un entier > 0');
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Parametres de requete invalides',
        errors
      });
    }

    const minInterventionScore = toNumber(rawMinInterventionScore, 0);
    const urgency = normalizeUrgency(rawUrgency);
    const sortBy = normalizeSortBy(rawSortBy);
    const order = normalizeSortOrder(rawOrder);
    const distanceOrder = rawOrder ? order : 'asc';
    const garageLimit = Math.min(parsePositiveInt(rawGarageLimit, 5), 10);
    const page = parsePositiveInt(rawPage, 1);
    const limit = Math.min(parsePositiveInt(rawLimit, 10), 50);
    const vehicleIdFilter = rawVehicleId !== undefined ? parsePositiveInt(rawVehicleId, 0) : null;

    const userResult = await pool.query(
      'SELECT id, latitude, longitude FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvÃ©' });
    }

    const user = userResult.rows[0];

    const vehiclesResult = await pool.query(
      `SELECT id, modele_voiture, type_vehicule, kilometrage_voiture, matricule_voiture
       FROM vehicules
       WHERE user_id = $1`,
      [userId]
    );

    const vehicles = vehicleIdFilter
      ? vehiclesResult.rows.filter((vehicle) => Number(vehicle.id) === vehicleIdFilter)
      : vehiclesResult.rows;

    if (vehicleIdFilter && vehicles.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Vehicule introuvable pour cet utilisateur'
      });
    }

    if (!vehicles || vehicles.length === 0) {
      return res.json({
        success: true,
        data: [],
        decision: buildFallbackDecision({ service: 'Révision' }),
        message: 'Aucun vÃ©hicule trouvÃ©'
      });
    }

    const interventionTypesResult = await pool.query(
      `SELECT DISTINCT ON (type)
         id,
         type,
         km_recommande,
         jours_recommandes
       FROM interventions
       WHERE type IS NOT NULL
       ORDER BY type, id DESC`
    );

    const interventionTypes =
      Array.isArray(interventionTypesResult.rows) && interventionTypesResult.rows.length > 0
        ? interventionTypesResult.rows
        : DEFAULT_INTERVENTION_TYPES;

    const garagesResult = await pool.query(
      `SELECT id, name, adresse, telephone, latitude, longitude, rating, is_open
       FROM garages`
    );

    const garages = garagesResult.rows;

    if (!garages || garages.length === 0) {
      return res.json({
        success: true,
        data: [],
        decision: buildFallbackDecision({ vehicle: vehicles[0], service: 'Révision' }),
        message: 'Aucun garage trouvÃ©'
      });
    }

    const parsedUserLat = Number(user.latitude);
    const parsedUserLon = Number(user.longitude);
    const hasValidCoordinates = Number.isFinite(parsedUserLat) && Number.isFinite(parsedUserLon);
    const usesLegacyDefaults =
      hasValidCoordinates &&
      Math.abs(parsedUserLat - LEGACY_DEFAULT_LAT) < 0.000001 &&
      Math.abs(parsedUserLon - LEGACY_DEFAULT_LON) < 0.000001;

    const userLat = hasValidCoordinates && !usesLegacyDefaults ? parsedUserLat : TUNIS_DEFAULT_LAT;
    const userLon = hasValidCoordinates && !usesLegacyDefaults ? parsedUserLon : TUNIS_DEFAULT_LON;

    const allRecommendations = [];

    for (const vehicle of vehicles) {
      const kmActuel = Number(vehicle.kilometrage_voiture ?? 0);
      const vehicleType = vehicle.type_vehicule || 'Essence';

      for (const interventionType of interventionTypes) {
        const lastIntervention = await getLastInterventionByType(vehicle.id, interventionType.type);

        const kmRecommande = Number(interventionType.km_recommande ?? 0);
        const kmRestant = kmRecommande > 0 ? Math.max(0, kmRecommande - kmActuel) : null;

        const interventionScoreDetail = calculateInterventionScoreDetailed(
          {
            ...vehicle,
            kilometrage: kmActuel,
            type: vehicleType
          },
          lastIntervention,
          interventionType
        );
        const interventionScore = interventionScoreDetail.total;

        const bestGarages = garages
          .map((garage) => {
            const garageLat = Number(garage.latitude);
            const garageLon = Number(garage.longitude);
            const hasGps = Number.isFinite(garageLat) && Number.isFinite(garageLon);
            const garageDetail = calculateGarageScoreDetailed(
              userLat,
              userLon,
              {
                ...garage,
                latitude: garageLat,
                longitude: garageLon,
                isOpen: Boolean(garage.is_open)
              }
            );
            return {
              id: garage.id,
              name: garage.name,
              adresse: garage.adresse,
              telephone: garage.telephone,
              distance_km: garageDetail.distanceKm,
              rating: parseFloat(garage.rating) || 3.5,
              score_global: parseFloat(garageDetail.total.toFixed(2)),
              score_breakdown: garageDetail,
              isOpen: Boolean(garage.is_open)
            };
          })
          .sort((a, b) => b.score_global - a.score_global)
          .slice(0, garageLimit);

        const bestGarage = bestGarages[0] || null;
        const garageScore = bestGarage?.score_global ?? 0;
        const finalScore = parseFloat((((interventionScoreDetail.total || 0) + garageScore) / 2).toFixed(2));
        const interventionReasons = buildInterventionReasons(interventionScoreDetail, kmActuel, kmRecommande, kmRestant);
        const garageReasons = bestGarage ? buildGarageReasons(bestGarage.score_breakdown) : [];
        const reasons = [...interventionReasons, ...garageReasons];
        const recommendationSummary = buildRecommendationSummary(finalScore, interventionScoreDetail.total || 0, garageScore);

        allRecommendations.push({
          vehicle: {
            id: vehicle.id,
            marque: null,
            modele: vehicle.modele_voiture || null,
            kilometrage: kmActuel,
            type: vehicleType,
            fuel: vehicle.type_vehicule || null,
            current_state: buildVehicleCurrentState(kmActuel, kmRecommande, getUrgency(kmActuel, kmRecommande)),
            matricule: vehicle.matricule_voiture || null
          },
          intervention: {
            id: interventionType.id,
            type: interventionType.type,
            urgence: getUrgency(kmActuel, kmRecommande),
            score: parseFloat(interventionScore.toFixed(2)),
            score_breakdown: interventionScoreDetail,
            km_recommande: kmRecommande || null,
            km_actuel: kmActuel,
            km_restant: kmRestant,
            jours_recommandes: interventionType.jours_recommandes
          },
          garages: bestGarages,
          finalScore,
          recommendationSummary,
          reasons,
          explanation: {
            interventionReasons,
            garageReasons,
            recommendationSummary,
            finalScore
          }
        });
      }
    }

    let filteredRecommendations = allRecommendations.filter((item) => item.intervention.score >= minInterventionScore);
    if (urgency) {
      filteredRecommendations = filteredRecommendations.filter((item) => item.intervention.urgence === urgency);
    }

    filteredRecommendations.sort((a, b) => {
      if (sortBy === 'score') {
        return compareValues(a.intervention.score, b.intervention.score, order);
      }

      if (sortBy === 'distance') {
        const aDistance = a.garages?.[0]?.distance_km;
        const bDistance = b.garages?.[0]?.distance_km;
        return compareValues(aDistance, bDistance, distanceOrder);
      }

      if (sortBy === 'type') {
        return compareValues(a.intervention.type, b.intervention.type, order);
      }

      const urgencyDiff = compareValues(
        getUrgencyRank(a.intervention.urgence),
        getUrgencyRank(b.intervention.urgence),
        order
      );
      if (urgencyDiff !== 0) return urgencyDiff;
      return compareValues(a.intervention.score, b.intervention.score, 'desc');
    });

    const total = filteredRecommendations.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const safePage = Math.min(page, totalPages);
    const startIndex = (safePage - 1) * limit;
    const pagedRecommendations = filteredRecommendations.slice(startIndex, startIndex + limit);

    const byUrgency = filteredRecommendations.reduce((acc, item) => {
      const key = item.intervention.urgence;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const serializedRecommendations = pagedRecommendations.map((item) => ({
      ...item,
      garages: (item.garages || []).map((garage) => ({
        ...garage,
        score_breakdown: garage.score_breakdown ? { ...garage.score_breakdown } : null
      }))
    }));

    const canonicalSource = filteredRecommendations.length > 0 ? filteredRecommendations : allRecommendations;

    const canonicalCandidate = [...canonicalSource]
      .sort((a, b) => {
        if ((b.finalScore ?? 0) !== (a.finalScore ?? 0)) return (b.finalScore ?? 0) - (a.finalScore ?? 0);
        if ((b.intervention?.score ?? 0) !== (a.intervention?.score ?? 0)) {
          return (b.intervention?.score ?? 0) - (a.intervention?.score ?? 0);
        }
        const aGarage = a.garages?.[0]?.score_global ?? 0;
        const bGarage = b.garages?.[0]?.score_global ?? 0;
        if (bGarage !== aGarage) return bGarage - aGarage;
        return 0;
      })[0] || null;

    const decision = canonicalCandidate
      ? toDecisionPayload(canonicalCandidate)
      : buildFallbackDecision({ vehicle: vehicles[0], garage: garages[0], service: 'Révision' });

    return res.json({
      success: true,
      data: serializedRecommendations,
      decision,
      count: serializedRecommendations.length,
      meta: {
        total,
        page: safePage,
        limit,
        totalPages,
        sortBy,
        order,
        filters: {
          urgency,
          minInterventionScore
        },
        stats: {
          byUrgency
        }
      }
    });
  } catch (error) {
    console.error('[RECOMMANDATIONS ERROR]', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors du calcul des recommandations',
      error: error.message
    });
  }
}

module.exports = { getRecommendations };

