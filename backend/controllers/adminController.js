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

module.exports = { login, listPendingUsers, approveUser, rejectUser };
