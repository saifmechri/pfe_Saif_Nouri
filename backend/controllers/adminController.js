// ====================================
// ADMIN CONTROLLER - Gestion Administrative
// Fonctions: authentification admin, modération, gestion garages et pièces, statistiques
// ====================================

const jwt = require('jsonwebtoken');
const { pool } = require('../db');
const { sendApiResponse } = require('../utils/apiResponse');
const { logAction } = require('../services/auditService');

// Configuration des identifiants admin
const SECRET = process.env.JWT_SECRET || 'jwt_secret_key';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin123@gmail.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@admin0';

// Connexion admin: vérifie les identifiants et retourne un JWT
const login = async (req, res) => {
  try {
    // Récupère email et mot de passe du corps de la requête
    const { email, password } = req.body || {};
    // Valide que email et password sont fournis
    if (!email || !password) return sendApiResponse(res, { statusCode: 400, success: false, message: 'Email et mot de passe requis', error: { code: 'VALIDATION_ERROR' } });

    // Vérifie les identifiants admin
    if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
      return sendApiResponse(res, { statusCode: 401, success: false, message: 'Identifiants admin invalides', error: { code: 'INVALID_ADMIN_CREDENTIALS' } });
    }

    // Initialise les variables d'admin
    let adminUserId = null;
    let adminUserName = 'Administrateur';

    try {
      // Cherche l'utilisateur admin dans la base de données
      const adminUserResult = await pool.query(
        `SELECT u.id, u.name
         FROM users u
         JOIN roles r ON r.id = u.role_id
         WHERE LOWER(u.email) = LOWER($1)
           AND LOWER(r.name) = 'admin'
         LIMIT 1`,
        [ADMIN_EMAIL]
      );

      // Si l'utilisateur existe, récupère son ID et nom
      if (adminUserResult.rows.length > 0) {
        adminUserId = Number(adminUserResult.rows[0].id);
        adminUserName = adminUserResult.rows[0].name || adminUserName;
      } else {
        // Crée ou met à jour l'utilisateur admin dans la base de données
        const ensuredAdminUser = await pool.query(
          `WITH admin_role AS (
             SELECT id
             FROM roles
             WHERE LOWER(name) = 'admin'
             LIMIT 1
           )
           INSERT INTO users (name, email, password, role_id, is_validated, created_at, updated_at)
           SELECT $1, $2, NULL, admin_role.id, true, NOW(), NOW()
           FROM admin_role
           ON CONFLICT (email)
           DO UPDATE SET
             role_id = EXCLUDED.role_id,
             updated_at = NOW()
           RETURNING id, name`,
          [adminUserName, ADMIN_EMAIL]
        );

        if (ensuredAdminUser.rows.length > 0) {
          adminUserId = Number(ensuredAdminUser.rows[0].id);
          adminUserName = ensuredAdminUser.rows[0].name || adminUserName;
        }
      }
    } catch (lookupErr) {
      console.error('Admin user lookup failed', lookupErr);
    }

    // Prépare le contenu du JWT
    const tokenPayload = {
      admin: true,
      role: 'admin',
      email: ADMIN_EMAIL,
      ...(adminUserId ? { id: adminUserId } : {})
    };

    // Génère le token JWT
    const token = jwt.sign(tokenPayload, SECRET, { expiresIn: '7d' });

    // Retourne le token et les infos admin
    return sendApiResponse(res, {
      message: 'Admin login success',
      data: {
        token,
        user: {
          id: adminUserId || 'admin',
          name: adminUserName,
          email: ADMIN_EMAIL,
          role: 'admin'
        }
      },
      extra: { token }
    });
  } catch (err) {
    console.error('Admin login error', err);
    return sendApiResponse(res, { statusCode: 500, success: false, message: 'Erreur serveur', error: { code: 'INTERNAL_SERVER_ERROR' } });
  }
};

// Liste les utilisateurs en attente de validation
const listPendingUsers = async (req, res) => {
  try {
    // Récupère tous les utilisateurs non validés
    const result = await pool.query(`SELECT u.id, u.name, u.email, u.phone, u.created_at, r.name as role FROM users u JOIN roles r ON u.role_id = r.id WHERE coalesce(u.is_validated,false) = false ORDER BY u.created_at DESC`);
    return sendApiResponse(res, { message: 'Utilisateurs en attente', data: { items: result.rows } });
  } catch (err) {
    console.error('listPendingUsers', err);
    return sendApiResponse(res, { statusCode: 500, success: false, message: 'Erreur serveur', error: { code: 'INTERNAL_SERVER_ERROR' } });
  }
};

