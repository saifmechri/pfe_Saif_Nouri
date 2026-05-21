import API from './api';

// GET - Récupérer la prochaine révision pour un véhicule
export const getNextRevision = (vehicleId) => {
  return API.get(`/maintenance/${vehicleId}/next-revision`).then((res) => res.data?.data ?? res.data);
};

// GET - Récupérer les garages recommandés avec matching
export const getMatchingGarages = (vehicleId, maxDistance = 50) => {
  return API.get(`/garages/match/${vehicleId}?maxDistance=${maxDistance}`).then((res) => res.data?.data ?? res.data ?? []);
};

// Calcule le niveau d'urgence basé sur les données de révision
export const calculateUrgencyLevel = (revisionData) => {
  if (!revisionData) return null;

  const kmCritical = revisionData.isKmCritical;
  const dateCritical = revisionData.isDateCritical;
  const kmProgress = revisionData.kmProgressPercent || 0;
  const daysProgress = revisionData.daysProgressPercent || 0;
  const maxProgress = Math.max(kmProgress, daysProgress);

  // Niveau 1: URGENT
  if (kmCritical || dateCritical || maxProgress >= 95) {
    return { level: 'urgent', label: 'URGENT', color: 'red', priority: 2 };
  }

  // Niveau 2: BIENTÔT
  if (maxProgress >= 70) {
    return { level: 'bientot', label: 'BIENTÔT', color: 'orange', priority: 1 };
  }

  // Niveau 3: AUCUN
  return { level: 'aucun', label: 'AUCUN', color: 'green', priority: 0 };
};

// Formate la date au format français
export const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  return date.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};


