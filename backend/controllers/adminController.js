const jwt = require('jsonwebtoken');
const { pool } = require('../db');
const { sendApiResponse } = require('../utils/apiResponse');

const SECRET = process.env.JWT_SECRET || 'jwt_secret_key';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin123@gmail.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@admin0';

// Admin login: checks the predefined credentials and returns a JWT reserved for admin routes.
const login = async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return sendApiResponse(res, { statusCode: 400, success: false, message: 'Email et mot de passe requis', error: { code: 'VALIDATION_ERROR' } });

    if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
      return sendApiResponse(res, { statusCode: 401, success: false, message: 'Identifiants admin invalides', error: { code: 'INVALID_ADMIN_CREDENTIALS' } });
    }

    const token = jwt.sign({ admin: true, email: ADMIN_EMAIL }, SECRET, { expiresIn: '7d' });

    return sendApiResponse(res, { message: 'Admin login success', data: { token } , extra: { token } });
  } catch (err) {
    console.error('Admin login error', err);
    return sendApiResponse(res, { statusCode: 500, success: false, message: 'Erreur serveur', error: { code: 'INTERNAL_SERVER_ERROR' } });
  }
};

// Returns all user accounts that are still waiting for admin validation.
const listPendingUsers = async (req, res) => {
  try {
    const result = await pool.query(`SELECT u.id, u.name, u.email, u.phone, u.created_at, r.name as role FROM users u JOIN roles r ON u.role_id = r.id WHERE coalesce(u.is_validated,false) = false ORDER BY u.created_at DESC`);
    return sendApiResponse(res, { message: 'Utilisateurs en attente', data: { items: result.rows } });
  } catch (err) {
    console.error('listPendingUsers', err);
    return sendApiResponse(res, { statusCode: 500, success: false, message: 'Erreur serveur', error: { code: 'INTERNAL_SERVER_ERROR' } });
  }
};

// Approves a user account by switching the validation flag to true.
const approveUser = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return sendApiResponse(res, { statusCode: 400, success: false, message: 'Identifiant invalide', error: { code: 'INVALID_ID' } });

    const result = await pool.query('UPDATE users SET is_validated = true, updated_at = NOW() WHERE id = $1 RETURNING id, name, email, role_id', [id]);
    if (result.rows.length === 0) return sendApiResponse(res, { statusCode: 404, success: false, message: 'Utilisateur introuvable', error: { code: 'USER_NOT_FOUND' } });

    return sendApiResponse(res, { message: 'Utilisateur approuve', data: { user: result.rows[0] } });
  } catch (err) {
    console.error('approveUser', err);
    return sendApiResponse(res, { statusCode: 500, success: false, message: 'Erreur serveur', error: { code: 'INTERNAL_SERVER_ERROR' } });
  }
};

// Rejects a user account by deleting it from the users table.
const rejectUser = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return sendApiResponse(res, { statusCode: 400, success: false, message: 'Identifiant invalide', error: { code: 'INVALID_ID' } });

    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) return sendApiResponse(res, { statusCode: 404, success: false, message: 'Utilisateur introuvable', error: { code: 'USER_NOT_FOUND' } });

    return sendApiResponse(res, { message: 'Utilisateur rejete et supprime', data: null });
  } catch (err) {
    console.error('rejectUser', err);
    return sendApiResponse(res, { statusCode: 500, success: false, message: 'Erreur serveur', error: { code: 'INTERNAL_SERVER_ERROR' } });
  }
};

