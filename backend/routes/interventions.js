const express = require('express');
const { check, param, body } = require('express-validator');
const router = express.Router({ mergeParams: true });
const { verifyToken } = require('../middlewares/authMiddleware');
const { validateRequest } = require('../middlewares/validateRequest');
const interventionController = require('../controllers/intervention.controller');

// Validation chains
const vehicleIdParam = param('vehicleId').isInt({ gt: 0 }).withMessage('vehicleId invalide');
const interventionIdParam = param('id').isInt({ gt: 0 }).withMessage('id invalide');

const createInterventionValidation = [
  vehicleIdParam,
  body('date_intervention').optional().isISO8601().withMessage('date_intervention doit etre une date ISO'),
  body('type').optional().isString().isLength({ max: 100 }).withMessage('type invalide'),
  body('description').optional().isString().isLength({ max: 2000 }),
  body('garage_nom').optional().isString().isLength({ max: 255 }),
  body('garage_adresse').optional().isString().isLength({ max: 255 }),
  body('kilometrage').optional().isInt({ min: 0 }).withMessage('kilometrage invalide'),
  body('cout_total').optional().isFloat({ min: 0 }).withMessage('cout_total invalide'),
  body('km_recommande').optional().isInt({ min: 0 }).withMessage('km_recommande invalide'),
  body('jours_recommandes').optional().isInt({ min: 0 }).withMessage('jours_recommandes invalide'),
  validateRequest
];

const updateInterventionValidation = [
  interventionIdParam,
  body('date_intervention').optional().isISO8601().withMessage('date_intervention doit etre une date ISO'),
  body('type').optional().isString().isLength({ max: 100 }).withMessage('type invalide'),
  body('description').optional().isString().isLength({ max: 2000 }),
  body('garage_nom').optional().isString().isLength({ max: 255 }),
  body('garage_adresse').optional().isString().isLength({ max: 255 }),
  body('kilometrage').optional().isInt({ min: 0 }).withMessage('kilometrage invalide'),
  body('cout_total').optional().isFloat({ min: 0 }).withMessage('cout_total invalide'),
  body('km_recommande').optional().isInt({ min: 0 }).withMessage('km_recommande invalide'),
  body('jours_recommandes').optional().isInt({ min: 0 }).withMessage('jours_recommandes invalide'),
  validateRequest
];

// List interventions for a vehicle
router.get('/', vehicleIdParam, validateRequest, verifyToken, interventionController.listInterventions);

// Create a new intervention for vehicle
router.post('/', createInterventionValidation, verifyToken, interventionController.createIntervention);

// Get single intervention by id
router.get('/:id', interventionIdParam, validateRequest, verifyToken, interventionController.getIntervention);

// Update intervention
router.patch('/:id', updateInterventionValidation, verifyToken, interventionController.updateIntervention);

// Delete intervention
router.delete('/:id', interventionIdParam, validateRequest, verifyToken, interventionController.deleteIntervention);

module.exports = router;
const express = require('express');
const router = express.Router({ mergeParams: true }); // pour récupérer vehicleId depuis l'URL parent
const interventionController = require('../controllers/interventionController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { body } = require('express-validator');

// Toutes les routes nécessitent une authentification
router.use(verifyToken);

// Validation du payload intervention
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