// Liste tous les utilisateurs modérables (automobiliste, vendeur, garage)
const listModerationUsers = async (req, res) => {
  try {
    // Récupère les utilisateurs avec leurs infos et celles de leurs garages
    const result = await pool.query(`
      SELECT u.id,
             u.name,
             u.email,
             u.phone,
             u.created_at,
             COALESCE(u.is_validated, false) AS is_validated,
             r.name AS role,
             g.id AS garage_id,
             g.name AS garage_name,
             COALESCE(g.is_open, true) AS garage_is_open
      FROM users u
      JOIN roles r ON u.role_id = r.id
      LEFT JOIN garages g ON g.user_id = u.id
      WHERE LOWER(r.name) IN ('automobiliste', 'vendeur', 'garage')
      ORDER BY u.created_at DESC
      LIMIT 300
    `);

    return sendApiResponse(res, { message: 'Utilisateurs en modération', data: { items: result.rows } });
  } catch (err) {
    console.error('listModerationUsers', err);
    return sendApiResponse(res, { statusCode: 500, success: false, message: 'Erreur serveur', error: { code: 'INTERNAL_SERVER_ERROR' } });
  }
};

// Approuve un utilisateur (marque is_validated à true)
const approveUser = async (req, res) => {
  try {
    // Valide l'ID de l'utilisateur
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return sendApiResponse(res, { statusCode: 400, success: false, message: 'Identifiant invalide', error: { code: 'INVALID_ID' } });

    // Met à jour le statut de validation
    const result = await pool.query('UPDATE users SET is_validated = true, updated_at = NOW() WHERE id = $1 RETURNING id, name, email, role_id', [id]);
    if (result.rows.length === 0) return sendApiResponse(res, { statusCode: 404, success: false, message: 'Utilisateur introuvable', error: { code: 'USER_NOT_FOUND' } });

      try {
        // Enregistre l'action dans les logs d'audit
        await logAction({
          adminEmail: req.admin?.email || null,
          action: 'approve_user',
          entity: 'user',
          entityId: id,
          details: result.rows[0],
          ip: req.ip || null,
          userAgent: req.headers['user-agent'] || null
        });
      } catch (e) {
        console.error('audit log failed', e);
      }

      return sendApiResponse(res, { message: 'Utilisateur approuve', data: { user: result.rows[0] } });
  } catch (err) {
    console.error('approveUser', err);
    return sendApiResponse(res, { statusCode: 500, success: false, message: 'Erreur serveur', error: { code: 'INTERNAL_SERVER_ERROR' } });
  }
};

// Rejette un utilisateur (le supprime)
const rejectUser = async (req, res) => {
  try {
    // Valide l'ID de l'utilisateur
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return sendApiResponse(res, { statusCode: 400, success: false, message: 'Identifiant invalide', error: { code: 'INVALID_ID' } });

    // Supprime l'utilisateur de la base de données
    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) return sendApiResponse(res, { statusCode: 404, success: false, message: 'Utilisateur introuvable', error: { code: 'USER_NOT_FOUND' } });

      try {
        // Enregistre l'action de rejet dans les logs d'audit
        await logAction({
          adminEmail: req.admin?.email || null,
          action: 'reject_user',
          entity: 'user',
          entityId: id,
          details: null,
          ip: req.ip || null,
          userAgent: req.headers['user-agent'] || null
        });
      } catch (e) {
        console.error('audit log failed', e);
      }

      return sendApiResponse(res, { message: 'Utilisateur rejete et supprime', data: null });
  } catch (err) {
    console.error('rejectUser', err);
    return sendApiResponse(res, { statusCode: 500, success: false, message: 'Erreur serveur', error: { code: 'INTERNAL_SERVER_ERROR' } });
  }
};

