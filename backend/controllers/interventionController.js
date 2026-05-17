const { pool } = require('../db');
const { validationResult } = require('express-validator');
const maintenanceService = require('../services/maintenanceService');

const allowedInterventionTypes = ['révision', 'réparation', 'vidange', 'autre'];

const isMissingColumnError = (error) => error && error.code === '42703';

const getVehicleMileage = async (vehicleId, client = pool) => {
  const result = await client.query(
    'SELECT kilometrage_voiture FROM vehicules WHERE id = $1',
    [vehicleId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const mileage = Number(result.rows[0].kilometrage_voiture);
  return Number.isFinite(mileage) ? mileage : 0;
};

// Convertit une valeur en entier positif (ou retourne fallback).
const parsePositiveInt = (value, fallback = null) => {
  if (value === undefined || value === null || value === '') return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 0) return fallback;
  return parsed;
};

// VÃ©rifie qu'un véhicule appartient bien Ã  l'utilisateur connectÃ©.
const checkVehicleOwnership = async (vehicleId, userId, client = pool) => {
  try {
    const result = await client.query(
      'SELECT id FROM vehicules WHERE id = $1 AND user_id = $2',
      [vehicleId, userId]
    );
    return result.rows.length > 0;
  } catch (error) {
    if (!isMissingColumnError(error)) throw error;

    const legacyResult = await client.query(
      'SELECT id FROM vehicules WHERE id = $1 AND "userId" = $2',
      [vehicleId, userId]
    );
    return legacyResult.rows.length > 0;
  }
};

// Charge les donnÃ©es principales d'une intervention.
const getInterventionBaseById = async (interventionId, client = pool) => {
  try {
    const result = await client.query(
      `SELECT
         i.id,
         i.vehicle_id,
         i.date_intervention,
         i.type,
         i.description,
         i.garage_nom,
         i.garage_adresse,
         i.kilometrage,
         i.cout_total,
         i.km_recommande,
         i.jours_recommandes,
         i.created_at,
         i.updated_at
       FROM interventions i
       WHERE i.id = $1`,
      [interventionId]
    );

    return result.rows[0] || null;
  } catch (error) {
    if (!isMissingColumnError(error)) throw error;

    const legacyResult = await client.query(
      `SELECT
         i.id,
         COALESCE(i.vehicle_id, i."vehicleId") AS vehicle_id,
         i.date_intervention,
         i.type,
         i.description,
         i.garage_nom,
         i.garage_adresse,
         i.kilometrage,
         i.cout_total,
         i.km_recommande,
         i.jours_recommandes,
         i."createdAt" AS created_at,
         i."updatedAt" AS updated_at
       FROM interventions i
       WHERE i.id = $1`,
      [interventionId]
    );

    return legacyResult.rows[0] || null;
  }
};

// Charge les pièces liÃ©es Ã  une intervention.
const getPiecesByInterventionId = async (interventionId, client = pool) => {
  try {
    const result = await client.query(
      `SELECT
         p.id,
         p.nom,
         p.reference,
         p.description,
         p.prix_unitaire,
         p.stock,
         ip.quantite,
         ip.prix_unitaire_applique
       FROM intervention_pieces ip
       JOIN pieces p ON p.id = ip.piece_id
       WHERE ip.intervention_id = $1
       ORDER BY p.nom ASC`,
      [interventionId]
    );

    return result.rows;
  } catch (error) {
    if (!isMissingColumnError(error)) throw error;

    const legacyResult = await client.query(
      `SELECT
         p.id,
         p.nom,
         p.reference,
         p.description,
         p.prix_unitaire,
         p.stock,
         ip.quantite,
         ip.prix_unitaire_applique
       FROM intervention_pieces ip
       JOIN pieces p ON p.id = COALESCE(ip.piece_id, ip."pieceId")
       WHERE COALESCE(ip.intervention_id, ip."interventionId") = $1
       ORDER BY p.nom ASC`,
      [interventionId]
    );

    return legacyResult.rows;
  }
};

// AgrÃ¨ge intervention + pièces dans un seul objet de réponse.
const getInterventionWithPiecesById = async (interventionId, client = pool) => {
  const intervention = await getInterventionBaseById(interventionId, client);
  if (!intervention) return null;

  const pieces = await getPiecesByInterventionId(interventionId, client);
  return {
    ...intervention,
    pieces
  };
};

// Recalcule le coÃ»t total d'une intervention Ã  partir des pièces liÃ©es.
const recalculateInterventionTotal = async (interventionId, client = pool) => {
  const sumResult = await client.query(
    `SELECT COALESCE(SUM(quantite * prix_unitaire_applique), 0) AS total
     FROM intervention_pieces
     WHERE intervention_id = $1`,
    [interventionId]
  );

  const total = Number(sumResult.rows[0]?.total || 0);

  await client.query(
    `UPDATE interventions
     SET cout_total = $1, updated_at = NOW()
     WHERE id = $2`,
    [total, interventionId]
  );

  return total;
};

// CrÃ©e une intervention pour un véhicule appartenant Ã  l'utilisateur.
exports.createIntervention = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const vehicleId = Number.parseInt(req.params.vehicleId, 10);
  const {
    date_intervention,
    type,
    description,
    garage_nom,
    garage_adresse,
    kilometrage,
    pieces
  } = req.body || {};

  if (!Number.isFinite(vehicleId) || vehicleId <= 0) {
    return res.status(400).json({ message: 'vehicleId invalide' });
  }

  if (!allowedInterventionTypes.includes(type)) {
    return res.status(400).json({ message: 'Type intervention invalide' });
  }

  const parsedKilometrage = parsePositiveInt(kilometrage, null);
  if (kilometrage !== undefined && parsedKilometrage === null) {
    return res.status(400).json({ message: 'kilometrage invalide' });
  }

  const client = await pool.connect();
  try {
    const isOwner = await checkVehicleOwnership(vehicleId, req.user.id, client);
    if (!isOwner) {
      return res.status(403).json({ message: 'Accès interdit Ã  ce véhicule' });
    }

    const currentMileage = await getVehicleMileage(vehicleId, client);
    if (parsedKilometrage !== null && currentMileage !== null && parsedKilometrage < currentMileage) {
      return res.status(400).json({
        message: 'Le kilométrage de la nouvelle intervention doit être supÃ©rieur ou Ã©gal au kilométrage actuel du véhicule'
      });
    }

    await client.query('BEGIN');

    const insertInterventionResult = await client.query(
      `INSERT INTO interventions (
         vehicle_id,
         date_intervention,
         type,
         description,
         garage_nom,
         garage_adresse,
         kilometrage,
         cout_total,
         updated_at
       )
       VALUES ($1, COALESCE($2, CURRENT_DATE), $3, $4, $5, $6, $7, 0, NOW())
       RETURNING id`,
      [
        vehicleId,
        date_intervention || null,
        type,
        description || null,
        garage_nom || null,
        garage_adresse || null,
        parsedKilometrage
      ]
    );

    const interventionId = insertInterventionResult.rows[0].id;

    if (Array.isArray(pieces) && pieces.length > 0) {
      for (const item of pieces) {
        const pieceId = Number.parseInt(item?.pieceId, 10);
        const quantite = parsePositiveInt(item?.quantite, 1) || 1;

        if (!Number.isFinite(pieceId) || pieceId <= 0) {
          throw new Error('PIECE_ID_INVALID');
        }

        const pieceResult = await client.query(
          'SELECT id, prix_unitaire FROM pieces WHERE id = $1',
          [pieceId]
        );

        if (pieceResult.rows.length === 0) {
          throw new Error(`PIECE_NOT_FOUND_${pieceId}`);
        }

        const fallbackUnitPrice = Number(pieceResult.rows[0].prix_unitaire);
        const customPrice = item?.prix_unitaire !== undefined ? Number(item.prix_unitaire) : NaN;
        const prixUnitaireApplique = Number.isFinite(customPrice) && customPrice >= 0
          ? customPrice
          : fallbackUnitPrice;

        await client.query(
          `INSERT INTO intervention_pieces (
             intervention_id,
             piece_id,
             quantite,
             prix_unitaire_applique
           )
           VALUES ($1, $2, $3, $4)`,
          [interventionId, pieceId, quantite, prixUnitaireApplique]
        );
      }
    }

    await recalculateInterventionTotal(interventionId, client);
    await client.query('COMMIT');

    await maintenanceService.syncMaintenanceState(vehicleId).catch((error) => {
      console.error('Failed to sync maintenance state after intervention creation:', error);
    });

    const responsePayload = await getInterventionWithPiecesById(interventionId);
    return res.status(201).json(responsePayload);
  } catch (error) {
    await client.query('ROLLBACK');

    if (error.message === 'PIECE_ID_INVALID') {
      return res.status(400).json({ message: 'pieceId invalide dans la liste des pièces' });
    }

    if (error.message.startsWith('PIECE_NOT_FOUND_')) {
      const missingId = error.message.replace('PIECE_NOT_FOUND_', '');
      return res.status(400).json({ message: `Pièce id ${missingId} introuvable` });
    }

    console.error(error);
    return res.status(500).json({ message: 'Erreur serveur' });
  } finally {
    client.release();
  }
};

