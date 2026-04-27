/**
 * Calcule la distance entre deux points géographiques en kilomètres (Haversine formula)
 * @param {number} lat1 - Latitude du point 1
 * @param {number} lon1 - Longitude du point 1
 * @param {number} lat2 - Latitude du point 2
 * @param {number} lon2 - Longitude du point 2
 * @returns {number} Distance en kilomètres
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
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
  const distance = R * c;
  return Math.round(distance * 100) / 100; // Arrondir à 2 décimales
};

/**
 * Formate la distance pour l'affichage
 * @param {number} distance - Distance en km
 * @returns {string} Distance formatée
 */
export const formatDistance = (distance) => {
  if (distance < 1) {
    return `${Math.round(distance * 1000)} m`;
  }
  return `${distance.toFixed(1)} km`;
};

/**
 * Obtient la couleur basée sur la distance
 * @param {number} distance - Distance en km
 * @returns {string} Classe Tailwind pour la couleur
 */
export const getDistanceColor = (distance) => {
  if (distance <= 5) return "text-emerald-600 bg-emerald-50 border-emerald-200";
  if (distance <= 15) return "text-blue-600 bg-blue-50 border-blue-200";
  if (distance <= 30) return "text-amber-600 bg-amber-50 border-amber-200";
  return "text-slate-600 bg-slate-50 border-slate-200";
};

/**
 * Obtient l'étiquette de distance
 * @param {number} distance - Distance en km
 * @returns {string} Label descriptif
 */
export const getDistanceLabel = (distance) => {
  if (distance <= 5) return "Très proche";
  if (distance <= 15) return "Proche";
  if (distance <= 30) return "À proximité";
  return "Loin";
};
