const { pool } = require('../db');
const { validationResult } = require('express-validator');
const maintenanceService = require('../services/maintenanceService');

const allowedInterventionTypes = ['révision', 'réparation', 'vidange', 'autre'];
const tableColumnsCache = new Map();

const isMissingColumnError = (error) => error && error.code === '42703';

const quoteIdentifier = (identifier) => `"${String(identifier).replace(/"/g, '""')}"`;

const getTableColumns = async (tableName, client = pool) => {
  if (tableColumnsCache.has(tableName)) {
    return tableColumnsCache.get(tableName);
  }

  const result = await client.query(
    `SELECT column_name
     FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = $1`,
    [tableName]
  );

  const columns = new Set(result.rows.map((row) => row.column_name));
  tableColumnsCache.set(tableName, columns);
  return columns;
};

const resolveColumnExpression = (columns, aliases, { required = false, type = 'TEXT' } = {}) => {
  for (const alias of aliases) {
    if (columns.has(alias)) {
      return `i.${quoteIdentifier(alias)} AS ${aliases[0]}`;
    }
  }

  if (required) {
    throw new Error(`Missing required column(s): ${aliases.join(', ')}`);
  }

  return `NULL::${type} AS ${aliases[0]}`;
};

const resolveWritableColumn = (columns, aliases) => {
  for (const alias of aliases) {
    if (columns.has(alias)) {
      return alias;
    }
  }

  return null;
};

const buildInterventionSelectList = async (client = pool) => {
  const columns = await getTableColumns('interventions', client);

  return {
    columns,
    selectList: [
      resolveColumnExpression(columns, ['id'], { required: true, type: 'BIGINT' }),
      resolveColumnExpression(columns, ['vehicle_id', 'vehicleId'], { required: true, type: 'BIGINT' }),
      resolveColumnExpression(columns, ['date_intervention', 'dateIntervention'], { type: 'DATE' }),
      resolveColumnExpression(columns, ['type', 'interventionType'], { type: 'TEXT' }),
      resolveColumnExpression(columns, ['description', 'details'], { type: 'TEXT' }),
      resolveColumnExpression(columns, ['garage_nom', 'garageNom'], { type: 'TEXT' }),
      resolveColumnExpression(columns, ['garage_adresse', 'garageAdresse'], { type: 'TEXT' }),
      resolveColumnExpression(columns, ['kilometrage', 'mileage'], { type: 'INTEGER' }),
      resolveColumnExpression(columns, ['cout_total', 'coutTotal'], { type: 'NUMERIC' }),
      resolveColumnExpression(columns, ['km_recommande', 'kmRecommande'], { type: 'INTEGER' }),
      resolveColumnExpression(columns, ['jours_recommandes', 'joursRecommandes'], { type: 'INTEGER' }),
      resolveColumnExpression(columns, ['created_at', 'createdAt'], { type: 'TIMESTAMP' }),
      resolveColumnExpression(columns, ['updated_at', 'updatedAt'], { type: 'TIMESTAMP' })
    ]
  };
};

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

// Vérifie qu'un véhicule appartient bien à l'utilisateur connecté.
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

// Charge les données principales d'une intervention.
const getInterventionBaseById = async (interventionId, client = pool) => {
  try {
    const { selectList } = await buildInterventionSelectList(client);
    const result = await client.query(
      `SELECT ${selectList.join(', ')}
       FROM interventions i
       WHERE i.id = $1`,
      [interventionId]
    );

    return result.rows[0] || null;
  } catch (error) {
    if (!isMissingColumnError(error)) throw error;

    const { columns, selectList } = await buildInterventionSelectList(client);
    if (!columns.has('vehicle_id') && !columns.has('vehicleId')) {
      throw error;
    }

    const legacyResult = await client.query(
      `SELECT ${selectList.join(', ')}
       FROM interventions i
       WHERE i.id = $1`,
      [interventionId]
    );

    return legacyResult.rows[0] || null;
  }
};

// Pieces management removed: intervention_pieces is not used by this controller anymore.

