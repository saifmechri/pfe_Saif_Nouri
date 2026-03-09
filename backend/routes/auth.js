const express = require("express");
const router = express.Router();
const pool = require("../db");

const { register, login } = require("../controllers/authController");
const { verifyToken } = require("../middlwares/authMiddleware");
const { isAdmin, isProfessional, checkRole } = require("../middlwares/roleMiddleware");

router.post("/register", register);
router.post("/login", login);

// Route protégée - nécessite un token JWT valide
router.get("/profile", verifyToken, (req, res) => {
  res.json({
    message: "Profil utilisateur",
    user: req.user
  });
});
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
    res.json({ users: users.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Route accessible aux garages et vendeurs
router.get("/professional/dashboard", verifyToken, isProfessional, (req, res) => {
  res.json({ 
    message: `Bienvenue sur le dashboard professionnel`,
    role: req.userRole,
    user: req.user
  });
});

// Route accessible SEULEMENT aux automobilistes
router.get("/automobiliste/mes-vehicules", verifyToken, checkRole('automobiliste'), (req, res) => {
  res.json({ 
    message: "Liste de vos véhicules",
    userId: req.user.id
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
    res.json({ user: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

module.exports = router;