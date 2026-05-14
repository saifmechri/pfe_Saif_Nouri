/**
 * PUBLIC CONTROLLER - Exposes non-authenticated endpoints for public statistics
 * 
 * This controller handles public-facing API endpoints that do not require authentication.
 * Currently handles homepage statistics display (user counts, garage counts, pieces count, etc.)
 * 
 * Usage:
 * - Frontend Home page calls GET /api/public/stats to display ecosystem overview
 * - No authentication required - anyone can view platform statistics
 */

const { pool } = require('../db');
const sendApiResponse = (res, payload) => {
  const { statusCode = 200, success = true, message = null, data = null, error = null } = payload || {};
  return res.status(statusCode).json({ success, message, data, error });
};

/**
 * GET /api/public/stats
 * 
 * Retrieves aggregated platform statistics for public display.
 * Returns counts of:
 * - Active users (validated users only)
 * - Partner garages (validated garages only)
 * - Catalog pieces (validated pieces only)  
 * - Total interventions tracked
 * 
 * Response:
 * {
 *   success: true,
 *   data: {
 *     users: number,
 *     garages: number,
 *     pieces: number,
 *     interventions: number
 *   }
 * }
 * 
 * Usage Example:
 * fetch('/api/public/stats')
 *   .then(res => res.json())
 *   .then(data => console.log(data.data.users)) // Display 45 users
 */
const getPublicStats = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        (SELECT COUNT(*)::int FROM users WHERE COALESCE(is_validated, false) = true) AS users_count,
        (SELECT COUNT(*)::int FROM garages WHERE COALESCE(is_validated, false) = true) AS garages_count,
        (SELECT COUNT(*)::int FROM pieces WHERE COALESCE(is_validated, false) = true) AS pieces_count,
        (SELECT COUNT(*)::int FROM interventions) AS interventions_count
    `);

    const row = result.rows[0] || {};
    return sendApiResponse(res, {
      data: {
        users: Number(row.users_count || 0),
        garages: Number(row.garages_count || 0),
        pieces: Number(row.pieces_count || 0),
        interventions: Number(row.interventions_count || 0)
      }
    });
  } catch (err) {
    console.error('getPublicStats error', err);
    return sendApiResponse(res, { statusCode: 500, success: false, message: 'Erreur serveur' });
  }
};

module.exports = {
  getPublicStats
};