// Returns all garages for admin management
const listGarages = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT g.id, g.name, g.adresse, g.email, g.telephone, g.is_open, COALESCE(g.is_validated,false) as is_validated, u.email as user_email, u.name as user_name, g.created_at, g.updated_at 
      FROM garages g 
      LEFT JOIN users u ON g.user_id = u.id 
      ORDER BY g.created_at DESC 
      LIMIT 100
    `);
    return sendApiResponse(res, { message: 'Garages list', data: { items: result.rows } });
  } catch (err) {
    console.error('listGarages error', err);
    return sendApiResponse(res, { statusCode: 500, success: false, message: 'Erreur serveur', error: { code: 'INTERNAL_SERVER_ERROR' } });
  }
};

// Deactivate a garage
const deactivateGarage = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return sendApiResponse(res, { statusCode: 400, success: false, message: 'Identifiant invalide', error: { code: 'INVALID_ID' } });

    const result = await pool.query('UPDATE garages SET is_open = false, updated_at = NOW() WHERE id = $1 RETURNING id, name, is_open', [id]);
    if (result.rows.length === 0) return sendApiResponse(res, { statusCode: 404, success: false, message: 'Garage introuvable', error: { code: 'GARAGE_NOT_FOUND' } });

    return sendApiResponse(res, { message: 'Garage désactivé', data: { garage: result.rows[0] } });
  } catch (err) {
    console.error('deactivateGarage error', err);
    return sendApiResponse(res, { statusCode: 500, success: false, message: 'Erreur serveur', error: { code: 'INTERNAL_SERVER_ERROR' } });
  }
};

// Delete a garage
const deleteGarageAdmin = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return sendApiResponse(res, { statusCode: 400, success: false, message: 'Identifiant invalide', error: { code: 'INVALID_ID' } });

    const result = await pool.query('DELETE FROM garages WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) return sendApiResponse(res, { statusCode: 404, success: false, message: 'Garage introuvable', error: { code: 'GARAGE_NOT_FOUND' } });

    return sendApiResponse(res, { message: 'Garage supprimé', data: null });
  } catch (err) {
    console.error('deleteGarageAdmin error', err);
    return sendApiResponse(res, { statusCode: 500, success: false, message: 'Erreur serveur', error: { code: 'INTERNAL_SERVER_ERROR' } });
  }
};

// Approve a garage (mark is_validated = true)
const approveGarage = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return sendApiResponse(res, { statusCode: 400, success: false, message: 'Identifiant invalide', error: { code: 'INVALID_ID' } });

    const result = await pool.query('UPDATE garages SET is_validated = true, updated_at = NOW() WHERE id = $1 RETURNING id, name, is_validated', [id]);
    if (result.rows.length === 0) return sendApiResponse(res, { statusCode: 404, success: false, message: 'Garage introuvable', error: { code: 'GARAGE_NOT_FOUND' } });

    return sendApiResponse(res, { message: 'Garage approuvé', data: { garage: result.rows[0] } });
  } catch (err) {
    console.error('approveGarage error', err);
    return sendApiResponse(res, { statusCode: 500, success: false, message: 'Erreur serveur', error: { code: 'INTERNAL_SERVER_ERROR' } });
  }
};

// Reject a garage (delete)
const rejectGarage = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return sendApiResponse(res, { statusCode: 400, success: false, message: 'Identifiant invalide', error: { code: 'INVALID_ID' } });

    const result = await pool.query('DELETE FROM garages WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) return sendApiResponse(res, { statusCode: 404, success: false, message: 'Garage introuvable', error: { code: 'GARAGE_NOT_FOUND' } });

    return sendApiResponse(res, { message: 'Garage rejeté et supprimé', data: null });
  } catch (err) {
    console.error('rejectGarage error', err);
    return sendApiResponse(res, { statusCode: 500, success: false, message: 'Erreur serveur', error: { code: 'INTERNAL_SERVER_ERROR' } });
  }
};

// Returns all pieces for admin management
const listPieces = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.id, p.nom, p.reference, p.prix_unitaire, p.stock, p.condition, p.marque, p.modele, COALESCE(p.is_validated,false) as is_validated, u.email as user_email, u.name as user_name, p.created_at, p.updated_at 
      FROM pieces p 
      LEFT JOIN users u ON p.user_id = u.id 
      ORDER BY p.created_at DESC 
      LIMIT 100
    `);
    return sendApiResponse(res, { message: 'Pieces list', data: { items: result.rows } });
  } catch (err) {
    console.error('listPieces error', err);
    return sendApiResponse(res, { statusCode: 500, success: false, message: 'Erreur serveur', error: { code: 'INTERNAL_SERVER_ERROR' } });
  }
};

