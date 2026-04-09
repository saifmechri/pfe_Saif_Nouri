const express = require("express");
const router = express.Router();
const { pool } = require("../db");
const { sendApiResponse } = require("../utils/apiResponse");

const { register, login } = require("../controllers/authController");
const { updateProfile, deleteProfile, changePassword } = require("../controllers/profileController");
const { verifyToken } = require("../middlwares/authMiddleware");
const { isAdmin, isProfessional, isGarage, isVendeur, isAutomobiliste } = require("../middlwares/roleMiddleware");

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
router.get("/garage/mes-services", verifyToken, isGarage, (req, res) => {
  return sendApiResponse(res, {
    message: 'Liste de vos services',
    data: { garageId: req.user.id, role: req.userRole },
    extra: { garageId: req.user.id, role: req.userRole }
  });
});

// Route accessible SEULEMENT aux vendeurs
router.get("/vendeur/mes-annonces", verifyToken, isVendeur, (req, res) => {
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
      `SELECT u.id, u.name, u.email, u.phone, r.name as role 
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

module.exports = router;