// Liste toutes les interventions d'un véhicule de l'utilisateur connectÃ©.
exports.getInterventionsByVehicle = async (req, res) => {
  const vehicleId = Number.parseInt(req.params.vehicleId, 10);

  if (!Number.isFinite(vehicleId) || vehicleId <= 0) {
    return res.status(400).json({ message: 'vehicleId invalide' });
  }

  try {
    const isOwner = await checkVehicleOwnership(vehicleId, req.user.id);
    if (!isOwner) {
      return res.status(403).json({ message: 'Accès interdit' });
    }

    let result;
    try {
      result = await pool.query(
        `SELECT
           id,
           vehicle_id,
           date_intervention,
           type,
           description,
           garage_nom,
           garage_adresse,
           kilometrage,
           cout_total,
           km_recommande,
           jours_recommandes,
           created_at,
           updated_at
         FROM interventions
         WHERE vehicle_id = $1
         ORDER BY date_intervention DESC, id DESC`,
        [vehicleId]
      );
    } catch (error) {
      if (!isMissingColumnError(error)) throw error;

      result = await pool.query(
        `SELECT
           id,
           COALESCE(vehicle_id, "vehicleId") AS vehicle_id,
           date_intervention,
           type,
           description,
           garage_nom,
           garage_adresse,
           kilometrage,
           cout_total,
           km_recommande,
           jours_recommandes,
           "createdAt" AS created_at,
           "updatedAt" AS updated_at
         FROM interventions
         WHERE COALESCE(vehicle_id, "vehicleId") = $1
         ORDER BY date_intervention DESC, id DESC`,
        [vehicleId]
      );
    }

    const interventions = [];
    for (const row of result.rows) {
      const pieces = await getPiecesByInterventionId(row.id);
      interventions.push({ ...row, pieces });
    }

    return res.json(interventions);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Retourne le détail d'une intervention (avec pièces) si autorisÃ©e.
exports.getInterventionById = async (req, res) => {
  const interventionId = Number.parseInt(req.params.id, 10);

  if (!Number.isFinite(interventionId) || interventionId <= 0) {
    return res.status(400).json({ message: 'ID intervention invalide' });
  }

  try {
    const intervention = await getInterventionWithPiecesById(interventionId);
    if (!intervention) {
      return res.status(404).json({ message: 'Intervention non trouvée' });
    }

    const isOwner = await checkVehicleOwnership(intervention.vehicle_id, req.user.id);
    if (!isOwner) {
      return res.status(403).json({ message: 'Accès interdit' });
    }

    return res.json(intervention);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Met Ã  jour les champs principaux d'une intervention existante.
exports.updateIntervention = async (req, res) => {
  const interventionId = Number.parseInt(req.params.id, 10);
  const {
    date_intervention,
    type,
    description,
    garage_nom,
    garage_adresse,
    kilometrage
  } = req.body || {};

  if (!Number.isFinite(interventionId) || interventionId <= 0) {
    return res.status(400).json({ message: 'ID intervention invalide' });
  }

  if (type !== undefined && !allowedInterventionTypes.includes(type)) {
    return res.status(400).json({ message: 'Type intervention invalide' });
  }

  const parsedKilometrage = parsePositiveInt(kilometrage, null);
  if (kilometrage !== undefined && parsedKilometrage === null) {
    return res.status(400).json({ message: 'kilometrage invalide' });
  }

  try {
    const current = await getInterventionBaseById(interventionId);
    if (!current) {
      return res.status(404).json({ message: 'Intervention non trouvée' });
    }

    const isOwner = await checkVehicleOwnership(current.vehicle_id, req.user.id);
    if (!isOwner) {
      return res.status(403).json({ message: 'Accès interdit' });
    }

    const currentMileage = await getVehicleMileage(current.vehicle_id);
    if (parsedKilometrage !== null && currentMileage !== null && parsedKilometrage < currentMileage) {
      return res.status(400).json({
        message: 'Le kilométrage de lâ€™intervention ne peut pas être infÃ©rieur au kilométrage actuel du véhicule'
      });
    }

    await pool.query(
      `UPDATE interventions
       SET
         date_intervention = $1,
         type = $2,
         description = $3,
         garage_nom = $4,
         garage_adresse = $5,
         kilometrage = $6,
         updated_at = NOW()
       WHERE id = $7`,
      [
        date_intervention || current.date_intervention,
        type || current.type,
        description !== undefined ? description : current.description,
        garage_nom !== undefined ? garage_nom : current.garage_nom,
        garage_adresse !== undefined ? garage_adresse : current.garage_adresse,
        kilometrage !== undefined ? parsedKilometrage : current.kilometrage,
        interventionId
      ]
    );

    const updated = await getInterventionWithPiecesById(interventionId);

    await maintenanceService.syncMaintenanceState(current.vehicle_id).catch((error) => {
      console.error('Failed to sync maintenance state after intervention update:', error);
    });

    return res.json(updated);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Supprime une intervention aprÃ¨s vÃ©rification de propriÃ©tÃ©.
exports.deleteIntervention = async (req, res) => {
  const interventionId = Number.parseInt(req.params.id, 10);

  if (!Number.isFinite(interventionId) || interventionId <= 0) {
    return res.status(400).json({ message: 'ID intervention invalide' });
  }

  try {
    const current = await getInterventionBaseById(interventionId);
    if (!current) {
      return res.status(404).json({ message: 'Intervention non trouvée' });
    }

    const isOwner = await checkVehicleOwnership(current.vehicle_id, req.user.id);
    if (!isOwner) {
      return res.status(403).json({ message: 'Accès interdit' });
    }

    await pool.query('DELETE FROM interventions WHERE id = $1', [interventionId]);

    await maintenanceService.syncMaintenanceState(current.vehicle_id).catch((error) => {
      console.error('Failed to sync maintenance state after intervention deletion:', error);
    });

    return res.json({ message: 'Intervention supprimée' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Ajoute (ou incrÃ©mente) une pièce liÃ©e Ã  une intervention.
exports.addPieceToIntervention = async (req, res) => {
  const interventionId = Number.parseInt(req.params.id, 10);
  const pieceId = Number.parseInt(req.body?.pieceId, 10);
  const quantite = parsePositiveInt(req.body?.quantite, 1) || 1;
  const customUnitPrice = req.body?.prix_unitaire;

  if (!Number.isFinite(interventionId) || interventionId <= 0) {
    return res.status(400).json({ message: 'ID intervention invalide' });
  }

  if (!Number.isFinite(pieceId) || pieceId <= 0) {
    return res.status(400).json({ message: 'pieceId invalide' });
  }

  if (customUnitPrice !== undefined && (!Number.isFinite(Number(customUnitPrice)) || Number(customUnitPrice) < 0)) {
    return res.status(400).json({ message: 'prix_unitaire invalide' });
  }

  const client = await pool.connect();
  try {
    const intervention = await getInterventionBaseById(interventionId, client);
    if (!intervention) {
      return res.status(404).json({ message: 'Intervention non trouvée' });
    }

    const isOwner = await checkVehicleOwnership(intervention.vehicle_id, req.user.id, client);
    if (!isOwner) {
      return res.status(403).json({ message: 'Accès interdit' });
    }

    const pieceResult = await client.query(
      'SELECT id, prix_unitaire FROM pieces WHERE id = $1',
      [pieceId]
    );

    if (pieceResult.rows.length === 0) {
      return res.status(404).json({ message: 'Pièce non trouvée' });
    }

    const fallbackPrice = Number(pieceResult.rows[0].prix_unitaire);
    const appliedPrice = customUnitPrice !== undefined ? Number(customUnitPrice) : fallbackPrice;

    await client.query('BEGIN');

    const existing = await client.query(
      `SELECT quantite FROM intervention_pieces
       WHERE intervention_id = $1 AND piece_id = $2`,
      [interventionId, pieceId]
    );

    if (existing.rows.length > 0) {
      await client.query(
        `UPDATE intervention_pieces
         SET quantite = quantite + $1
         WHERE intervention_id = $2 AND piece_id = $3`,
        [quantite, interventionId, pieceId]
      );
    } else {
      await client.query(
        `INSERT INTO intervention_pieces (intervention_id, piece_id, quantite, prix_unitaire_applique)
         VALUES ($1, $2, $3, $4)`,
        [interventionId, pieceId, quantite, appliedPrice]
      );
    }

    await recalculateInterventionTotal(interventionId, client);
    await client.query('COMMIT');

    await maintenanceService.syncMaintenanceState(intervention.vehicle_id).catch((error) => {
      console.error('Failed to sync maintenance state after adding a piece:', error);
    });

    const updated = await getInterventionWithPiecesById(interventionId);
    return res.json(updated);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    return res.status(500).json({ message: 'Erreur serveur' });
  } finally {
    client.release();
  }
};

// Retire une pièce d'une intervention puis recalcule le coÃ»t total.
exports.removePieceFromIntervention = async (req, res) => {
  const interventionId = Number.parseInt(req.params.id, 10);
  const pieceId = Number.parseInt(req.params.pieceId, 10);

  if (!Number.isFinite(interventionId) || interventionId <= 0) {
    return res.status(400).json({ message: 'ID intervention invalide' });
  }

  if (!Number.isFinite(pieceId) || pieceId <= 0) {
    return res.status(400).json({ message: 'pieceId invalide' });
  }

  const client = await pool.connect();
  try {
    const intervention = await getInterventionBaseById(interventionId, client);
    if (!intervention) {
      return res.status(404).json({ message: 'Intervention non trouvée' });
    }

    const isOwner = await checkVehicleOwnership(intervention.vehicle_id, req.user.id, client);
    if (!isOwner) {
      return res.status(403).json({ message: 'Accès interdit' });
    }

    await client.query('BEGIN');
    await client.query(
      'DELETE FROM intervention_pieces WHERE intervention_id = $1 AND piece_id = $2',
      [interventionId, pieceId]
    );

    await recalculateInterventionTotal(interventionId, client);
    await client.query('COMMIT');

    await maintenanceService.syncMaintenanceState(intervention.vehicle_id).catch((error) => {
      console.error('Failed to sync maintenance state after removing a piece:', error);
    });

    const updated = await getInterventionWithPiecesById(interventionId);
    return res.json(updated);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    return res.status(500).json({ message: 'Erreur serveur' });
  } finally {
    client.release();
  }
};


