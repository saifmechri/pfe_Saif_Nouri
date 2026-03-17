const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middlwares/authMiddleware");
const {
  createVehicule,
  listVehicules,
  updateVehicule,
  deleteVehicule
} = require("../controllers/vehiculeController");

// Toutes les routes sont protégées par JWT
// POST /api/vehicules - Ajouter un véhicule
router.post("/", verifyToken, createVehicule);

// GET /api/vehicules - Lister les véhicules de l'utilisateur
router.get("/", verifyToken, listVehicules);

// PUT /api/vehicules/:id - Modifier un véhicule
router.put("/:id", verifyToken, updateVehicule);

// DELETE /api/vehicules/:id - Supprimer un véhicule
router.delete("/:id", verifyToken, deleteVehicule);

module.exports = router;