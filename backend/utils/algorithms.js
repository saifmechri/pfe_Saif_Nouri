/**
 * 📊 ALGORITHMES DE RECOMMANDATION
 * Fonctions de scoring pour interventions et garages
 */

/**
 * ✅ FONCTION 1: Calculer distance Haversine entre 2 points GPS
 */
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371; // Rayon Terre en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return parseFloat(distance.toFixed(2));
}

/**
 * ✅ FONCTION 2: Convertir distance en score (0-10)
 */
function getDistanceScore(distanceKm) {
  if (distanceKm < 5) return 10;
  if (distanceKm < 10) return 8;
  if (distanceKm < 20) return 6;
  if (distanceKm < 30) return 4;
  return 2;
}

/**
 * ✅ FONCTION 3: Calculer score intervalle kilométrage (0-100)
 */
function getKilometrationScore(kmActuel, kmRecommande) {
  if (!kmRecommande) return 0;
  const percentage = (kmActuel / kmRecommande) * 100;
  return Math.min(percentage, 100);
}

/**
 * ✅ FONCTION 4: Calculer score intervalle temps (0-100)
 */
function getDateScore(dateLastIntervention, joursRecommandes) {
  if (!joursRecommandes) return 0;
  
  const now = new Date();
  const diffMs = now - new Date(dateLastIntervention);
  const joursEcoules = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  const percentage = (joursEcoules / joursRecommandes) * 100;
  return Math.min(percentage, 100);
}

/**
 * ✅ FONCTION 5: Convertir rating (0-5) en score (0-10)
 */
function getRatingScore(rating) {
  if (!rating) return 5;
  return (rating / 5) * 10;
}

/**
 * ✅ FONCTION 6: Score disponibilité du garage
 */
function getAvailabilityScore(garage) {
  if (garage.isOpen) return 10;
  return 0;
}

/**
 * ✅ FONCTION 7: Calculer score TOTAL d'une intervention
 * Poids: Kilométrage 40% + Date 30% + Type véhicule 10%
 */
function calculateInterventionScore(vehicle, lastIntervention, interventionType) {
  let score = 0;
  
  // 1. Score kilométrage (40%)
  if (interventionType.km_recommande) {
    const kmScore = getKilometrationScore(vehicle.kilometrage, interventionType.km_recommande);
    score += (kmScore / 100) * 40;
  }
  
  // 2. Score date (30%)
  if (lastIntervention && interventionType.jours_recommandes) {
    const dateScore = getDateScore(lastIntervention.date_intervention || lastIntervention.createdAt, interventionType.jours_recommandes);
    score += (dateScore / 100) * 30;
  }
  
  // 3. Score type véhicule (10%)
  let vehicleTypeMultiplier = 1.0;
  if (vehicle.type === 'Diesel') vehicleTypeMultiplier = 1.2;
  if (vehicle.type === 'SUV') vehicleTypeMultiplier = 1.15;
  if (vehicle.type === 'Électrique') vehicleTypeMultiplier = 0.8;
  
  score += vehicleTypeMultiplier * 10;
  
  return Math.min(score, 100);
}

/**
 * ✅ FONCTION 8: Calculer score TOTAL d'un garage
 * Poids: Distance 40% + Rating 35% + Disponibilité 25%
 */
function calculateGarageScore(userLat, userLon, garage) {
  let score = 0;
  
  // 1. Distance (40%)
  const distance = haversine(userLat, userLon, garage.latitude, garage.longitude);
  const distanceScore = getDistanceScore(distance);
  score += (distanceScore / 10) * 40;
  
  // 2. Rating (35%)
  const ratingScore = getRatingScore(garage.rating);
  score += (ratingScore / 10) * 35;
  
  // 3. Disponibilité (25%)
  const availabilityScore = getAvailabilityScore(garage);
  score += (availabilityScore / 10) * 25;
  
  return parseFloat(score.toFixed(2));
}

/**
 * ✅ DÉTERMINER URGENCE basé sur le kilométrage
 * Règles:
 * - km_actuel >= km_recommande => URGENT
 * - km_restant <= 1000 => RECOMMANDÉ
 * - sinon => FUTUR
 */
function getUrgency(kmActuel, kmRecommande) {
  const current = Number(kmActuel);
  const recommended = Number(kmRecommande);

  if (!Number.isFinite(current) || !Number.isFinite(recommended) || recommended <= 0) {
    return 'FUTUR';
  }

  const remaining = Math.max(0, recommended - current);

  if (current >= recommended) return 'URGENT';
  if (remaining <= 1000) return 'RECOMMANDÉ';
  return 'FUTUR';
}

module.exports = {
  haversine,
  getDistanceScore,
  getKilometrationScore,
  getDateScore,
  getRatingScore,
  getAvailabilityScore,
  calculateInterventionScore,
  calculateGarageScore,
  getUrgency
};
