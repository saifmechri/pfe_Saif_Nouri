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
  { id: 'default-revision', type: 'révision', km_recommande: 20000, jours_recommandes: 365 },
  { id: 'default-reparation', type: 'réparation', km_recommande: 40000, jours_recommandes: 730 }
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

// Normalise les clés de tri supportées.
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

// Transforme un niveau d'urgence en rang numérique.
function getUrgencyRank(label) {
  const ranks = { URGENT: 3, 'RECOMMANDÉ': 2, FUTUR: 1 };
  return ranks[label] || 0;
}

// Uniformise la valeur d'urgence reçue depuis la query string.
function normalizeUrgency(value) {
  if (value === undefined || value === null || value === '') return null;
  const raw = String(value).toUpperCase();
  if (raw === 'RECOMMANDE') return 'RECOMMANDÉ';
  if (['URGENT', 'RECOMMANDÉ', 'FUTUR'].includes(raw)) return raw;
  return null;
}

// Retourne la dernière intervention pour un type et un véhicule.
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

  if (interventionDetail.kmScorePercent >= 70 || (kmRecommande > 0 && kmActuel >= kmRecommande)) {
    pushUniqueReason(reasons, 'Kilométrage élevé');
  }

  if (interventionDetail.dateScorePercent >= 70) {
    pushUniqueReason(reasons, 'Dernière intervention ancienne');
  }

  if (kmRestant !== null && kmRestant <= 1000) {
    pushUniqueReason(reasons, 'Entretien à prévoir rapidement');
  }

  if (reasons.length === 0) {
    pushUniqueReason(reasons, 'Entretien cohérent avec l’historique du véhicule');
  }

  return reasons;
}

function buildGarageReasons(garageDetail) {
  const reasons = [];

  if (garageDetail.distanceScore0to10 >= 8) {
    pushUniqueReason(reasons, 'Garage proche');
  }

  if (garageDetail.ratingScore0to10 >= 8) {
    pushUniqueReason(reasons, 'Garage bien noté');
  }

  if (garageDetail.availabilityScore0to10 >= 10) {
    pushUniqueReason(reasons, 'Disponible aujourd’hui');
  }

  if (reasons.length === 0) {
    pushUniqueReason(reasons, 'Garage pertinent selon la localisation et la disponibilité');
  }

  return reasons;
}

function buildRecommendationSummary(finalScore, interventionScore, garageScore) {
  if (finalScore >= 80 && interventionScore >= 70 && garageScore >= 70) {
    return 'Meilleur choix global';
  }

  if (finalScore >= 60) {
    return 'Bon compromis qualité/prix';
  }

  return 'Option secondaire';
}

// Construit une liste classée de recommandations dynamiques pour l'utilisateur connecté.
async function getRecommendations(req, res) {
  try {
    const TUNIS_DEFAULT_LAT = 36.8065;
    const TUNIS_DEFAULT_LON = 10.1815;
    const LEGACY_DEFAULT_LAT = 33.8869;
    const LEGACY_DEFAULT_LON = 9.5375;

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Non authentifié' });
    }

    const errors = [];

    const rawMinInterventionScore = req.query.minInterventionScore;
    const rawUrgency = req.query.urgency;
    const rawSortBy = req.query.sortBy;
    const rawOrder = req.query.order;
    const rawGarageLimit = req.query.garageLimit;
    const rawPage = req.query.page;
    const rawLimit = req.query.limit;

    if (rawMinInterventionScore !== undefined) {
      const parsed = toNumber(rawMinInterventionScore, null);
      if (parsed === null || parsed < 0 || parsed > 100) {
        errors.push('minInterventionScore doit etre un nombre entre 0 et 100');
      }
    }

    if (rawUrgency !== undefined && normalizeUrgency(rawUrgency) === null) {
      errors.push('urgency doit etre URGENT, RECOMMANDÉ (ou RECOMMANDE), ou FUTUR');
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

    const userResult = await pool.query(
      'SELECT id, latitude, longitude FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    }

    const user = userResult.rows[0];

    const vehiclesResult = await pool.query(
      `SELECT id, modele_voiture, type_vehicule, kilometrage_voiture, matricule_voiture
       FROM vehicules
       WHERE user_id = $1`,
      [userId]
    );

    const vehicles = vehiclesResult.rows;

    if (!vehicles || vehicles.length === 0) {
      return res.json({
        success: true,
        data: [],
        message: 'Aucun véhicule trouvé'
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
        message: 'Aucun garage trouvé'
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

    return res.json({
      success: true,
      data: serializedRecommendations,
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
