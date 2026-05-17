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
  const distance = Number(distanceKm);
  if (!Number.isFinite(distance) || distance < 0) return 0;

  const score = 10 - (distance * 0.35);
  return Math.max(1, Number(score.toFixed(2)));
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
  const parsed = Number(rating);
  if (!Number.isFinite(parsed) || parsed <= 0) return 0;
  return Math.max(0, Math.min(10, (parsed / 5) * 10));
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
  // Backwards-compatible: return scalar total using detailed breakdown
  const detail = calculateInterventionScoreDetailed(vehicle, lastIntervention, interventionType);
  return Math.min(detail.total, 100);
}

function calculateInterventionScoreDetailed(vehicle, lastIntervention, interventionType) {
  // km score (0-100) -> weight 40%
  const kmScorePercent = interventionType.km_recommande ? getKilometrationScore(vehicle.kilometrage, interventionType.km_recommande) : 0;
  const kmContribution = (kmScorePercent / 100) * 40;

  // date score (0-100) -> weight 30%
  const dateScorePercent = lastIntervention && interventionType.jours_recommandes ? getDateScore(lastIntervention.date_intervention || lastIntervention.createdAt, interventionType.jours_recommandes) : 0;
  const dateContribution = (dateScorePercent / 100) * 30;

  // vehicle type contribution (base 10 scaled by multiplier)
  let vehicleTypeMultiplier = 1.0;
  if (vehicle.type === 'Diesel') vehicleTypeMultiplier = 1.2;
  if (vehicle.type === 'SUV') vehicleTypeMultiplier = 1.15;
  if (vehicle.type === 'Électrique') vehicleTypeMultiplier = 0.8;
  const typeContribution = vehicleTypeMultiplier * 10;

  const totalRaw = kmContribution + dateContribution + typeContribution;
  const total = Math.min(totalRaw, 100);

  return {
    total: parseFloat(total.toFixed(2)),
    kmScorePercent: parseFloat(kmScorePercent.toFixed(2)),
    kmContribution: parseFloat(kmContribution.toFixed(2)),
    dateScorePercent: parseFloat(dateScorePercent.toFixed(2)),
    dateContribution: parseFloat(dateContribution.toFixed(2)),
    vehicleTypeMultiplier,
    typeContribution: parseFloat(typeContribution.toFixed(2))
  };
}

/**
 * ✅ FONCTION 8: Calculer score TOTAL d'un garage
 * Poids: Distance 40% + Rating 35% + Disponibilité 25%
 */
function calculateGarageScore(userLat, userLon, garage) {
  const detail = calculateGarageScoreDetailed(userLat, userLon, garage);
  return parseFloat(detail.total.toFixed(2));
}

function calculateGarageScoreDetailed(userLat, userLon, garage) {
  const garageLat = Number(garage.latitude);
  const garageLon = Number(garage.longitude);
  const hasGps = Number.isFinite(garageLat) && Number.isFinite(garageLon);
  const distanceKm = hasGps ? haversine(userLat, userLon, garageLat, garageLon) : null;

  const distanceScore0to10 = distanceKm !== null ? getDistanceScore(distanceKm) : 0;
  const distanceContribution = (distanceScore0to10 / 10) * 40;

  const ratingScore0to10 = getRatingScore(garage.rating);
  const ratingContribution = (ratingScore0to10 / 10) * 35;

  const availabilityScore0to10 = getAvailabilityScore(garage);
  const availabilityContribution = (availabilityScore0to10 / 10) * 25;

  const totalRaw = distanceContribution + ratingContribution + availabilityContribution;
  const total = parseFloat(Math.min(totalRaw, 100).toFixed(2));

  return {
    total,
    distanceKm,
    distanceScore0to10: parseFloat(distanceScore0to10.toFixed(2)),
    distanceContribution: parseFloat(distanceContribution.toFixed(2)),
    ratingScore0to10: parseFloat(ratingScore0to10.toFixed(2)),
    ratingContribution: parseFloat(ratingContribution.toFixed(2)),
    availabilityScore0to10: parseFloat(availabilityScore0to10.toFixed(2)),
    availabilityContribution: parseFloat(availabilityContribution.toFixed(2))
  };
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
  calculateInterventionScoreDetailed,
  calculateGarageScore,
  calculateGarageScoreDetailed,
  getUrgency
};


