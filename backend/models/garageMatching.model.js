const { pool } = require('../db');

// Calcul de distance Haversine (en km)
const calculateHaversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Rayon terrestre en km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const splitTerms = (value) => {
  if (!value) {
    return [];
  }

  return String(value)
    .split(/[\n,;]+/)
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
};

const uniqueTerms = (terms) => [...new Set((terms || []).filter(Boolean))];

const interventionKeywordMap = {
  vidange: ['vidange', 'huile', 'filtre', 'filtres', 'lubrifiant', 'entretien'],
  frein: ['frein', 'freins', 'plaquette', 'plaquettes', 'disque', 'disques', 'freinage'],
  pneus: ['pneu', 'pneus', 'parallélisme', 'paralleisme', 'équilibrage', 'equilibrage', 'géométrie', 'geometrie'],
  diagnostic: ['diagnostic', 'valise', 'obd', 'ecu', 'calculateur', 'lecture défauts', 'effacement défauts'],
  climatisation: ['clim', 'climatisation', 'recharge climatisation', 'gaz clim'],
  batterie: ['batterie', 'alternateur', 'démarreur', 'demarreur'],
  moteur: ['moteur', 'injecteur', 'injecteurs', 'courroie', 'distribution'],
  carrosserie: ['carrosserie', 'peinture', 'tôlerie', 'tolerie', 'débosselage', 'debosselage'],
  vitrage: ['pare-brise', 'pare brise', 'vitrage', 'optiques'],
  direction: ['crémaillère', 'cremaillere', 'direction', 'suspension', 'amortisseurs'],
  transmission: ['boîte', 'boite', 'embrayage', 'transmission', 'vidange boîte', 'vidange boite'],
  échappement: ['échappement', 'echappement', 'catalyseur', 'pollution'],
  électrique: ['électricité', 'electricite', 'électrique', 'electrique', 'câblage', 'cablage', 'fusible']
};

const buildInterventionKeywords = (type, description) => {
  const normalizedText = uniqueTerms([...splitTerms(type), ...splitTerms(description)]);
  const expanded = new Set(normalizedText);

  normalizedText.forEach((term) => {
    Object.entries(interventionKeywordMap).forEach(([key, synonyms]) => {
      if (term.includes(key) || synonyms.some((synonym) => term.includes(synonym) || synonym.includes(term))) {
        synonyms.forEach((synonym) => expanded.add(synonym));
        expanded.add(key);
      }
    });
  });

  return uniqueTerms([...expanded]);
};

const getGarageMatchingTerms = (garage) => {
  return uniqueTerms([
    ...splitTerms(garage.specialties),
    ...splitTerms(garage.services_catalog),
    ...splitTerms(garage.keywords),
    ...(Array.isArray(garage.service_names) ? garage.service_names : []).map((item) => String(item).trim().toLowerCase())
  ]);
};

const getMatchedTerms = (garageTerms, interventionTerms) => {
  if (garageTerms.length === 0 || interventionTerms.length === 0) {
    return [];
  }

  return garageTerms.filter((garageTerm) =>
    interventionTerms.some((interventionTerm) =>
      garageTerm.includes(interventionTerm) || interventionTerm.includes(garageTerm)
    )
  );
};

// Vérifie la disponibilité (basée sur work_hours)
const isGarageAvailable = (workHours, isOpen) => {
  if (!isOpen) return false;
  if (!workHours) return true; // Suppose ouvert par défaut
  
  try {
    const hoursData = JSON.parse(workHours);
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0-6 (dimanche à samedi)
    const currentTime = today.getHours() * 60 + today.getMinutes();

    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayKey = dayNames[dayOfWeek];

    if (!hoursData[dayKey]) return false;

    const [startStr, endStr] = hoursData[dayKey].split('-');
    const [startH, startM] = startStr.trim().split(':').map(Number);
    const [endH, endM] = endStr.trim().split(':').map(Number);

    const startTime = startH * 60 + startM;
    const endTime = endH * 60 + endM;

    return currentTime >= startTime && currentTime <= endTime;
  } catch (e) {
    return true; // Par défaut disponible si erreur parsing
  }
};

