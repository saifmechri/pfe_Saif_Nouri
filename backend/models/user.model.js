const { pool } = require('../db');

const createUser = async ({ name, email, password, phone, roleId }) => {
  const result = await pool.query(
    `INSERT INTO users(name, email, password, phone, role_id, is_validated)
     VALUES($1, $2, $3, $4, $5, $6)
     RETURNING id, name, email, phone, role_id, created_at`,
    [name, email, password, phone, roleId, true]
  );

  return result.rows[0] || null;
};

const findUserByEmail = async (email) => {
  const result = await pool.query(
    `SELECT u.id, u.name, u.email, u.password, u.phone, u.role_id, u.is_validated, u.store_name, u.store_address, u.store_description, u.store_hours, u.store_specialties, u.store_services, u.created_at, u.updated_at, r.name as role_name
     FROM users u
     JOIN roles r ON u.role_id = r.id
     WHERE u.email = $1`,
    [email]
  );

  return result.rows[0] || null;
};

const emailExists = async (email) => {
  const result = await pool.query('SELECT 1 FROM users WHERE email = $1 LIMIT 1', [email]);
  return result.rows.length > 0;
};

const findUserForAuthById = async (userId) => {
  const result = await pool.query(
    `SELECT u.id, u.name, u.email, u.phone, u.store_name, u.store_address, u.store_description, u.store_hours, u.store_specialties, u.store_services, u.created_at, u.updated_at, r.name as role
     FROM users u
     JOIN roles r ON u.role_id = r.id
     WHERE u.id = $1`,
    [userId]
  );

  return result.rows[0] || null;
};

const hasRole = async (userId, roleName) => {
  const result = await pool.query(
    `SELECT 1
     FROM users u
     JOIN roles r ON u.role_id = r.id
     WHERE u.id = $1 AND r.name = $2
     LIMIT 1`,
    [userId, roleName]
  );

  return result.rows.length > 0;
};

module.exports = {
  createUser,
  findUserByEmail,
  emailExists,
  findUserForAuthById,
  hasRole
};


