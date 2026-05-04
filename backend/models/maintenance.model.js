const { pool } = require('../db');

const calculateNextRevisionForVehicle = async (vehicleId) => {
  // Récupère la dernière intervention
  const latestInterventionResult = await pool.query(
    `SELECT * FROM interventions WHERE vehicle_id = $1 ORDER BY date_intervention DESC LIMIT 1`,
    [vehicleId]
  );
  
  if (latestInterventionResult.rows.length === 0) {
    return null; // Pas d'intervention enregistrée
  }
  
  const latestIntervention = latestInterventionResult.rows[0];

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
  if (latestIntervention.km_recommande) {
    nextRevisionKm = latestIntervention.kilometrage + latestIntervention.km_recommande;
  }

  // Calcule la prochaine révision basée sur les jours
  let nextRevisionDate = null;
  if (latestIntervention.jours_recommandes) {
    const lastDate = new Date(latestIntervention.date_intervention);
    nextRevisionDate = new Date(lastDate.getTime() + latestIntervention.jours_recommandes * 24 * 60 * 60 * 1000);
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
    nextRevisionKm,
    nextRevisionDate: nextRevisionDate ? nextRevisionDate.toISOString().split('T')[0] : null,
    kmProgressPercent: Math.round(kmProgressPercent * 10) / 10,
    daysProgressPercent: Math.round(daysProgressPercent * 10) / 10,
    isKmCritical: nextRevisionKm && currentKm >= nextRevisionKm,
    isDateCritical: nextRevisionDate && new Date() >= nextRevisionDate
  };
};

module.exports = {
  calculateNextRevisionForVehicle
};
