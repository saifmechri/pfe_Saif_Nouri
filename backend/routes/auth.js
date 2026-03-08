const express = require("express");
const router = express.Router();

const { register, login } = require("../controllers/authController");
const { verifyToken } = require("../middlwares/authMiddleware");

router.post("/register", register);
router.post("/login", login);

// Route protégée - nécessite un token JWT valide
router.get("/profile", verifyToken, (req, res) => {
  res.json({
    message: "Profil utilisateur",
    user: req.user
  });
});

module.exports = router;