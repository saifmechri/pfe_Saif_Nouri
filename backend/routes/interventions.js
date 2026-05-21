const express = require('express');
const { check, param, body } = require('express-validator');
const router = express.Router({ mergeParams: true });
const { verifyToken } = require('../middlewares/authMiddleware');
const { validateRequest } = require('../middlewares/validateRequest');
const interventionController = require('../controllers/interventionController');

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

const addPieceValidation = [
  interventionIdParam,
  body('pieceId').isInt({ gt: 0 }).withMessage('pieceId invalide'),
  body('quantite').optional().isInt({ min: 1 }).withMessage('quantite invalide'),
  body('prix_unitaire').optional().isFloat({ min: 0 }).withMessage('prix_unitaire invalide'),
  validateRequest
];

const removePieceValidation = [
  interventionIdParam,
  param('pieceId').isInt({ gt: 0 }).withMessage('pieceId invalide'),
  validateRequest
];


// List interventions for a vehicle
router.get('/', vehicleIdParam, validateRequest, verifyToken, interventionController.getInterventionsByVehicle);

// Create a new intervention for vehicle
router.post('/', createInterventionValidation, verifyToken, interventionController.createIntervention);

// Get single intervention by id
router.get('/:id', interventionIdParam, validateRequest, verifyToken, interventionController.getInterventionById);

// Manage pieces linked to an intervention

router.post('/:id/pieces', addPieceValidation, verifyToken, interventionController.addPieceToIntervention);
router.delete('/:id/pieces/:pieceId', removePieceValidation, verifyToken, interventionController.removePieceFromIntervention);

// Update intervention
router.patch('/:id', updateInterventionValidation, verifyToken, interventionController.updateIntervention);

// Delete intervention
router.delete('/:id', interventionIdParam, validateRequest, verifyToken, interventionController.deleteIntervention);

module.exports = router;


