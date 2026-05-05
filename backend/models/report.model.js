const { pool } = require('../db');

// Creates a new report entry submitted by a user.
const createReport = async ({ reporter_user_id, reported_entity_type, reported_entity_id, reason, details }) => {
  const result = await pool.query(
    `INSERT INTO reports (reporter_user_id, reported_entity_type, reported_entity_id, reason, details)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [reporter_user_id || null, reported_entity_type, reported_entity_id || null, reason || null, details || null]
  );
  return result.rows[0];
};

// Returns the reports that are still pending moderation.
const getPendingReports = async ({ limit = 50, offset = 0 } = {}) => {
  const result = await pool.query(
    `SELECT * FROM reports WHERE status = 'pending' ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return result.rows;
};

// Fetches a report by its identifier.
const getReportById = async (id) => {
  const result = await pool.query(`SELECT * FROM reports WHERE id = $1`, [id]);
  return result.rows[0];
};

// Updates the report status after admin review.
const updateReportStatus = async (id, { status, action_taken, handled_by }) => {
  const result = await pool.query(
    `UPDATE reports SET status = $1, action_taken = $2, handled_by = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4 RETURNING *`,
    [status, action_taken || null, handled_by || null, id]
  );
  return result.rows[0];
};

// Deletes a report entry when it needs to be removed completely.
const deleteReport = async (id) => {
  const result = await pool.query(`DELETE FROM reports WHERE id = $1 RETURNING *`, [id]);
  return result.rows[0];
};

module.exports = {
  createReport,
  getPendingReports,
  getReportById,
  updateReportStatus,
  deleteReport
};