// Bascule le statut de blocage d'un utilisateur
const toggleUserBlock = async (req, res) => {
  try {
    // Valide l'ID
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return sendApiResponse(res, { statusCode: 400, success: false, message: 'Identifiant invalide', error: { code: 'INVALID_ID' } });
    }

    // Récupère les infos actuelles de l'utilisateur
    const accountInfo = await pool.query(
      `SELECT u.id,
              u.name,
              u.email,
              COALESCE(u.is_validated, false) AS is_validated,
              LOWER(r.name) AS role_name,
              g.id AS garage_id
       FROM users u
       JOIN roles r ON u.role_id = r.id
       LEFT JOIN garages g ON g.user_id = u.id
       WHERE u.id = $1`,
      [id]
    );

    if (accountInfo.rows.length === 0) {
      return sendApiResponse(res, { statusCode: 404, success: false, message: 'Utilisateur introuvable', error: { code: 'USER_NOT_FOUND' } });
    }

    const currentAccount = accountInfo.rows[0];
    // Inverse le statut de validation
    const nextIsValidated = !currentAccount.is_validated;

    // Met à jour le statut de l'utilisateur
    const result = await pool.query(
      `UPDATE users
       SET is_validated = $2,
           updated_at = NOW()
       WHERE id = $1
       RETURNING id, name, email, COALESCE(is_validated, false) AS is_validated`,
      [id, nextIsValidated]
    );

    if (result.rows.length === 0) {
      return sendApiResponse(res, { statusCode: 404, success: false, message: 'Utilisateur introuvable', error: { code: 'USER_NOT_FOUND' } });
    }

    const user = result.rows[0];

    // Si c'est un garage, met aussi à jour le statut du garage
    if (currentAccount.role_name === 'garage' && currentAccount.garage_id) {
      await pool.query(
        `UPDATE garages
         SET is_open = $1,
             updated_at = NOW()
         WHERE id = $2`,
        [nextIsValidated, currentAccount.garage_id]
      );
    }

    try {
      // Enregistre l'action dans les logs d'audit
      await logAction({
        adminEmail: req.admin?.email || null,
        action: user.is_validated ? 'unblock_user' : 'block_user',
        entity: 'user',
        entityId: id,
        details: {
          ...user,
          role: currentAccount.role_name,
          garage_id: currentAccount.garage_id || null,
          garage_sync: currentAccount.role_name === 'garage'
        },
        ip: req.ip || null,
        userAgent: req.headers['user-agent'] || null
      });
    } catch (e) {
      console.error('audit log failed', e);
    }

    return sendApiResponse(res, { message: user.is_validated ? 'Compte débloqué' : 'Compte bloqué', data: { user: { ...user, role: currentAccount.role_name, garage_id: currentAccount.garage_id || null } } });
  } catch (err) {
    console.error('toggleUserBlock', err);
    return sendApiResponse(res, { statusCode: 500, success: false, message: 'Erreur serveur', error: { code: 'INTERNAL_SERVER_ERROR' } });
  }
};

// ============ GESTION DES GARAGES ============

