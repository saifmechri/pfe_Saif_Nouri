const { Vehicle, User, Intervention, Garage } = require('../models');
const {
  calculateInterventionScore,
  calculateGarageScore,
  getUrgency,
  haversine
} = require('../utils/algorithms');

function toNumber(value, fallback = null) {
  if (value === undefined || value === null || value === '') return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function parsePositiveInt(value, fallback) {
  const n = Number.parseInt(value, 10);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return n;
}

function normalizeSortBy(value) {
  const sortBy = String(value || 'urgence').toLowerCase();
  if (['urgence', 'score', 'distance', 'type'].includes(sortBy)) {
    return sortBy;
  }
  return 'urgence';
}

function normalizeSortOrder(value) {
  const order = String(value || 'desc').toLowerCase();
  return order === 'asc' ? 'asc' : 'desc';
}

function compareValues(a, b, order = 'desc') {
  if (a === b) return 0;
  if (a === null || a === undefined) return 1;
  if (b === null || b === undefined) return -1;
  const base = a > b ? 1 : -1;
  return order === 'asc' ? base : -base;
}

function getUrgencyRank(label) {
  const ranks = { URGENT: 3, 'RECOMMANDÉ': 2, FUTUR: 1 };
  return ranks[label] || 0;
}

function normalizeUrgency(value) {
  if (value === undefined || value === null || value === '') return null;
  const raw = String(value).toUpperCase();
  if (raw === 'RECOMMANDE') return 'RECOMMANDÉ';
  if (['URGENT', 'RECOMMANDÉ', 'FUTUR'].includes(raw)) return raw;
  return null;
}

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
    
    console.log(`[RECOMMANDATIONS] Calcul pour userId: ${userId}`);
    
    // 1️⃣ Récupérer l'utilisateur
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    }
    
    // 2️⃣ Récupérer les véhicules
    const vehicles = await Vehicle.findAll({ 
      where: { userId } 
    });
    
    if (!vehicles || vehicles.length === 0) {
      return res.json({ 
        success: true, 
        data: [],
        message: 'Aucun véhicule trouvé'
      });
    }
    
    // 3️⃣ Récupérer types intervention
    const interventionTypesRaw = await Intervention.findAll({
      attributes: ['id', 'type', 'km_recommande', 'jours_recommandes'],
      raw: true
    });
    const interventionTypes = Array.from(
      new Map(interventionTypesRaw.map(item => [item.type, item])).values()
    );
    
    // 4️⃣ Récupérer garages
    const garages = await Garage.findAll({
      raw: true
    });
    
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

    // 5️⃣ Calculer recommandations
    const allRecommendations = [];
    
    for (const vehicle of vehicles) {
      const kmActuel = Number(vehicle.kilometrage_voiture ?? vehicle.kilometrage ?? 0);
      const vehicleType = vehicle.type_vehicule || vehicle.type || 'Essence';
      const vehicleLabel = vehicle.modele_voiture || vehicle.modele || 'Vehicule';
      
      console.log(`  [VEHICLE] ${vehicleLabel} - ${kmActuel} km`);
      
      for (const interventionType of interventionTypes) {
        // Dernière intervention de ce type
        const lastIntervention = await Intervention.findOne({
          where: { 
            vehicleId: vehicle.id,
            type: interventionType.type 
          },
          order: [['date_intervention', 'DESC']],
          raw: true
        });
        
        // Score intervention
        const interventionScore = calculateInterventionScore(
          {
            ...vehicle,
            kilometrage: kmActuel,
            type: vehicleType
          },
          lastIntervention,
          interventionType
        );
        
        // Si score > 50, recommander
        if (interventionScore >= 50) {
          console.log(`    ✅ ${interventionType.type}: score = ${interventionScore}`);
          
          // Meilleurs garages
          const bestGarages = garages
            .map(garage => {
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
                  longitude: garageLon
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
              marque: vehicle.marque || null,
              modele: vehicle.modele_voiture || vehicle.modele || null,
              kilometrage: kmActuel,
              type: vehicleType,
              matricule: vehicle.matricule_voiture || null
            },
            intervention: {
              id: interventionType.id,
              type: interventionType.type,
              urgence: getUrgency(interventionScore),
              score: parseFloat(interventionScore.toFixed(2)),
              km_recommande: interventionType.km_recommande,
              km_actuel: kmActuel,
              km_restant: interventionType.km_recommande ? 
                Math.max(0, interventionType.km_recommande - kmActuel) : null,
              jours_recommandes: interventionType.jours_recommandes
            },
            garages: bestGarages.map(g => ({
              id: g.id,
              name: g.name,
              adresse: g.adresse,
              telephone: g.telephone,
              distance_km: g.distance_km,
              rating: parseFloat(g.rating) || 3.5,
              score_global: parseFloat(g.score_global.toFixed(2)),
              isOpen: g.isOpen
            }))
          });
        }
      }
    }
    
    let filteredRecommendations = allRecommendations.filter(item => item.intervention.score >= minInterventionScore);
    if (urgency) {
      filteredRecommendations = filteredRecommendations.filter(item => item.intervention.urgence === urgency);
    }

    // 6️⃣ Trier les recommandations classées
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

      // Tri par urgence puis score (par défaut)
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
    
    console.log(`[RECOMMANDATIONS] Total trouvées: ${total}`);
    
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
