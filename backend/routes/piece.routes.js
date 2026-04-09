const express = require('express');
const { body, param, query } = require('express-validator');
const { verifyToken } = require('../middlwares/authMiddleware');
const { isVendeurOrAdmin } = require('../middlwares/roleMiddleware');
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

router.get('/', listPiecesValidation, validateRequest, pieceController.getAllPieces);
router.get('/:id', getPieceValidation, validateRequest, pieceController.getPieceById);

router.post('/', verifyToken, isVendeurOrAdmin, createPieceValidation, validateRequest, pieceController.createPiece);
router.put('/:id', verifyToken, isVendeurOrAdmin, updatePieceValidation, validateRequest, pieceController.updatePiece);
router.delete('/:id', verifyToken, isVendeurOrAdmin, getPieceValidation, validateRequest, pieceController.deletePiece);

module.exports = router;