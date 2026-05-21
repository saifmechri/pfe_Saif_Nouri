const { pool } = require('../db');

const findGarageIdentityById = async (garageId) => {
  const result = await pool.query('SELECT id, user_id FROM garages WHERE id = $1', [garageId]);
  return result.rows[0] || null;
};

const findGarageIdentityByUserId = async (userId) => {
  const result = await pool.query('SELECT id, user_id FROM garages WHERE user_id = $1', [userId]);
  return result.rows[0] || null;
};

module.exports = {
  findGarageIdentityById,
  findGarageIdentityByUserId
};


