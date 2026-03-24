const { Piece } = require('../db');
const { validationResult } = require('express-validator');

// Créer une pièce
exports.createPiece = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { nom, reference, description, prix_unitaire, stock } = req.body;

  try {
    const piece = await Piece.create({
      nom,
      reference,
      description,
      prix_unitaire,
      stock: stock || 0
    });

    res.status(201).json(piece);
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: 'Cette référence de pièce existe déjà' });
    }
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Récupérer toutes les pièces
exports.getAllPieces = async (req, res) => {
  try {
    const pieces = await Piece.findAll({
      order: [['nom', 'ASC']]
    });
    res.json(pieces);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Récupérer une pièce par ID
exports.getPieceById = async (req, res) => {
  const { id } = req.params;
  
  try {
    const piece = await Piece.findByPk(id);
    if (!piece) {
      return res.status(404).json({ message: 'Pièce non trouvée' });
    }
    res.json(piece);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Mettre à jour une pièce
exports.updatePiece = async (req, res) => {
  const { id } = req.params;
  const { nom, reference, description, prix_unitaire, stock } = req.body;

  try {
    const piece = await Piece.findByPk(id);
    if (!piece) {
      return res.status(404).json({ message: 'Pièce non trouvée' });
    }

    await piece.update({
      nom: nom || piece.nom,
      reference: reference || piece.reference,
      description: description || piece.description,
      prix_unitaire: prix_unitaire !== undefined ? prix_unitaire : piece.prix_unitaire,
      stock: stock !== undefined ? stock : piece.stock
    });

    res.json(piece);
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: 'Cette référence de pièce existe déjà' });
    }
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Supprimer une pièce
exports.deletePiece = async (req, res) => {
  const { id } = req.params;

  try {
    const piece = await Piece.findByPk(id);
    if (!piece) {
      return res.status(404).json({ message: 'Pièce non trouvée' });
    }

    await piece.destroy();
    res.json({ message: 'Pièce supprimée' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};
