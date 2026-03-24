const { Vehicle, User, Intervention, Garage } = require('../models');
const {
  calculateInterventionScore,
  calculateGarageScore,
  getUrgency,
  haversine
} = require('../utils/algorithms');

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
              const distance = haversine(
                userLat,
                userLon,
                garageLat,
                garageLon
              );
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
            .slice(0, 5);
          
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
    
    // 6️⃣ Trier par urgence + score
    allRecommendations.sort((a, b) => {
      const urgencyOrder = { 'URGENT': 0, 'RECOMMANDÉ': 1, 'FUTUR': 2 };
      const urgenciesDiff = urgencyOrder[a.intervention.urgence] - urgencyOrder[b.intervention.urgence];
      
      if (urgenciesDiff !== 0) return urgenciesDiff;
      return b.intervention.score - a.intervention.score;
    });
    
    console.log(`[RECOMMANDATIONS] Total trouvées: ${allRecommendations.length}`);
    
    return res.json({
      success: true,
      data: allRecommendations,
      count: allRecommendations.length
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
