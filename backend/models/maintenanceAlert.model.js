const { pool } = require('../db');

const createMaintenanceAlert = async ({ vehicleId, userId, alertType, kmTrigger, daysTrigger, lastKm, lastDate }) => {
  const result = await pool.query(
    `INSERT INTO maintenance_alerts (vehicle_id, user_id, alert_type, km_trigger, days_trigger, last_km, last_date)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [vehicleId, userId, alertType, kmTrigger, daysTrigger, lastKm, lastDate]
  );
  return result.rows[0];
};

const getAlertById = async (alertId) => {
  const result = await pool.query(`SELECT * FROM maintenance_alerts WHERE id = $1`, [alertId]);
  return result.rows[0];
};

const listAlertsForVehicle = async (vehicleId, { onlyActive = true } = {}) => {
  let q = `SELECT * FROM maintenance_alerts WHERE vehicle_id = $1`;
  const params = [vehicleId];
  
  if (onlyActive) {
    q += ` AND is_active = true`;
  }
  
  q += ` ORDER BY created_at DESC`;
  
  const result = await pool.query(q, params);
  return result.rows;
};

const listAlertsForUser = async (userId, { onlyActive = true } = {}) => {
  let q = `SELECT * FROM maintenance_alerts WHERE user_id = $1`;
  const params = [userId];
  
  if (onlyActive) {
    q += ` AND is_active = true`;
  }
  
  q += ` ORDER BY created_at DESC`;
  
  const result = await pool.query(q, params);
  return result.rows;
};

const updateAlert = async (alertId, updates) => {
  const fieldMap = {
    kmTrigger: 'km_trigger',
    daysTrigger: 'days_trigger',
    lastKm: 'last_km',
    lastDate: 'last_date',
    isActive: 'is_active',
    km_trigger: 'km_trigger',
    days_trigger: 'days_trigger',
    last_km: 'last_km',
    last_date: 'last_date',
    is_active: 'is_active'
  };
  const fields = [];
  const values = [];
  let paramCount = 1;

  for (const [inputKey, columnName] of Object.entries(fieldMap)) {
    if (Object.prototype.hasOwnProperty.call(updates, inputKey)) {
      fields.push(`${columnName} = $${paramCount}`);
      values.push(updates[inputKey]);
      paramCount++;
    }
  }

  if (fields.length === 0) return null;

  values.push(alertId);
  const q = `UPDATE maintenance_alerts SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramCount} RETURNING *`;
  const result = await pool.query(q, values);
  return result.rows[0];
};

const deleteAlert = async (alertId) => {
  await pool.query(`DELETE FROM maintenance_alerts WHERE id = $1`, [alertId]);
  return true;
};

const checkDueAlerts = async (vehicleId, currentKm, currentDate) => {
  // Retourne les alertes qui sont dues (basé sur km ou jours)
  const result = await pool.query(
    `SELECT * FROM maintenance_alerts 
     WHERE vehicle_id = $1 AND is_active = true
     AND (
       (km_trigger IS NOT NULL AND last_km IS NOT NULL AND ($2 - last_km) >= km_trigger)
       OR
       (days_trigger IS NOT NULL AND last_date IS NOT NULL AND ((COALESCE($3::date, CURRENT_DATE) - last_date) >= days_trigger))
     )`,
    [vehicleId, currentKm, currentDate || null]
  );
  return result.rows;
};

module.exports = {
  createMaintenanceAlert,
  getAlertById,
  listAlertsForVehicle,
  listAlertsForUser,
  updateAlert,
  deleteAlert,
  checkDueAlerts
};


