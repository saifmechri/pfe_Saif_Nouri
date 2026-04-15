const express = require('express');
const { body, param, query } = require('express-validator');
const { verifyToken } = require('../middlwares/authMiddleware');
const { isVendeurOrAdmin } = require('../middlwares/roleMiddleware');
const { uploadPiecePhoto } = require('../middlwares/uploadPiecePhoto');
const { validateRequest } = require('../middlewares/validateRequest');
const pieceController = require('../controllers/piece.controller');

const router = express.Router();

const createPieceValidation = [
  body('nom').trim().notEmpty().withMessage('Le nom est obligatoire').isLength({ max: 255 }).withMessage('Le nom ne doit pas depasser 255 caracteres'),
  body('reference').trim().notEmpty().withMessage('La reference est obligatoire').isLength({ max: 255 }).withMessage('La reference ne doit pas depasser 255 caracteres'),
  body('description').optional({ nullable: true }).isString().withMessage('La description doit etre une chaine de caracteres'),
  body('prix_unitaire').notEmpty().withMessage('Le prix unitaire est obligatoire').isFloat({ gt: 0 }).withMessage('Le prix unitaire doit etre superieur a 0'),
  body('stock').optional({ nullable: true }).isInt({ min: 0 }).withMessage('Le stock doit etre superieur ou egal a 0')
];

const updatePieceValidation = [
  param('id').isInt({ min: 1 }).withMessage('Identifiant de piece invalide'),
  body().custom((_, { req }) => {
    const hasAtLeastOneField = ['nom', 'reference', 'description', 'prix_unitaire', 'stock']
      .some((field) => req.body[field] !== undefined);

    if (!hasAtLeastOneField) {
      throw new Error('Au moins un champ doit etre fourni');
    }

    return true;
  }),
  body('nom').optional().trim().isLength({ min: 1, max: 255 }).withMessage('Le nom doit contenir entre 1 et 255 caracteres'),
  body('reference').optional().trim().isLength({ min: 1, max: 255 }).withMessage('La reference doit contenir entre 1 et 255 caracteres'),
  body('description').optional({ nullable: true }).isString().withMessage('La description doit etre une chaine de caracteres'),
  body('prix_unitaire').optional({ nullable: true }).isFloat({ gt: 0 }).withMessage('Le prix unitaire doit etre superieur a 0'),
  body('stock').optional({ nullable: true }).isInt({ min: 0 }).withMessage('Le stock doit etre superieur ou egal a 0')
];

const getPieceValidation = [
  param('id').isInt({ min: 1 }).withMessage('Identifiant de piece invalide')
];

const listPiecesValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('page doit etre un entier superieur ou egal a 1'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit doit etre compris entre 1 et 100'),
  query('search').optional().isString().trim(),
  query('sortBy').optional().isIn(['nom', 'reference', 'prix_unitaire', 'created_at', 'updated_at']).withMessage('sortBy invalide'),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('sortOrder invalide')
];

const adjustStockValidation = [
  param('id').isInt({ min: 1 }).withMessage('Identifiant de piece invalide'),
  body('quantity_change').notEmpty().withMessage('quantity_change est obligatoire').isInt({ min: -1000000, max: 1000000 }).withMessage('quantity_change doit etre un entier'),
  body('quantity_change').custom((value) => {
    if (Number(value) === 0) {
      throw new Error('quantity_change doit etre non nul');
    }

    return true;
  }),
  body('movement_type').optional().isIn(['IN', 'OUT', 'ADJUSTMENT', 'in', 'out', 'adjustment']).withMessage('movement_type invalide'),
  body('reason').optional({ nullable: true }).isString().withMessage('reason doit etre une chaine de caracteres')
];

const setStockValidation = [
  param('id').isInt({ min: 1 }).withMessage('Identifiant de piece invalide'),
  body('stock').notEmpty().withMessage('stock est obligatoire').isInt({ min: 0 }).withMessage('stock doit etre un entier superieur ou egal a 0'),
  body('reason').optional({ nullable: true }).isString().withMessage('reason doit etre une chaine de caracteres')
];

const stockMovementsValidation = [
  param('id').isInt({ min: 1 }).withMessage('Identifiant de piece invalide'),
  query('page').optional().isInt({ min: 1 }).withMessage('page doit etre un entier superieur ou egal a 1'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit doit etre compris entre 1 et 100')
];

router.get('/', listPiecesValidation, validateRequest, pieceController.getAllPieces);
router.get('/:id', getPieceValidation, validateRequest, pieceController.getPieceById);
router.get('/:id/stock/movements', verifyToken, isVendeurOrAdmin, stockMovementsValidation, validateRequest, pieceController.getPieceStockMovements);

router.post('/', verifyToken, isVendeurOrAdmin, uploadPiecePhoto.single('photo_piece'), createPieceValidation, validateRequest, pieceController.createPiece);
router.post('/:id/stock/adjust', verifyToken, isVendeurOrAdmin, adjustStockValidation, validateRequest, pieceController.adjustPieceStock);
router.put('/:id/stock', verifyToken, isVendeurOrAdmin, setStockValidation, validateRequest, pieceController.setPieceStock);
router.put('/:id', verifyToken, isVendeurOrAdmin, updatePieceValidation, validateRequest, pieceController.updatePiece);
router.delete('/:id', verifyToken, isVendeurOrAdmin, getPieceValidation, validateRequest, pieceController.deletePiece);

module.exports = router;