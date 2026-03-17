const pool = require("../db");

const currentYear = new Date().getFullYear();

// ===== VALIDATION =====
const validateVehiculePayload = (payload) => {
  const { marque, modele, annee, immatriculation, kilometrage } = payload;

  if (!marque || !modele || !annee || !immatriculation) {
    return "Les champs marque, modele, annee et immatriculation sont obligatoires";
  }

  const anneeNumber = Number(annee);
  if (!Number.isInteger(anneeNumber) || anneeNumber < 1900 || anneeNumber > currentYear + 1) {
    return "L'annee du vehicule est invalide";
  }

  if (kilometrage !== undefined && kilometrage !== null) {
    const kmNumber = Number(kilometrage);
    if (Number.isNaN(kmNumber) || kmNumber < 0) {
      return "Le kilometrage doit etre un nombre positif";
    }
  }

  return null;
};

// ===== POST: Ajouter un véhicule =====
const createVehicule = async (req, res) => {
  const { marque, modele, annee, immatriculation, couleur, kilometrage, photo_url } = req.body;

  const validationError = validateVehiculePayload({
    marque,
    modele,
    annee,
    immatriculation,
    kilometrage
  });

  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  try {
    const insertQuery = `
      INSERT INTO vehicules (
        user_id,
        marque,
        modele,
        annee,
        immatriculation,
        couleur,
        kilometrage,
        photo_url
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, user_id, marque, modele, annee, immatriculation, couleur, kilometrage, photo_url, created_at, updated_at
    `;

    const values = [
      req.user.id,
      marque,
      modele,
      Number(annee),
      immatriculation,
      couleur || null,
      kilometrage !== undefined && kilometrage !== null ? Number(kilometrage) : null,
      photo_url || null
    ];

    const result = await pool.query(insertQuery, values);
    return res.status(201).json({ message: "Vehicule ajoute avec succes", vehicule: result.rows[0] });
  } catch (err) {
    if (err.code === "23505") {
      return res.status(400).json({ message: "Cette immatriculation existe deja" });
    }
    console.error("Erreur createVehicule:", err);
    return res.status(500).json({ message: "Erreur serveur" });
  }
};

// ===== GET: Lister les véhicules de l'utilisateur =====
const listVehicules = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, user_id, marque, modele, annee, immatriculation, couleur, kilometrage, photo_url, created_at, updated_at
       FROM vehicules
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [req.user.id]
    );

    return res.json({ vehicules: result.rows });
  } catch (err) {
    console.error("Erreur listVehicules:", err);
    return res.status(500).json({ message: "Erreur serveur" });
  }
};

// ===== PUT: Modifier un véhicule =====
const updateVehicule = async (req, res) => {
  const vehiculeId = Number(req.params.id);
  const { marque, modele, annee, immatriculation, couleur, kilometrage, photo_url } = req.body;

  if (!Number.isInteger(vehiculeId) || vehiculeId <= 0) {
    return res.status(400).json({ message: "ID vehicule invalide" });
  }

  const validationError = validateVehiculePayload({
    marque,
    modele,
    annee,
    immatriculation,
    kilometrage
  });

  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  try {
    const updateQuery = `
      UPDATE vehicules
      SET
        marque = $1,
        modele = $2,
        annee = $3,
        immatriculation = $4,
        couleur = $5,
        kilometrage = $6,
        photo_url = $7,
        updated_at = NOW()
      WHERE id = $8 AND user_id = $9
      RETURNING id, user_id, marque, modele, annee, immatriculation, couleur, kilometrage, photo_url, created_at, updated_at
    `;

    const values = [
      marque,
      modele,
      Number(annee),
      immatriculation,
      couleur || null,
      kilometrage !== undefined && kilometrage !== null ? Number(kilometrage) : null,
      photo_url || null,
      vehiculeId,
      req.user.id
    ];

    const result = await pool.query(updateQuery, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Vehicule non trouve" });
    }

    return res.json({ message: "Vehicule modifie avec succes", vehicule: result.rows[0] });
  } catch (err) {
    if (err.code === "23505") {
      return res.status(400).json({ message: "Cette immatriculation existe deja" });
    }
    console.error("Erreur updateVehicule:", err);
    return res.status(500).json({ message: "Erreur serveur" });
  }
};

// ===== DELETE: Supprimer un véhicule =====
const deleteVehicule = async (req, res) => {
  const vehiculeId = Number(req.params.id);

  if (!Number.isInteger(vehiculeId) || vehiculeId <= 0) {
    return res.status(400).json({ message: "ID vehicule invalide" });
  }

  try {
    const result = await pool.query(
      `DELETE FROM vehicules
       WHERE id = $1 AND user_id = $2
       RETURNING id`,
      [vehiculeId, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Vehicule non trouve" });
    }

    return res.json({ message: "Vehicule supprime avec succes" });
  } catch (err) {
    console.error("Erreur deleteVehicule:", err);
    return res.status(500).json({ message: "Erreur serveur" });
  }
};

module.exports = {
  createVehicule,
  listVehicules,
  updateVehicule,
  deleteVehicule
};