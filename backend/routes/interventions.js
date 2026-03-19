const express = require('express');
const router = express.Router({ mergeParams: true }); // pour récupérer vehicleId depuis l'URL parent
const interventionController = require('../controllers/interventionController');
const { verifyToken } = require('../middlwares/authMiddleware');
const { body, param } = require('express-validator');

// Toutes les routes nécessitent une authentification
router.use(verifyToken);

// Validation
const validateIntervention = [
  body('type').isIn(['révision', 'réparation', 'vidange', 'autre']),
  body('date_intervention').optional().isISO8601(),
  body('kilometrage').optional().isInt({ min: 0 })
];

// Routes pour les interventions d'un véhicule spécifique
router.post('/', validateIntervention, interventionController.createIntervention);
router.get('/', interventionController.getInterventionsByVehicle);

// Routes pour une intervention par ID (indépendante du véhicule, mais on vérifie le propriétaire dans le contrôleur)
router.get('/:id', interventionController.getInterventionById);
router.put('/:id', validateIntervention, interventionController.updateIntervention);
router.delete('/:id', interventionController.deleteIntervention);

// Gestion des pièces sur une intervention
router.post('/:id/pieces', [
  body('pieceId').isInt(),
  body('quantite').optional().isInt({ min: 1 }),
  body('prix_unitaire').optional().isDecimal()
], interventionController.addPieceToIntervention);

router.delete('/:id/pieces/:pieceId', interventionController.removePieceFromIntervention);

module.exports = router;