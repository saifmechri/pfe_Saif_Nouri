const express = require('express');
const { body, param, query } = require('express-validator');
const { verifyToken } = require('../middlwares/authMiddleware');
const { checkRole } = require('../middlwares/roleMiddleware');
const { validateRequest } = require('../middlewares/validateRequest');
const garageController = require('../controllers/garage.controller');

const router = express.Router();

const createGarageValidation = [
  body('name').trim().notEmpty().withMessage('Le nom du garage est obligatoire').isLength({ max: 255 }).withMessage('Le nom du garage ne doit pas depasser 255 caracteres'),
  body('adresse').optional({ nullable: true }).isString().withMessage('L\'adresse doit etre une chaine de caracteres').isLength({ max: 255 }).withMessage('L\'adresse ne doit pas depasser 255 caracteres'),
  body('telephone').optional({ nullable: true }).isString().withMessage('Le telephone doit etre une chaine de caracteres').isLength({ max: 50 }).withMessage('Le telephone ne doit pas depasser 50 caracteres'),
  body('email').optional({ nullable: true }).isEmail().withMessage('Format d\'email invalide'),
  body('latitude').optional({ nullable: true }).isFloat({ min: -90, max: 90 }).withMessage('latitude doit etre comprise entre -90 et 90'),
  body('longitude').optional({ nullable: true }).isFloat({ min: -180, max: 180 }).withMessage('longitude doit etre comprise entre -180 et 180'),
  body('rating').optional({ nullable: true }).isFloat({ min: 0, max: 5 }).withMessage('rating doit etre compris entre 0 et 5'),
  body('is_open').optional().isBoolean().withMessage('is_open doit etre booleen'),
  body('user_id').optional({ nullable: true }).isInt({ min: 1 }).withMessage('user_id doit etre un entier superieur a 0')
];

const listGaragesValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('page doit etre un entier superieur ou egal a 1'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit doit etre compris entre 1 et 100'),
  query('search').optional().isString().withMessage('search doit etre une chaine de caracteres'),
  query('includeClosed').optional().isIn(['true', 'false', '1', '0', 'yes', 'no', 'on', 'off']).withMessage('includeClosed invalide')
];

const garageIdValidation = [
  param('id').isInt({ min: 1 }).withMessage('Identifiant garage invalide')
];

const updateGarageValidation = [
  ...garageIdValidation,
  body().custom((_, { req }) => {
    const allowedFields = ['name', 'adresse', 'telephone', 'email', 'latitude', 'longitude', 'rating', 'is_open'];
    const hasAtLeastOneField = allowedFields.some((field) => req.body[field] !== undefined);

    if (!hasAtLeastOneField) {
      throw new Error('Au moins un champ doit etre fourni');
    }

    return true;
  }),
  body('name').optional().trim().isLength({ min: 1, max: 255 }).withMessage('Le nom du garage doit contenir entre 1 et 255 caracteres'),
  body('adresse').optional({ nullable: true }).isString().withMessage('L\'adresse doit etre une chaine de caracteres').isLength({ max: 255 }).withMessage('L\'adresse ne doit pas depasser 255 caracteres'),
  body('telephone').optional({ nullable: true }).isString().withMessage('Le telephone doit etre une chaine de caracteres').isLength({ max: 50 }).withMessage('Le telephone ne doit pas depasser 50 caracteres'),
  body('email').optional({ nullable: true }).isEmail().withMessage('Format d\'email invalide'),
  body('latitude').optional({ nullable: true }).isFloat({ min: -90, max: 90 }).withMessage('latitude doit etre comprise entre -90 et 90'),
  body('longitude').optional({ nullable: true }).isFloat({ min: -180, max: 180 }).withMessage('longitude doit etre comprise entre -180 et 180'),
  body('rating').optional({ nullable: true }).isFloat({ min: 0, max: 5 }).withMessage('rating doit etre compris entre 0 et 5'),
  body('is_open').optional().isBoolean().withMessage('is_open doit etre booleen')
];

router.get('/', listGaragesValidation, validateRequest, garageController.listGarages);
router.get('/me', verifyToken, checkRole('garage', 'admin'), garageController.getMyGarage);
router.get('/:id', garageIdValidation, validateRequest, garageController.getGarageById);

router.post('/', verifyToken, checkRole('garage', 'admin'), createGarageValidation, validateRequest, garageController.createGarage);
router.put('/:id', verifyToken, checkRole('garage', 'admin'), updateGarageValidation, validateRequest, garageController.updateGarage);
router.delete('/:id', verifyToken, checkRole('garage', 'admin'), garageIdValidation, validateRequest, garageController.deleteGarage);

module.exports = router;
