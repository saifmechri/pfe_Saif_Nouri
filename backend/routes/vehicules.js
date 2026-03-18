const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middlwares/authMiddleware");
const { uploadVehiculePhoto } = require("../middlwares/uploadVehiculePhoto");
const {
  createVehicule,
  listVehicules,
  updateVehicule,
  deleteVehicule
} = require("../controllers/vehiculeController");

// Toutes les routes sont protégées par JWT
// POST /api/vehicules - Ajouter un véhicule
router.post("/", verifyToken, uploadVehiculePhoto.single("photo"), createVehicule);

// GET /api/vehicules - Lister les véhicules de l'utilisateur
router.get("/", verifyToken, listVehicules);

// PUT /api/vehicules/:id - Modifier un véhicule
router.put("/:id", verifyToken, uploadVehiculePhoto.single("photo"), updateVehicule);

// DELETE /api/vehicules/:id - Supprimer un véhicule
router.delete("/:id", verifyToken, deleteVehicule);

module.exports = router;