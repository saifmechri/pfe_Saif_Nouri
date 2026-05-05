const { pool } = require('../db');

/**
 * Log an audit action to the database.
 * @param {Object} opts
 * @param {string} opts.adminEmail - admin email who performed the action
 * @param {string} opts.action - short action key (approve_user, delete_garage...)
 * @param {string} [opts.entity] - entity type (user, garage, piece)
 * @param {number} [opts.entityId] - id of the affected entity
 * @param {Object} [opts.details] - additional details (will be stored as JSONB)
 * @param {string} [opts.ip]
 * @param {string} [opts.userAgent]
 */
async function logAction({ adminEmail, action, entity = null, entityId = null, details = null, ip = null, userAgent = null }) {
  try {
    const query = `INSERT INTO audit_logs (admin_email, action, entity, entity_id, details, ip, user_agent) VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7)`;
    const params = [adminEmail || null, action, entity, entityId, details ? JSON.stringify(details) : null, ip || null, userAgent || null];
    await pool.query(query, params);
  } catch (err) {
    console.error('auditService.logAction error', err);
    // swallow errors to avoid breaking primary flows
  }
}

module.exports = { logAction };
