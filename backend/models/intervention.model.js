const { pool } = require('../db');

const createIntervention = async ({ vehicleId, dateIntervention, type, description, garageNom, garageAdresse, kilometrage, coutTotal, kmRecommande, joursRecommandes }) => {
  const result = await pool.query(
    `INSERT INTO interventions (vehicle_id, date_intervention, type, description, garage_nom, garage_adresse, kilometrage, cout_total, km_recommande, jours_recommandes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
    [vehicleId, dateIntervention, type, description, garageNom, garageAdresse, kilometrage, coutTotal, kmRecommande, joursRecommandes]
  );
  return result.rows[0];
};

const getInterventionById = async (id) => {
  const result = await pool.query('SELECT * FROM interventions WHERE id = $1', [id]);
  return result.rows[0] || null;
};

const listInterventionsForVehicle = async (vehicleId, { limit = 50, offset = 0 } = {}) => {
  const q = `SELECT * FROM interventions WHERE vehicle_id = $1 ORDER BY date_intervention DESC LIMIT $2 OFFSET $3`;
  const result = await pool.query(q, [vehicleId, limit, offset]);
  return result.rows;
};

const listInterventionsForUser = async (userId, { limit = 50, offset = 0 } = {}) => {
  const q = `SELECT i.* FROM interventions i JOIN vehicules v ON v.id = i.vehicle_id WHERE v.user_id = $1 ORDER BY i.date_intervention DESC LIMIT $2 OFFSET $3`;
  const result = await pool.query(q, [userId, limit, offset]);
  return result.rows;
};

const updateIntervention = async (id, updates) => {
  const validFields = ['date_intervention', 'type', 'description', 'garage_nom', 'garage_adresse', 'kilometrage', 'cout_total', 'km_recommande', 'jours_recommandes'];
  const fields = [];
  const values = [];
  let paramCount = 1;

  for (const field of validFields) {
    if (field in updates) {
      fields.push(`${field} = $${paramCount}`);
      values.push(updates[field]);
      paramCount++;
    }
  }

  if (fields.length === 0) return null;

  values.push(id);
  const q = `UPDATE interventions SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramCount} RETURNING *`;
  const result = await pool.query(q, values);
  return result.rows[0] || null;
};

const deleteIntervention = async (id) => {
  await pool.query('DELETE FROM interventions WHERE id = $1', [id]);
  return true;
};

module.exports = {
  createIntervention,
  getInterventionById,
  listInterventionsForVehicle,
  listInterventionsForUser,
  updateIntervention,
  deleteIntervention
};