// Delete a piece
const deletePieceAdmin = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return sendApiResponse(res, { statusCode: 400, success: false, message: 'Identifiant invalide', error: { code: 'INVALID_ID' } });

    const result = await pool.query('DELETE FROM pieces WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) return sendApiResponse(res, { statusCode: 404, success: false, message: 'Piece introuvable', error: { code: 'PIECE_NOT_FOUND' } });

    return sendApiResponse(res, { message: 'Piece supprimée', data: null });
  } catch (err) {
    console.error('deletePieceAdmin error', err);
    return sendApiResponse(res, { statusCode: 500, success: false, message: 'Erreur serveur', error: { code: 'INTERNAL_SERVER_ERROR' } });
  }
};

// Approve a piece (mark is_validated = true)
const approvePiece = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return sendApiResponse(res, { statusCode: 400, success: false, message: 'Identifiant invalide', error: { code: 'INVALID_ID' } });

    const result = await pool.query('UPDATE pieces SET is_validated = true, updated_at = NOW() WHERE id = $1 RETURNING id, nom, is_validated', [id]);
    if (result.rows.length === 0) return sendApiResponse(res, { statusCode: 404, success: false, message: 'Piece introuvable', error: { code: 'PIECE_NOT_FOUND' } });

    return sendApiResponse(res, { message: 'Piece approuvée', data: { piece: result.rows[0] } });
  } catch (err) {
    console.error('approvePiece error', err);
    return sendApiResponse(res, { statusCode: 500, success: false, message: 'Erreur serveur', error: { code: 'INTERNAL_SERVER_ERROR' } });
  }
};

// Reject a piece (delete)
const rejectPiece = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return sendApiResponse(res, { statusCode: 400, success: false, message: 'Identifiant invalide', error: { code: 'INVALID_ID' } });

    const result = await pool.query('DELETE FROM pieces WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) return sendApiResponse(res, { statusCode: 404, success: false, message: 'Piece introuvable', error: { code: 'PIECE_NOT_FOUND' } });

    return sendApiResponse(res, { message: 'Piece rejetée et supprimée', data: null });
  } catch (err) {
    console.error('rejectPiece error', err);
    return sendApiResponse(res, { statusCode: 500, success: false, message: 'Erreur serveur', error: { code: 'INTERNAL_SERVER_ERROR' } });
  }
};

