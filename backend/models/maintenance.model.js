const { pool } = require('../db');

const DEFAULT_KM_RECOMMENDED = 5000;
const DEFAULT_DAYS_RECOMMENDED = 180;

const calculateNextRevisionForVehicle = async (vehicleId) => {
  const latestInterventionResult = await pool.query(
    `SELECT *
     FROM interventions
     WHERE vehicle_id = $1
     ORDER BY
       CASE WHEN km_recommande IS NOT NULL AND km_recommande > 0 AND jours_recommandes IS NOT NULL AND jours_recommandes > 0 THEN 0 ELSE 1 END,
       date_intervention DESC,
       created_at DESC,
       id DESC
     LIMIT 1`,
    [vehicleId]
  );

  if (latestInterventionResult.rows.length === 0) {
    return null; // Pas d'intervention enregistrée
  }

  const latestIntervention = latestInterventionResult.rows[0];
  const hasValidRecommendation =
    Number(latestIntervention.km_recommande) > 0 &&
    Number(latestIntervention.jours_recommandes) > 0;
  const kmRecommended = hasValidRecommendation
    ? Number(latestIntervention.km_recommande)
    : DEFAULT_KM_RECOMMENDED;
  const daysRecommended = hasValidRecommendation
    ? Number(latestIntervention.jours_recommandes)
    : DEFAULT_DAYS_RECOMMENDED;

  // Récupère le véhicule pour accéder au km courant
  const vehicleResult = await pool.query(
    `SELECT kilometrage_voiture FROM vehicules WHERE id = $1`,
    [vehicleId]
  );
  
  if (vehicleResult.rows.length === 0) {
    throw new Error('Vehicle not found');
  }
  
  const currentKm = vehicleResult.rows[0].kilometrage_voiture || 0;

  // Calcule la prochaine révision basée sur les km
  let nextRevisionKm = null;
  if (Number.isFinite(Number(latestIntervention.kilometrage))) {
    nextRevisionKm = Number(latestIntervention.kilometrage) + kmRecommended;
  }

  // Calcule la prochaine révision basée sur les jours
  let nextRevisionDate = null;
  if (daysRecommended > 0) {
    const lastDate = new Date(latestIntervention.date_intervention);
    nextRevisionDate = new Date(lastDate.getTime() + daysRecommended * 24 * 60 * 60 * 1000);
  }

  // Calcule les pourcentages de progression
  let kmProgressPercent = 0;
  if (nextRevisionKm) {
    kmProgressPercent = Math.min(100, (currentKm / nextRevisionKm) * 100);
  }

  let daysProgressPercent = 0;
  if (nextRevisionDate) {
    const today = new Date();
    const lastDate = new Date(latestIntervention.date_intervention);
    const totalDays = latestIntervention.jours_recommandes;
    const daysPassed = Math.floor((today - lastDate) / (24 * 60 * 60 * 1000));
    daysProgressPercent = Math.min(100, (daysPassed / totalDays) * 100);
  }

  // Retourne l'information de révision
  return {
    vehicleId,
    currentKm,
    lastInterventionId: latestIntervention.id,
    lastInterventionDate: latestIntervention.date_intervention,
    lastInterventionKm: latestIntervention.kilometrage,
    lastInterventionType: latestIntervention.type,
    kmRecommended,
    daysRecommended,
    recommendationSource: hasValidRecommendation ? 'database' : 'fallback-default',
    nextRevisionKm,
    nextRevisionDate: nextRevisionDate ? nextRevisionDate.toISOString().split('T')[0] : null,
    kmProgressPercent: Math.round(kmProgressPercent * 10) / 10,
    daysProgressPercent: Math.round(daysProgressPercent * 10) / 10,
    isKmCritical: Boolean(nextRevisionKm) && currentKm >= nextRevisionKm,
    isDateCritical: Boolean(nextRevisionDate) && new Date() >= nextRevisionDate
  };
};

module.exports = {
  calculateNextRevisionForVehicle
};