// Récupère les garages et les score
const matchGaragesForVehicle = async (vehicleId, maxDistance = 50) => {
  // Récupère le véhicule et l'utilisateur (pour les coordonnées)
  const vehicleResult = await pool.query(
    `SELECT v.id, v.user_id, u.latitude, u.longitude 
     FROM vehicules v 
     JOIN users u ON u.id = v.user_id 
     WHERE v.id = $1`,
    [vehicleId]
  );

  if (vehicleResult.rows.length === 0) {
    throw new Error('Vehicle not found');
  }

  const vehicle = vehicleResult.rows[0];
  
  if (!vehicle.latitude || !vehicle.longitude) {
    throw new Error('User location not set');
  }

  const latestInterventionResult = await pool.query(
    `SELECT type, description
     FROM interventions
     WHERE vehicle_id = $1
     ORDER BY date_intervention DESC
     LIMIT 1`,
    [vehicleId]
  );

  const latestIntervention = latestInterventionResult.rows[0] || null;
  const interventionTerms = buildInterventionKeywords(
    latestIntervention?.type,
    latestIntervention?.description
  );

  // Récupère tous les garages avec leurs services
  const garagesResult = await pool.query(`
    SELECT 
      g.id,
      g.name,
      g.adresse,
      g.latitude,
      g.longitude,
      g.rating,
      g.is_open,
      g.work_hours,
      g.description,
      g.telephone,
      g.email,
      g.specialties,
      g.services_catalog,
      g.keywords,
      AVG(gs.base_price)::NUMERIC(10,2) as avg_price,
      COUNT(gs.id) as services_count,
      ARRAY_AGG(DISTINCT LOWER(gs.name)) FILTER (WHERE gs.name IS NOT NULL) AS service_names
    FROM garages g
    LEFT JOIN garage_services gs ON gs.garage_id = g.id AND gs.is_active = true
    WHERE g.latitude IS NOT NULL AND g.longitude IS NOT NULL
    GROUP BY g.id
  `);

  // Calcule les scores
  const scoredGarages = garagesResult.rows
    .map((garage) => {
    // Distance
    const distance = calculateHaversineDistance(
      vehicle.latitude,
      vehicle.longitude,
      garage.latitude,
      garage.longitude
    );

      const isAvailable = isGarageAvailable(garage.work_hours, garage.is_open);
      const garageTerms = getGarageMatchingTerms(garage);
      const matchedTerms = getMatchedTerms(garageTerms, interventionTerms);
      const matchScore = interventionTerms.length > 0 && matchedTerms.length > 0
        ? Math.min(100, (matchedTerms.length / interventionTerms.length) * 100)
        : 0;

      // Scoring (normalisé 0-100)
      // Distance: plus proche = meilleur score (max 100 pour <1km, min 0 pour maxDistance)
      const distanceScore = Math.max(0, 100 - (distance / maxDistance) * 100);

      // Rating: directement 0-100 (supposé 0-5, donc *20)
      const ratingScore = (garage.rating || 3.5) * 20;

      // Prix: suppose prix moyen entre 50-500€, plus bas = meilleur
      const priceScore = garage.avg_price
        ? Math.max(0, 100 - (garage.avg_price / 500) * 100)
        : 50;

      // Disponibilité: +20 si disponible, -30 si non disponible
      const availabilityScore = isAvailable ? 20 : -30;

      // Score total (pondéré)
      const totalScore =
        distanceScore * 0.3 + // 30% distance
        ratingScore * 0.3 + // 30% rating
        priceScore * 0.2 + // 20% price
        availabilityScore * 0.2; // 20% availability

      return {
        garageId: garage.id,
        name: garage.name,
        adresse: garage.adresse,
        distance: Math.round(distance * 10) / 10,
        withinRadius: distance <= maxDistance,
        rating: garage.rating || 0,
        avgPrice: garage.avg_price ? parseFloat(garage.avg_price) : null,
        servicesCount: garage.services_count,
        isAvailable,
        telephone: garage.telephone,
        email: garage.email,
        description: garage.description,
        specialties: splitTerms(garage.specialties),
        servicesCatalog: splitTerms(garage.services_catalog),
        serviceNames: Array.isArray(garage.service_names) ? garage.service_names.filter(Boolean) : [],
        keywords: splitTerms(garage.keywords),
        interventionTerms,
        matchedTerms,
        matchScore: Math.round(matchScore * 10) / 10,
        matchLabel: matchedTerms.length > 0 ? 'Correspondance' : 'Aucune correspondance',
        scores: {
          distance: Math.round(distanceScore * 10) / 10,
          rating: Math.round(ratingScore * 10) / 10,
          price: Math.round(priceScore * 10) / 10,
          availability: Math.round(availabilityScore * 10) / 10,
          total: Math.round(totalScore * 10) / 10
        }
      };
    })
    .filter((garage) => garage.withinRadius);

  const garagesWithMatches = scoredGarages
    .filter((garage) => garage.matchedTerms.length > 0);

  const garagesToReturn = garagesWithMatches.length > 0 ? garagesWithMatches : scoredGarages;

  return garagesToReturn.sort((a, b) => {
    if (b.matchScore !== a.matchScore) {
      return b.matchScore - a.matchScore;
    }

    return b.scores.total - a.scores.total;
  });
};

module.exports = {
  calculateHaversineDistance,
  isGarageAvailable,
  matchGaragesForVehicle
};


