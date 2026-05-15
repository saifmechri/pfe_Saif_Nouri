const express = require("express");
const router = express.Router();
const { pool } = require("../db");
const { sendApiResponse } = require("../utils/apiResponse");

const { register, login } = require("../controllers/authController");
const { updateProfile, deleteProfile, changePassword } = require("../controllers/profileController");
const { verifyToken } = require("../middlewares/authMiddleware");
const { isAdmin, isProfessional, isGarage, isVendeur, isAutomobiliste, isVendeurOrAdmin } = require("../middlewares/roleMiddleware");

// Authentification (public)
router.post("/register", register);
router.post("/login", login);

// Route protégée - nécessite un token JWT valide
router.get("/profile", verifyToken, (req, res) => {
  return sendApiResponse(res, {
    message: 'Profil récupéré avec succès',
    data: { user: req.user },
    extra: { ...req.user, user: req.user }
  });
});

// ============================================
// GESTION DU PROFIL UTILISATEUR (CRUD)
// ============================================

// Modifier le profil
router.put("/profile", verifyToken, updateProfile);

// Supprimer le compte
router.delete("/profile", verifyToken, deleteProfile);

// Changer le mot de passe
router.put("/profile/password", verifyToken, changePassword);

// ============================================
// EXEMPLES DE ROUTES PROTÉGÉES PAR RÔLE
// ============================================

// Route accessible SEULEMENT aux admins
router.get("/admin/users", verifyToken, isAdmin, async (req, res) => {
  try {
    const users = await pool.query(
      `SELECT u.id, u.name, u.email, r.name as role, u.created_at 
       FROM users u 
       JOIN roles r ON u.role_id = r.id 
       ORDER BY u.created_at DESC`
    );
    return sendApiResponse(res, {
      message: 'Utilisateurs récupérés avec succès',
      data: { users: users.rows },
      extra: { users: users.rows }
    });
  } catch (err) {
    console.error(err);
    return sendApiResponse(res, {
      statusCode: 500,
      success: false,
      message: "Erreur serveur",
      error: { code: 'INTERNAL_SERVER_ERROR' }
    });
  }
});

// Route accessible aux garages et vendeurs
router.get("/professional/dashboard", verifyToken, isProfessional, (req, res) => {
  return sendApiResponse(res, {
    message: 'Bienvenue sur le dashboard professionnel',
    data: { role: req.userRole, user: req.user },
    extra: { role: req.userRole, user: req.user }
  });
});

// Route accessible SEULEMENT aux automobilistes
router.get("/automobiliste/mes-vehicules", verifyToken, isAutomobiliste, (req, res) => {
  return sendApiResponse(res, {
    message: 'Liste de vos véhicules',
    data: { userId: req.user.id },
    extra: { userId: req.user.id }
  });
});

// Route accessible SEULEMENT aux garages
router.get("/garage/mes-services", verifyToken, isGarage, async (req, res) => {
  try {
    const garageResult = await pool.query(
      `SELECT id
       FROM garages
       WHERE user_id = $1`,
      [req.user.id]
    );

    if (garageResult.rows.length === 0) {
      return sendApiResponse(res, {
        statusCode: 404,
        success: false,
        message: "Profil garage introuvable pour cet utilisateur",
        error: { code: 'GARAGE_PROFILE_NOT_FOUND' }
      });
    }

    const garageId = garageResult.rows[0].id;
    const servicesResult = await pool.query(
      `SELECT id, garage_id, name, description, base_price, duration_minutes, is_active, created_at, updated_at
       FROM garage_services
       WHERE garage_id = $1
       ORDER BY created_at DESC`,
      [garageId]
    );

    const services = servicesResult.rows.map((row) => ({
      id: Number(row.id),
      garage_id: Number(row.garage_id),
      name: row.name,
      description: row.description || null,
      base_price: row.base_price === null ? null : Number(row.base_price),
      duration_minutes: row.duration_minutes === null ? null : Number(row.duration_minutes),
      is_active: row.is_active === null ? true : Boolean(row.is_active),
      created_at: row.created_at,
      updated_at: row.updated_at
    }));

    return sendApiResponse(res, {
      message: 'Liste de vos services',
      data: { garageId: Number(garageId), services },
      extra: { garageId: Number(garageId), services }
    });
  } catch (err) {
    console.error(err);
    return sendApiResponse(res, {
      statusCode: 500,
      success: false,
      message: "Erreur serveur",
      error: { code: 'INTERNAL_SERVER_ERROR' }
    });
  }
});

// Route accessible aux vendeurs et aux admins
router.get("/vendeur/mes-annonces", verifyToken, isVendeurOrAdmin, (req, res) => {
  return sendApiResponse(res, {
    message: 'Liste de vos annonces de véhicules',
    data: { vendeurId: req.user.id, role: req.userRole },
    extra: { vendeurId: req.user.id, role: req.userRole }
  });
});

// Route accessible à tous les utilisateurs authentifiés (sans restriction de rôle)
router.get("/profile-complet", verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.name, u.email, u.phone, u.store_name, u.store_address, u.store_description, u.store_hours, u.store_specialties, u.store_services, r.name as role 
       FROM users u 
       JOIN roles r ON u.role_id = r.id 
       WHERE u.id = $1`,
      [req.user.id]
    );
    return sendApiResponse(res, {
      message: 'Profil complet récupéré avec succès',
      data: { user: result.rows[0] },
      extra: { user: result.rows[0] }
    });
  } catch (err) {
    console.error(err);
    return sendApiResponse(res, {
      statusCode: 500,
      success: false,
      message: "Erreur serveur",
      error: { code: 'INTERNAL_SERVER_ERROR' }
    });
  }
});

router.get("/profile-complet/:id", verifyToken, async (req, res) => {
  try {
    const userId = Number.parseInt(req.params.id, 10);
    if (!Number.isFinite(userId) || userId <= 0) {
      return sendApiResponse(res, {
        statusCode: 400,
        success: false,
        message: "Identifiant utilisateur invalide",
        error: { code: 'INVALID_USER_ID' }
      });
    }

    const result = await pool.query(
      `SELECT u.id, u.name, u.email, u.phone, u.store_name, u.store_address, u.store_description, u.store_hours, u.store_specialties, u.store_services, r.name as role
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return sendApiResponse(res, {
        statusCode: 404,
        success: false,
        message: "Utilisateur introuvable",
        error: { code: 'USER_NOT_FOUND' }
      });
    }

    return sendApiResponse(res, {
      message: 'Profil vendeur récupéré avec succès',
      data: { user: result.rows[0] },
      extra: { user: result.rows[0] }
    });
  } catch (err) {
    console.error(err);
    return sendApiResponse(res, {
      statusCode: 500,
      success: false,
      message: "Erreur serveur",
      error: { code: 'INTERNAL_SERVER_ERROR' }
    });
  }
});

module.exports = router;