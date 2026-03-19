const express = require('express');
const router = express.Router();
const pieceController = require('../controllers/pieceController');
const { verifyToken } = require('../middlwares/authMiddleware');
const { body } = require('express-validator');

// Validation des champs de pièce
const validatePiece = [
  body('nom').notEmpty().withMessage('Le nom est obligatoire'),
  body('reference').notEmpty().withMessage('La référence est obligatoire'),
  body('prix_unitaire').isDecimal().withMessage('Le prix doit être un nombre décimal'),
  body('stock').optional().isInt({ min: 0 }).withMessage('Le stock doit être un nombre positif')
];

// GET - Récupérer toutes les pièces (public)
router.get('/', pieceController.getAllPieces);

// GET - Récupérer une pièce par ID (public)
router.get('/:id', pieceController.getPieceById);

// POST - Créer une pièce (protégé - authentifié)
router.post('/', verifyToken, validatePiece, pieceController.createPiece);

// PUT - Mettre à jour une pièce (protégé - authentifié)
router.put('/:id', verifyToken, validatePiece, pieceController.updatePiece);

// DELETE - Supprimer une pièce (protégé - authentifié)
router.delete('/:id', verifyToken, pieceController.deletePiece);

module.exports = router;