// Crée une intervention pour un véhicule appartenant à l'utilisateur.
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
    cout_total,
    pieces
  } = req.body || {};

  if (!Number.isFinite(vehicleId) || vehicleId <= 0) {
    return res.status(400).json({ message: 'vehicleId invalide' });
  }

  // `type` is optional at the API layer; if omitted, default to 'autre'.
  if (type !== undefined && !allowedInterventionTypes.includes(type)) {
    return res.status(400).json({ message: 'Type intervention invalide' });
  }
  const finalType = type || 'autre';

  const parsedKilometrage = parsePositiveInt(kilometrage, null);
  if (kilometrage !== undefined && parsedKilometrage === null) {
    return res.status(400).json({ message: 'kilometrage invalide' });
  }

  const client = await pool.connect();
  try {
    const interventionColumns = await getTableColumns('interventions', client);
    const vehicleColumn = resolveWritableColumn(interventionColumns, ['vehicle_id', 'vehicleId']);
    const dateColumn = resolveWritableColumn(interventionColumns, ['date_intervention', 'dateIntervention']);
    const typeColumn = resolveWritableColumn(interventionColumns, ['type', 'interventionType']);
    const descriptionColumn = resolveWritableColumn(interventionColumns, ['description', 'details']);
    const garageNameColumn = resolveWritableColumn(interventionColumns, ['garage_nom', 'garageNom']);
    const garageAddressColumn = resolveWritableColumn(interventionColumns, ['garage_adresse', 'garageAdresse']);
    const kilometrageColumn = resolveWritableColumn(interventionColumns, ['kilometrage', 'mileage']);
    const coutTotalColumn = resolveWritableColumn(interventionColumns, ['cout_total', 'coutTotal']);
    const updatedAtColumn = resolveWritableColumn(interventionColumns, ['updated_at', 'updatedAt']);

    if (!vehicleColumn || !typeColumn) {
      return res.status(500).json({ message: 'Schéma interventions incompatible' });
    }

    const isOwner = await checkVehicleOwnership(vehicleId, req.user.id, client);
    if (!isOwner) {
      return res.status(403).json({ message: 'Accès interdit à ce véhicule' });
    }

    const currentMileage = await getVehicleMileage(vehicleId, client);
    if (parsedKilometrage !== null && currentMileage !== null && parsedKilometrage < currentMileage) {
      return res.status(400).json({
        message: 'Le kilométrage de la nouvelle intervention doit être supérieur ou égal au kilométrage actuel du véhicule'
      });
    }

    await client.query('BEGIN');

    const insertColumns = [];
    const insertValues = [];
    const insertParams = [];

    const addInsertValue = (columnName, value) => {
      if (!columnName) return;
      insertColumns.push(quoteIdentifier(columnName));
      insertValues.push(`$${insertValues.length + 1}`);
      insertParams.push(value);
    };

    addInsertValue(vehicleColumn, vehicleId);
    if (dateColumn && date_intervention) {
      addInsertValue(dateColumn, date_intervention);
    }
    addInsertValue(typeColumn, finalType);
    addInsertValue(descriptionColumn, description || null);
    addInsertValue(garageNameColumn, garage_nom || null);
    addInsertValue(garageAddressColumn, garage_adresse || null);
    addInsertValue(kilometrageColumn, parsedKilometrage);
    addInsertValue(coutTotalColumn, Number.isFinite(Number(cout_total)) && Number(cout_total) >= 0 ? Number(cout_total) : 0);
    addInsertValue(updatedAtColumn, new Date());

    const insertInterventionResult = await client.query(
      `INSERT INTO interventions (${insertColumns.join(', ')})
       VALUES (${insertValues.join(', ')})
       RETURNING id`,
      insertParams
    );

    const interventionId = insertInterventionResult.rows[0].id;

    await client.query('COMMIT');

    const fallbackPayload = {
      id: interventionId,
      vehicle_id: vehicleId,
      date_intervention: date_intervention || new Date().toISOString().slice(0, 10),
      type: finalType,
      description: description || null,
      garage_nom: garage_nom || null,
      garage_adresse: garage_adresse || null,
      kilometrage: parsedKilometrage,
      cout_total: Number.isFinite(Number(cout_total)) && Number(cout_total) >= 0 ? Number(cout_total) : 0,
      km_recommande: 15000,
      jours_recommandes: 365,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    await maintenanceService.syncMaintenanceState(vehicleId).catch((error) => {
      console.error('Failed to sync maintenance state after intervention creation:', error);
    });

    let responsePayload = fallbackPayload;
    try {
      responsePayload = await getInterventionBaseById(interventionId) || fallbackPayload;
    } catch (readError) {
      console.error('Failed to reload created intervention, using fallback payload:', readError);
    }

    return res.status(201).json(responsePayload);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    return res.status(500).json({ message: 'Erreur serveur' });
  } finally {
    client.release();
  }
};

