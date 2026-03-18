const pool = require("../db");

// ===== VALIDATION =====
const validateVehiculePayload = (payload) => {
  const { modele_voiture, matricule_voiture, kilometrage_voiture } = payload;

  if (!modele_voiture || !matricule_voiture) {
    return "Les champs modele_voiture et matricule_voiture sont obligatoires";
  }

  if (kilometrage_voiture !== undefined && kilometrage_voiture !== null && kilometrage_voiture !== "") {
    const kmNumber = Number(kilometrage_voiture);
    if (Number.isNaN(kmNumber) || kmNumber < 0) {
      return "Le kilometrage_voiture doit etre un nombre positif";
    }
  }

  return null;
};

// ===== POST: Ajouter un véhicule =====
const createVehicule = async (req, res) => {
  const {
    modele_voiture,
    matricule_voiture,
    kilometrage_voiture,
    photo_voiture
  } = req.body;
  const uploadedPhotoUrl = req.file ? `/uploads/vehicules/${req.file.filename}` : null;

  const validationError = validateVehiculePayload({
    modele_voiture,
    matricule_voiture,
    kilometrage_voiture
  });

  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  try {
    const insertQuery = `
      INSERT INTO vehicules (
        user_id,
        modele_voiture,
        matricule_voiture,
        kilometrage_voiture,
        photo_voiture
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, user_id, modele_voiture, matricule_voiture, kilometrage_voiture, photo_voiture, created_at, updated_at
    `;

    const values = [
      req.user.id,
      modele_voiture,
      matricule_voiture,
      kilometrage_voiture !== undefined && kilometrage_voiture !== null && kilometrage_voiture !== ""
        ? Number(kilometrage_voiture)
        : null,
      uploadedPhotoUrl || photo_voiture || null
    ];

    const result = await pool.query(insertQuery, values);
    return res.status(201).json({ message: "Vehicule ajoute avec succes", vehicule: result.rows[0] });
  } catch (err) {
    if (err.code === "23505") {
      return res.status(400).json({ message: "Ce matricule_voiture existe deja" });
    }
    console.error("Erreur createVehicule:", err);
    return res.status(500).json({ message: "Erreur serveur" });
  }
};

// ===== GET: Lister les véhicules de l'utilisateur =====
const listVehicules = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, user_id, modele_voiture, matricule_voiture, kilometrage_voiture, photo_voiture, created_at, updated_at
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
  const {
    modele_voiture,
    matricule_voiture,
    kilometrage_voiture,
    photo_voiture
  } = req.body;
  const uploadedPhotoUrl = req.file ? `/uploads/vehicules/${req.file.filename}` : null;

  if (!Number.isInteger(vehiculeId) || vehiculeId <= 0) {
    return res.status(400).json({ message: "ID vehicule invalide" });
  }

  const validationError = validateVehiculePayload({
    modele_voiture,
    matricule_voiture,
    kilometrage_voiture
  });

  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  try {
    const existingVehicule = await pool.query(
      `SELECT photo_voiture FROM vehicules WHERE id = $1 AND user_id = $2`,
      [vehiculeId, req.user.id]
    );

    if (existingVehicule.rows.length === 0) {
      return res.status(404).json({ message: "Vehicule non trouve" });
    }

    const photoToSave = uploadedPhotoUrl || photo_voiture || existingVehicule.rows[0].photo_voiture || null;

    const updateQuery = `
      UPDATE vehicules
      SET
        modele_voiture = $1,
        matricule_voiture = $2,
        kilometrage_voiture = $3,
        photo_voiture = $4,
        updated_at = NOW()
      WHERE id = $5 AND user_id = $6
      RETURNING id, user_id, modele_voiture, matricule_voiture, kilometrage_voiture, photo_voiture, created_at, updated_at
    `;

    const values = [
      modele_voiture,
      matricule_voiture,
      kilometrage_voiture !== undefined && kilometrage_voiture !== null && kilometrage_voiture !== ""
        ? Number(kilometrage_voiture)
        : null,
      photoToSave,
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
      return res.status(400).json({ message: "Ce matricule_voiture existe deja" });
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