// Liste tous les garages pour l'administration
const listGarages = async (req, res) => {
  try {
    // Récupère tous les garages avec leurs infos utilisateur
    const result = await pool.query(`
      SELECT g.id,
             g.name,
             g.adresse,
             g.email,
             g.telephone,
             g.is_open,
             g.status,
             (CASE WHEN g.status = 'actif' THEN true ELSE false END) AS is_validated,
             u.email as user_email,
             u.name as user_name,
             g.created_at,
             g.updated_at
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

// Désactive un garage
const deactivateGarage = async (req, res) => {
  try {
    // Valide l'ID du garage
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return sendApiResponse(res, { statusCode: 400, success: false, message: 'Identifiant invalide', error: { code: 'INVALID_ID' } });

    // Met à jour le statut du garage
    const result = await pool.query("UPDATE garages SET status = 'desactive', is_open = false, updated_at = NOW() WHERE id = $1 RETURNING id, name, status", [id]);
    if (result.rows.length === 0) return sendApiResponse(res, { statusCode: 404, success: false, message: 'Garage introuvable', error: { code: 'GARAGE_NOT_FOUND' } });

      try {
        await logAction({
          adminEmail: req.admin?.email || null,
          action: 'deactivate_garage',
          entity: 'garage',
          entityId: id,
          details: result.rows[0],
          ip: req.ip || null,
          userAgent: req.headers['user-agent'] || null
        });
      } catch (e) { console.error('audit log failed', e); }

      return sendApiResponse(res, { message: 'Garage désactivé', data: { garage: result.rows[0] } });
  } catch (err) {
    console.error('deactivateGarage error', err);
    return sendApiResponse(res, { statusCode: 500, success: false, message: 'Erreur serveur', error: { code: 'INTERNAL_SERVER_ERROR' } });
  }
};

// Bascule le statut de blocage d'un garage
const toggleGarageBlock = async (req, res) => {
  try {
    // Valide l'ID du garage
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return sendApiResponse(res, { statusCode: 400, success: false, message: 'Identifiant invalide', error: { code: 'INVALID_ID' } });
    }

    // Inverse le statut is_open du garage
    const result = await pool.query(
      `UPDATE garages
       SET is_open = NOT COALESCE(is_open, true),
           updated_at = NOW()
       WHERE id = $1
       RETURNING id, name, COALESCE(is_open, true) AS is_open`,
      [id]
    );

    if (result.rows.length === 0) {
      return sendApiResponse(res, { statusCode: 404, success: false, message: 'Garage introuvable', error: { code: 'GARAGE_NOT_FOUND' } });
    }

    const garage = result.rows[0];

    try {
      // Enregistre l'action de blocage/déblocage
      await logAction({
        adminEmail: req.admin?.email || null,
        action: garage.is_open ? 'unblock_garage' : 'block_garage',
        entity: 'garage',
        entityId: id,
        details: garage,
        ip: req.ip || null,
        userAgent: req.headers['user-agent'] || null
      });
    } catch (e) {
      console.error('audit log failed', e);
    }

    return sendApiResponse(res, { message: garage.is_open ? 'Garage débloqué' : 'Garage bloqué', data: { garage } });
  } catch (err) {
    console.error('toggleGarageBlock error', err);
    return sendApiResponse(res, { statusCode: 500, success: false, message: 'Erreur serveur', error: { code: 'INTERNAL_SERVER_ERROR' } });
  }
};

// Supprime un garage
const deleteGarageAdmin = async (req, res) => {
  try {
    // Valide l'ID du garage
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return sendApiResponse(res, { statusCode: 400, success: false, message: 'Identifiant invalide', error: { code: 'INVALID_ID' } });

    // Supprime le garage de la base de données
    const result = await pool.query('DELETE FROM garages WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) return sendApiResponse(res, { statusCode: 404, success: false, message: 'Garage introuvable', error: { code: 'GARAGE_NOT_FOUND' } });

      try {
        await logAction({
          adminEmail: req.admin?.email || null,
          action: 'delete_garage',
          entity: 'garage',
          entityId: id,
          details: null,
          ip: req.ip || null,
          userAgent: req.headers['user-agent'] || null
        });
      } catch (e) { console.error('audit log failed', e); }

      return sendApiResponse(res, { message: 'Garage supprimé', data: null });
  } catch (err) {
    console.error('deleteGarageAdmin error', err);
    return sendApiResponse(res, { statusCode: 500, success: false, message: 'Erreur serveur', error: { code: 'INTERNAL_SERVER_ERROR' } });
  }
};

// Approuve un garage (marque comme actif)
const approveGarage = async (req, res) => {
  try {
    // Valide l'ID du garage
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return sendApiResponse(res, { statusCode: 400, success: false, message: 'Identifiant invalide', error: { code: 'INVALID_ID' } });

    // Met à jour le statut du garage à 'actif'
    const result = await pool.query("UPDATE garages SET status = 'actif', is_open = true, updated_at = NOW() WHERE id = $1 RETURNING id, name, status", [id]);
    if (result.rows.length === 0) return sendApiResponse(res, { statusCode: 404, success: false, message: 'Garage introuvable', error: { code: 'GARAGE_NOT_FOUND' } });

      try {
        await logAction({
          adminEmail: req.admin?.email || null,
          action: 'approve_garage',
          entity: 'garage',
          entityId: id,
          details: result.rows[0],
          ip: req.ip || null,
          userAgent: req.headers['user-agent'] || null
        });
      } catch (e) { console.error('audit log failed', e); }

      return sendApiResponse(res, { message: 'Garage approuvé', data: { garage: result.rows[0] } });
  } catch (err) {
    console.error('approveGarage error', err);
    return sendApiResponse(res, { statusCode: 500, success: false, message: 'Erreur serveur', error: { code: 'INTERNAL_SERVER_ERROR' } });
  }
};

// Rejette un garage (le supprime)
const rejectGarage = async (req, res) => {
  try {
    // Valide l'ID du garage
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return sendApiResponse(res, { statusCode: 400, success: false, message: 'Identifiant invalide', error: { code: 'INVALID_ID' } });

    // Supprime le garage
    const result = await pool.query('DELETE FROM garages WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) return sendApiResponse(res, { statusCode: 404, success: false, message: 'Garage introuvable', error: { code: 'GARAGE_NOT_FOUND' } });

      try {
        await logAction({
          adminEmail: req.admin?.email || null,
          action: 'reject_garage',
          entity: 'garage',
          entityId: id,
          details: null,
          ip: req.ip || null,
          userAgent: req.headers['user-agent'] || null
        });
      } catch (e) { console.error('audit log failed', e); }

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

      try {
        await logAction({
          adminEmail: req.admin?.email || null,
          action: 'delete_piece',
          entity: 'piece',
          entityId: id,
          details: null,
          ip: req.ip || null,
          userAgent: req.headers['user-agent'] || null
        });
      } catch (e) { console.error('audit log failed', e); }

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

      try {
        await logAction({
          adminEmail: req.admin?.email || null,
          action: 'approve_piece',
          entity: 'piece',
          entityId: id,
          details: result.rows[0],
          ip: req.ip || null,
          userAgent: req.headers['user-agent'] || null
        });
      } catch (e) { console.error('audit log failed', e); }

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

      try {
        await logAction({
          adminEmail: req.admin?.email || null,
          action: 'reject_piece',
          entity: 'piece',
          entityId: id,
          details: null,
          ip: req.ip || null,
          userAgent: req.headers['user-agent'] || null
        });
      } catch (e) { console.error('audit log failed', e); }

      return sendApiResponse(res, { message: 'Piece rejetée et supprimée', data: null });
  } catch (err) {
    console.error('rejectPiece error', err);
    return sendApiResponse(res, { statusCode: 500, success: false, message: 'Erreur serveur', error: { code: 'INTERNAL_SERVER_ERROR' } });
  }
};

/**
 * ADMIN DASHBOARD STATISTICS
 * 
 * Retrieves platform analytics for admin oversight:
 * - User metrics (total, new, validated, pending)
 * - Appointment tracking (by status and timeline)
 * - Top performing garages (by appointment volume)
 * - Content moderation queue (pending pieces, validations)
 * 
 * HOW TO USE:
 * Admin calls GET /api/admin/stats to load dashboard metrics.
 * Shows user engagement, appointment pipeline, and pending items needing approval.
 */
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
        SELECT r.id AS role_id,
               r.name AS role,
               COUNT(u.id)::int AS total
        FROM roles r
        LEFT JOIN users u ON u.role_id = r.id
        GROUP BY r.id, r.name
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
               g.status,
               (CASE WHEN g.status = 'actif' THEN true ELSE false END) AS is_validated,
               COALESCE(g.is_open, true) AS is_open,
               COUNT(a.id)::int AS appointments_count,
               COALESCE(ROUND(AVG(g.rating)::numeric, 2), 0) AS average_rating,
               g.created_at
        FROM garages g
        LEFT JOIN appointments a ON a.garage_id = g.id
        GROUP BY g.id, g.name, g.adresse, g.status, g.is_open, g.created_at
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

// List audit logs with optional filters and pagination
const listAuditLogs = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 25));
    const offset = (page - 1) * limit;

    const { action, entity, adminEmail } = req.query || {};

    const where = [];
    const params = [];

    if (action) {
      params.push(action);
      where.push(`action = $${params.length}`);
    }
    if (entity) {
      params.push(entity);
      where.push(`entity = $${params.length}`);
    }
    if (adminEmail) {
      params.push(adminEmail);
      where.push(`admin_email = $${params.length}`);
    }

    const whereSql = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

    const countQuery = `SELECT COUNT(*)::int AS total FROM audit_logs ${whereSql}`;
    const countResult = await pool.query(countQuery, params);
    const total = Number(countResult.rows[0]?.total || 0);

    params.push(limit);
    params.push(offset);

    const dataQuery = `SELECT id, admin_email, action, entity, entity_id, details, ip, user_agent, created_at FROM audit_logs ${whereSql} ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`;
    const dataResult = await pool.query(dataQuery, params);

    return sendApiResponse(res, {
      message: 'Audit logs retrieved',
      data: {
        items: dataResult.rows,
        meta: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (err) {
    console.error('listAuditLogs error', err);
    return sendApiResponse(res, { statusCode: 500, success: false, message: 'Erreur serveur', error: { code: 'INTERNAL_SERVER_ERROR' } });
  }
};

module.exports = {
  login,
  getDashboardStats,
  listPendingUsers,
  listModerationUsers,
  approveUser,
  rejectUser,
  toggleUserBlock,
  listGarages,
  deactivateGarage,
  toggleGarageBlock,
  deleteGarageAdmin,
  approveGarage,
  rejectGarage,
  listPieces,
  deletePieceAdmin,
  approvePiece,
  rejectPiece,
  listAuditLogs
};