// Liste toutes les interventions d'un véhicule de l'utilisateur connecté.
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

    const { columns, selectList } = await buildInterventionSelectList();
    const vehicleColumn = columns.has('vehicle_id')
      ? 'vehicle_id'
      : columns.has('vehicleId')
        ? 'vehicleId'
        : null;

    if (!vehicleColumn) {
      throw new Error('Interventions table missing vehicle column');
    }

    const orderColumn = columns.has('date_intervention')
      ? 'date_intervention'
      : columns.has('dateIntervention')
        ? 'dateIntervention'
        : columns.has('created_at')
          ? 'created_at'
          : columns.has('createdAt')
            ? 'createdAt'
            : 'id';

    const result = await pool.query(
      `SELECT ${selectList.join(', ')}
       FROM interventions i
       WHERE i.${quoteIdentifier(vehicleColumn)} = $1
       ORDER BY i.${quoteIdentifier(orderColumn)} DESC, i.id DESC`,
      [vehicleId]
    );

    return res.json(result.rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Retourne le détail d'une intervention (avec pièces) si autorisée.
exports.getInterventionById = async (req, res) => {
  const interventionId = Number.parseInt(req.params.id, 10);

  if (!Number.isFinite(interventionId) || interventionId <= 0) {
    return res.status(400).json({ message: 'ID intervention invalide' });
  }

  try {
    const intervention = await getInterventionBaseById(interventionId);
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

// Met à jour les champs principaux d'une intervention existante.
exports.updateIntervention = async (req, res) => {
  const interventionId = Number.parseInt(req.params.id, 10);
  const {
    date_intervention,
    type,
    description,
    garage_nom,
    garage_adresse,
    kilometrage
    , cout_total
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
        message: 'Le kilométrage de l’intervention ne peut pas être inférieur au kilométrage actuel du véhicule'
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
         cout_total = $7,
         updated_at = NOW()
       WHERE id = $8`,
      [
        date_intervention || current.date_intervention,
        type || current.type,
        description !== undefined ? description : current.description,
        garage_nom !== undefined ? garage_nom : current.garage_nom,
        garage_adresse !== undefined ? garage_adresse : current.garage_adresse,
        kilometrage !== undefined ? parsedKilometrage : current.kilometrage,
        cout_total !== undefined && Number.isFinite(Number(cout_total)) && Number(cout_total) >= 0
          ? Number(cout_total)
          : current.cout_total,
        interventionId
      ]
    );

    const updated = await getInterventionBaseById(interventionId);

    await maintenanceService.syncMaintenanceState(current.vehicle_id).catch((error) => {
      console.error('Failed to sync maintenance state after intervention update:', error);
    });

    return res.json(updated);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Supprime une intervention après vérification de propriété.
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

// Ajoute (ou incrémente) une pièce liée à une intervention.
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

    const updated = await getInterventionBaseById(interventionId);
    return res.json(updated);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    return res.status(500).json({ message: 'Erreur serveur' });
  } finally {
    client.release();
  }
};

// Retire une pièce d'une intervention puis recalcule le coût total.
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

    const updated = await getInterventionBaseById(interventionId);
    return res.json(updated);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    return res.status(500).json({ message: 'Erreur serveur' });
  } finally {
    client.release();
  }
};


