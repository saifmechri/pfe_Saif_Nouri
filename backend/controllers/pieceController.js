const { pool } = require('../db');
const { validationResult } = require('express-validator');

// Crée une nouvelle pièce avec validation des champs.
exports.createPiece = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { nom, reference, description, prix_unitaire, stock } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO pieces (nom, reference, description, prix_unitaire, stock)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, nom, reference, description, prix_unitaire, stock, created_at, updated_at`,
      [nom, reference, description || null, prix_unitaire, stock || 0]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ message: 'Cette référence de pièce existe déjà' });
    }
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Retourne toutes les pièces triées par nom.
exports.getAllPieces = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, nom, reference, description, prix_unitaire, stock, created_at, updated_at
       FROM pieces
       ORDER BY nom ASC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Retourne une pièce unique à partir de son identifiant.
exports.getPieceById = async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await pool.query(
      `SELECT id, nom, reference, description, prix_unitaire, stock, created_at, updated_at
       FROM pieces
       WHERE id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Pièce non trouvée' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Met à jour une pièce existante.
exports.updatePiece = async (req, res) => {
  const { id } = req.params;
  const { nom, reference, description, prix_unitaire, stock } = req.body;

  try {
    const currentResult = await pool.query('SELECT * FROM pieces WHERE id = $1', [id]);
    if (currentResult.rows.length === 0) {
      return res.status(404).json({ message: 'Pièce non trouvée' });
    }

    const current = currentResult.rows[0];

    const updateResult = await pool.query(
      `UPDATE pieces
       SET
         nom = $1,
         reference = $2,
         description = $3,
         prix_unitaire = $4,
         stock = $5,
         updated_at = NOW()
       WHERE id = $6
       RETURNING id, nom, reference, description, prix_unitaire, stock, created_at, updated_at`,
      [
        nom || current.nom,
        reference || current.reference,
        description !== undefined ? description : current.description,
        prix_unitaire !== undefined ? prix_unitaire : current.prix_unitaire,
        stock !== undefined ? stock : current.stock,
        id
      ]
    );

    res.json(updateResult.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ message: 'Cette référence de pièce existe déjà' });
    }
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Supprime une pièce existante.
exports.deletePiece = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `DELETE FROM pieces WHERE id = $1 RETURNING id`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Pièce non trouvée' });
    }
    res.json({ message: 'Pièce supprimée' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};
