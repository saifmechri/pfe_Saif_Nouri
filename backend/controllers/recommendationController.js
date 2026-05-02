const { pool } = require('../db');
const {
  calculateInterventionScore,
  calculateGarageScore,
  getUrgency,
  haversine
} = require('../utils/algorithms');

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

    const interventionTypes = interventionTypesResult.rows;

    if (!interventionTypes || interventionTypes.length === 0) {
      return res.json({
        success: true,
        data: [],
        message: 'Aucun type d intervention trouvé (table interventions vide)'
      });
    }

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

        const interventionScore = calculateInterventionScore(
          {
            ...vehicle,
            kilometrage: kmActuel,
            type: vehicleType
          },
          lastIntervention,
          interventionType
        );

        if (interventionScore >= 50) {
          const bestGarages = garages
            .map((garage) => {
              const garageLat = Number(garage.latitude);
              const garageLon = Number(garage.longitude);
              const hasGps = Number.isFinite(garageLat) && Number.isFinite(garageLon);
              const distance = hasGps ? haversine(userLat, userLon, garageLat, garageLon) : null;
              const score = calculateGarageScore(
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
                ...garage,
                distance_km: distance,
                score_global: score
              };
            })
            .sort((a, b) => b.score_global - a.score_global)
            .slice(0, garageLimit);

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
              km_recommande: kmRecommande || null,
              km_actuel: kmActuel,
              km_restant: kmRestant,
              jours_recommandes: interventionType.jours_recommandes
            },
            garages: bestGarages.map((g) => ({
              id: g.id,
              name: g.name,
              adresse: g.adresse,
              telephone: g.telephone,
              distance_km: g.distance_km,
              rating: parseFloat(g.rating) || 3.5,
              score_global: parseFloat(g.score_global.toFixed(2)),
              isOpen: Boolean(g.is_open)
            }))
          });
        }
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

    return res.json({
      success: true,
      data: pagedRecommendations,
      count: pagedRecommendations.length,
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