// KPI and statistics for the admin dashboard.
const getDashboardStats = async (req, res) => {
  try {
    const [usersResult, usersByRoleResult, appointmentsResult, appointmentsByStatusResult, topGaragesResult, recentActivityResult] = await Promise.all([
      pool.query(`
        SELECT COUNT(*)::int AS total_users,
               COALESCE(COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days'), 0)::int AS new_users_last_30_days,
               COALESCE(COUNT(*) FILTER (WHERE COALESCE(is_validated, false) = true), 0)::int AS validated_users,
               COALESCE(COUNT(*) FILTER (WHERE COALESCE(is_validated, false) = false), 0)::int AS pending_users
        FROM users
      `),
      pool.query(`
        SELECT r.name AS role,
               COUNT(u.id)::int AS total
        FROM roles r
        LEFT JOIN users u ON u.role_id = r.id
        GROUP BY r.name
        ORDER BY r.id
      `),
      pool.query(`
        SELECT COUNT(*)::int AS total_appointments,
               COALESCE(COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days'), 0)::int AS appointments_last_30_days,
               COALESCE(COUNT(*) FILTER (WHERE status = 'pending'), 0)::int AS pending_appointments,
               COALESCE(COUNT(*) FILTER (WHERE status = 'confirmed'), 0)::int AS confirmed_appointments,
               COALESCE(COUNT(*) FILTER (WHERE status = 'done'), 0)::int AS done_appointments,
               COALESCE(COUNT(*) FILTER (WHERE status = 'cancelled'), 0)::int AS cancelled_appointments,
               COALESCE(COUNT(*) FILTER (WHERE status = 'proposed'), 0)::int AS proposed_appointments
        FROM appointments
      `),
      pool.query(`
        SELECT status, COUNT(*)::int AS total
        FROM appointments
        GROUP BY status
        ORDER BY total DESC, status ASC
      `),
      pool.query(`
        SELECT g.id,
               g.name,
               g.adresse,
               COALESCE(g.is_validated, false) AS is_validated,
               COALESCE(g.is_open, true) AS is_open,
               COUNT(a.id)::int AS appointments_count,
               COALESCE(ROUND(AVG(g.rating)::numeric, 2), 0) AS average_rating
        FROM garages g
        LEFT JOIN appointments a ON a.garage_id = g.id
        GROUP BY g.id
        ORDER BY appointments_count DESC, average_rating DESC, g.created_at DESC
        LIMIT 5
      `),
      pool.query(`
        SELECT
          (SELECT COUNT(*)::int FROM garages WHERE created_at >= NOW() - INTERVAL '30 days') AS new_garages_last_30_days,
          (SELECT COUNT(*)::int FROM pieces WHERE created_at >= NOW() - INTERVAL '30 days' AND COALESCE(is_validated, false) = true) AS new_validated_pieces_last_30_days,
          (SELECT COUNT(*)::int FROM pieces WHERE COALESCE(is_validated, false) = false) AS pending_pieces
      `)
    ]);

    const usersSummary = usersResult.rows[0] || {};
    const activitySummary = recentActivityResult.rows[0] || {};

    return sendApiResponse(res, {
      message: 'Statistiques du tableau de bord recuperees avec succes',
      data: {
        users: {
          totalUsers: Number(usersSummary.total_users || 0),
          newUsersLast30Days: Number(usersSummary.new_users_last_30_days || 0),
          validatedUsers: Number(usersSummary.validated_users || 0),
          pendingUsers: Number(usersSummary.pending_users || 0),
          byRole: usersByRoleResult.rows.map((row) => ({
            role: row.role,
            total: Number(row.total || 0)
          }))
        },
        appointments: {
          totalAppointments: Number((appointmentsResult.rows[0] || {}).total_appointments || 0),
          appointmentsLast30Days: Number((appointmentsResult.rows[0] || {}).appointments_last_30_days || 0),
          pendingAppointments: Number((appointmentsResult.rows[0] || {}).pending_appointments || 0),
          confirmedAppointments: Number((appointmentsResult.rows[0] || {}).confirmed_appointments || 0),
          doneAppointments: Number((appointmentsResult.rows[0] || {}).done_appointments || 0),
          cancelledAppointments: Number((appointmentsResult.rows[0] || {}).cancelled_appointments || 0),
          proposedAppointments: Number((appointmentsResult.rows[0] || {}).proposed_appointments || 0),
          byStatus: appointmentsByStatusResult.rows.map((row) => ({
            status: row.status,
            total: Number(row.total || 0)
          }))
        },
        garages: {
          topGarages: topGaragesResult.rows.map((row) => ({
            id: Number(row.id),
            name: row.name,
            adresse: row.adresse,
            isValidated: Boolean(row.is_validated),
            isOpen: Boolean(row.is_open),
            appointmentsCount: Number(row.appointments_count || 0),
            averageRating: Number(row.average_rating || 0)
          })),
          newGaragesLast30Days: Number(activitySummary.new_garages_last_30_days || 0)
        },
        pieces: {
          newValidatedPiecesLast30Days: Number(activitySummary.new_validated_pieces_last_30_days || 0),
          pendingPieces: Number(activitySummary.pending_pieces || 0)
        }
      }
    });
  } catch (err) {
    console.error('getDashboardStats error', err);
    return sendApiResponse(res, { statusCode: 500, success: false, message: 'Erreur serveur', error: { code: 'INTERNAL_SERVER_ERROR' } });
  }
};

module.exports = { login, getDashboardStats, listPendingUsers, approveUser, rejectUser, listGarages, deactivateGarage, deleteGarageAdmin, approveGarage, rejectGarage, listPieces, deletePieceAdmin, approvePiece, rejectPiece };
