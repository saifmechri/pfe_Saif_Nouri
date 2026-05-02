const { pool } = require('../db');

const createAppointment = async ({ automobilisteUserId, garageId, appointmentDate, appointmentTime, description, notes }) => {
  const result = await pool.query(
    `INSERT INTO appointments (automobiliste_user_id, garage_id, appointment_date, appointment_time, description, notes)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [automobilisteUserId, garageId, appointmentDate, appointmentTime, description, notes]
  );
  return result.rows[0];
};

const getAppointmentById = async (appointmentId) => {
  const result = await pool.query(`SELECT * FROM appointments WHERE id = $1`, [appointmentId]);
  return result.rows[0];
};

const listAppointmentsForAutomobiliste = async (automobilisteUserId, { limit = 50, offset = 0, status = null } = {}) => {
  let q = `SELECT * FROM appointments WHERE automobiliste_user_id = $1`;
  const params = [automobilisteUserId];
  
  if (status) {
    q += ` AND status = $${params.length + 1}`;
    params.push(status);
  }
  
  q += ` ORDER BY appointment_date DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(limit, offset);
  
  const result = await pool.query(q, params);
  return result.rows;
};

const listAppointmentsForGarage = async (garageId, { limit = 50, offset = 0, status = null } = {}) => {
  let q = `SELECT * FROM appointments WHERE garage_id = $1`;
  const params = [garageId];
  
  if (status) {
    q += ` AND status = $${params.length + 1}`;
    params.push(status);
  }
  
  q += ` ORDER BY appointment_date DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(limit, offset);
  
  const result = await pool.query(q, params);
  return result.rows;
};

const updateAppointment = async (appointmentId, updates) => {
  const validFields = ['appointment_date', 'appointment_time', 'status', 'description', 'notes'];
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

  values.push(appointmentId);
  const q = `UPDATE appointments SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramCount} RETURNING *`;
  const result = await pool.query(q, values);
  return result.rows[0];
};

const deleteAppointment = async (appointmentId) => {
  await pool.query(`DELETE FROM appointments WHERE id = $1`, [appointmentId]);
  return true;
};

module.exports = {
  createAppointment,
  getAppointmentById,
  listAppointmentsForAutomobiliste,
  listAppointmentsForGarage,
  updateAppointment,
  deleteAppointment
};
