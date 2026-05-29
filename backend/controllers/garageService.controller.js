const { pool } = require('../db');
const { asyncHandler } = require('../middlewares/asyncHandler');
const { sendApiResponse } = require('../utils/apiResponse');
const { AppError } = require('../utils/appError');
const { findGarageIdentityById, findGarageIdentityByUserId } = require('../models/garage.model');

const mapServiceRow = (row) => ({
  id: Number(row.id),
  garage_id: Number(row.garage_id),
  name: row.name,
  description: row.description || null,
  base_price: row.base_price === null ? null : Number(row.base_price),
  duration_minutes: row.duration_minutes === null ? null : Number(row.duration_minutes),
  is_active: row.is_active === null ? true : Boolean(row.is_active),
  created_at: row.created_at,
  updated_at: row.updated_at
});

const normalizeOptionalString = (value) => {
  if (value === undefined || value === null) {
    return null;
  }

  const normalized = String(value).trim();
  return normalized.length === 0 ? null : normalized;
};

const hasTable = async (tableName) => {
  const result = await pool.query(
    `SELECT 1
     FROM information_schema.tables
     WHERE table_schema = 'public'
       AND table_name = $1
     LIMIT 1`,
    [tableName]
  );

  return result.rows.length > 0;
};

const hasColumn = async (tableName, columnName) => {
  const result = await pool.query(
    `SELECT 1
     FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name = $1
       AND column_name = $2
     LIMIT 1`,
    [tableName, columnName]
  );

  return result.rows.length > 0;
};

const resolveGarageServicesSchema = async () => {
  const tableName = (await hasTable('garage_services'))
    ? 'garage_services'
    : (await hasTable('garages_services'))
      ? 'garages_services'
      : null;

  if (!tableName) {
    return null;
  }

  const [
    hasName,
    hasServiceName,
    hasDescription,
    hasBasePrice,
    hasPriceEstimate,
    hasDurationMinutes,
    hasIsActive,
    hasCreatedAt,
    hasUpdatedAt
  ] = await Promise.all([
    hasColumn(tableName, 'name'),
    hasColumn(tableName, 'service_name'),
    hasColumn(tableName, 'description'),
    hasColumn(tableName, 'base_price'),
    hasColumn(tableName, 'price_estimate'),
    hasColumn(tableName, 'duration_minutes'),
    hasColumn(tableName, 'is_active'),
    hasColumn(tableName, 'created_at'),
    hasColumn(tableName, 'updated_at')
  ]);

  return {
    tableName,
    nameColumn: hasName ? 'name' : hasServiceName ? 'service_name' : null,
    descriptionColumn: hasDescription ? 'description' : null,
    priceColumn: hasBasePrice ? 'base_price' : hasPriceEstimate ? 'price_estimate' : null,
    durationColumn: hasDurationMinutes ? 'duration_minutes' : null,
    activeColumn: hasIsActive ? 'is_active' : null,
    createdAtColumn: hasCreatedAt ? 'created_at' : null,
    updatedAtColumn: hasUpdatedAt ? 'updated_at' : null
  };
};

const buildGarageServiceSelectSql = (schema) => {
  return `SELECT
    id,
    garage_id,
    ${schema.nameColumn ? `${schema.nameColumn} AS name` : `NULL::text AS name`},
    ${schema.descriptionColumn ? `${schema.descriptionColumn} AS description` : `NULL::text AS description`},
    ${schema.priceColumn ? `${schema.priceColumn} AS base_price` : `NULL::numeric AS base_price`},
    ${schema.durationColumn ? `${schema.durationColumn} AS duration_minutes` : `NULL::integer AS duration_minutes`},
    ${schema.activeColumn ? `${schema.activeColumn} AS is_active` : `TRUE AS is_active`},
    ${schema.createdAtColumn ? `${schema.createdAtColumn} AS created_at` : `NULL::timestamp AS created_at`},
    ${schema.updatedAtColumn ? `${schema.updatedAtColumn} AS updated_at` : `NULL::timestamp AS updated_at`}
  FROM ${schema.tableName}`;
};

const getGarageById = async (garageId) => {
  const garage = await findGarageIdentityById(garageId);

  if (!garage) {
    throw new AppError('Garage non trouve', 404, 'GARAGE_NOT_FOUND');
  }

  return garage;
};

const getMyGarageRow = async (userId) => {
  const garage = await findGarageIdentityByUserId(userId);

  if (!garage) {
    throw new AppError('Profil garage introuvable pour cet utilisateur', 404, 'GARAGE_PROFILE_NOT_FOUND');
  }

  return garage;
};

const ensureManagePermission = (req, garageRow) => {
  const role = req.user?.role;
  const currentUserId = Number(req.user?.id);

  if (role === 'admin') {
    return;
  }

  if (role !== 'garage') {
    throw new AppError('Acces refuse : role non autorise', 403, 'FORBIDDEN_ROLE');
  }

  if (!garageRow.user_id || Number(garageRow.user_id) !== currentUserId) {
    throw new AppError('Acces refuse : ce garage ne vous appartient pas', 403, 'FORBIDDEN_GARAGE_ACCESS');
  }
};

const listGarageServices = asyncHandler(async (req, res) => {
  const garageId = Number.parseInt(req.params.id, 10);
  if (!Number.isInteger(garageId) || garageId <= 0) {
    throw new AppError('Identifiant garage invalide', 400, 'INVALID_GARAGE_ID');
  }

  await getGarageById(garageId);

  const schema = await resolveGarageServicesSchema();
  if (!schema) {
    return sendApiResponse(res, {
      message: 'Services du garage recuperes avec succes',
      data: { items: [] }
    });
  }

  const includeInactive = ['true', '1', 'yes', 'on'].includes(String(req.query.includeInactive || '').toLowerCase());
  const whereActiveSql = !includeInactive && schema.activeColumn ? 'AND is_active = true' : '';

  const result = await pool.query(
    `${buildGarageServiceSelectSql(schema)}
     WHERE garage_id = $1 ${whereActiveSql}
     ORDER BY ${schema.createdAtColumn ? 'created_at DESC' : 'id DESC'}`,
    [garageId]
  );

  return sendApiResponse(res, {
    message: 'Services du garage recuperes avec succes',
    data: { items: result.rows.map(mapServiceRow) }
  });
});

const listMyGarageServices = asyncHandler(async (req, res) => {
  const schema = await resolveGarageServicesSchema();
  if (!schema) {
    return sendApiResponse(res, {
      message: 'Liste de vos services recuperes avec succes',
      data: {
        garage_id: null,
        items: []
      }
    });
  }

  if (req.user?.role === 'admin') {
    const requestedGarageId = Number.parseInt(req.query?.garageId, 10);
    let myGarage = null;

    if (Number.isInteger(requestedGarageId) && requestedGarageId > 0) {
      myGarage = await findGarageIdentityById(requestedGarageId);
    } else {
      const latestGarageResult = await pool.query(
        `SELECT id, user_id
         FROM garages
         ORDER BY created_at DESC
         LIMIT 1`
      );
      myGarage = latestGarageResult.rows[0] || null;
    }

    if (!myGarage) {
      throw new AppError('Profil garage introuvable pour cet utilisateur', 404, 'GARAGE_PROFILE_NOT_FOUND');
    }

    const result = await pool.query(
      `${buildGarageServiceSelectSql(schema)}
       WHERE garage_id = $1
       ORDER BY ${schema.createdAtColumn ? 'created_at DESC' : 'id DESC'}`,
      [myGarage.id]
    );

    return sendApiResponse(res, {
      message: 'Liste de vos services recuperes avec succes',
      data: {
        garage_id: Number(myGarage.id),
        items: result.rows.map(mapServiceRow)
      }
    });
  }

  const userId = Number(req.user?.id);
  if (!Number.isInteger(userId) || userId <= 0) {
    throw new AppError('Utilisateur authentifie invalide', 401, 'INVALID_AUTH_USER');
  }

  const myGarage = await getMyGarageRow(userId);
  const result = await pool.query(
    `${buildGarageServiceSelectSql(schema)}
     WHERE garage_id = $1
     ORDER BY ${schema.createdAtColumn ? 'created_at DESC' : 'id DESC'}`,
    [myGarage.id]
  );

  return sendApiResponse(res, {
    message: 'Liste de vos services recuperes avec succes',
    data: {
      garage_id: Number(myGarage.id),
      items: result.rows.map(mapServiceRow)
    }
  });
});

const createGarageService = asyncHandler(async (req, res) => {
  const garageId = Number.parseInt(req.params.id, 10);
  if (!Number.isInteger(garageId) || garageId <= 0) {
    throw new AppError('Identifiant garage invalide', 400, 'INVALID_GARAGE_ID');
  }

  const garageRow = await getGarageById(garageId);
  ensureManagePermission(req, garageRow);

  const serviceName = normalizeOptionalString(req.body?.name);
  if (!serviceName) {
    throw new AppError('Le nom du service est obligatoire', 400, 'VALIDATION_ERROR');
  }

  const insertResult = await pool.query(
    `INSERT INTO garage_services (garage_id, name, description, base_price, duration_minutes, is_active, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, COALESCE($6, true), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
     RETURNING id, garage_id, name, description, base_price, duration_minutes, is_active, created_at, updated_at`,
    [
      garageId,
      serviceName,
      normalizeOptionalString(req.body?.description),
      req.body?.base_price === undefined || req.body?.base_price === null || req.body?.base_price === ''
        ? null
        : Number(req.body.base_price),
      req.body?.duration_minutes === undefined || req.body?.duration_minutes === null || req.body?.duration_minutes === ''
        ? null
        : Number.parseInt(req.body.duration_minutes, 10),
      req.body?.is_active
    ]
  );

  return sendApiResponse(res, {
    statusCode: 201,
    message: 'Service garage cree avec succes',
    data: mapServiceRow(insertResult.rows[0])
  });
});

const updateGarageService = asyncHandler(async (req, res) => {
  const garageId = Number.parseInt(req.params.id, 10);
  const serviceId = Number.parseInt(req.params.serviceId, 10);

  if (!Number.isInteger(garageId) || garageId <= 0) {
    throw new AppError('Identifiant garage invalide', 400, 'INVALID_GARAGE_ID');
  }

  if (!Number.isInteger(serviceId) || serviceId <= 0) {
    throw new AppError('Identifiant service invalide', 400, 'INVALID_SERVICE_ID');
  }

  const garageRow = await getGarageById(garageId);
  ensureManagePermission(req, garageRow);

  const serviceResult = await pool.query(
    `SELECT id, garage_id
     FROM garage_services
     WHERE id = $1 AND garage_id = $2`,
    [serviceId, garageId]
  );

  if (serviceResult.rows.length === 0) {
    throw new AppError('Service introuvable pour ce garage', 404, 'GARAGE_SERVICE_NOT_FOUND');
  }

  const hasAnyField = ['name', 'description', 'base_price', 'duration_minutes', 'is_active']
    .some((field) => req.body?.[field] !== undefined);

  if (!hasAnyField) {
    throw new AppError('Au moins un champ doit etre fourni', 400, 'EMPTY_UPDATE_PAYLOAD');
  }

  const updatedResult = await pool.query(
    `UPDATE garage_services
     SET name = COALESCE($1, name),
         description = COALESCE($2, description),
         base_price = COALESCE($3, base_price),
         duration_minutes = COALESCE($4, duration_minutes),
         is_active = COALESCE($5, is_active),
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $6 AND garage_id = $7
     RETURNING id, garage_id, name, description, base_price, duration_minutes, is_active, created_at, updated_at`,
    [
      req.body?.name !== undefined ? normalizeOptionalString(req.body.name) : null,
      req.body?.description !== undefined ? normalizeOptionalString(req.body.description) : null,
      req.body?.base_price !== undefined
        ? (req.body.base_price === null || req.body.base_price === '' ? null : Number(req.body.base_price))
        : null,
      req.body?.duration_minutes !== undefined
        ? (req.body.duration_minutes === null || req.body.duration_minutes === '' ? null : Number.parseInt(req.body.duration_minutes, 10))
        : null,
      req.body?.is_active !== undefined ? Boolean(req.body.is_active) : null,
      serviceId,
      garageId
    ]
  );

  return sendApiResponse(res, {
    message: 'Service garage mis a jour avec succes',
    data: mapServiceRow(updatedResult.rows[0])
  });
});

const deleteGarageService = asyncHandler(async (req, res) => {
  const garageId = Number.parseInt(req.params.id, 10);
  const serviceId = Number.parseInt(req.params.serviceId, 10);

  if (!Number.isInteger(garageId) || garageId <= 0) {
    throw new AppError('Identifiant garage invalide', 400, 'INVALID_GARAGE_ID');
  }

  if (!Number.isInteger(serviceId) || serviceId <= 0) {
    throw new AppError('Identifiant service invalide', 400, 'INVALID_SERVICE_ID');
  }

  const garageRow = await getGarageById(garageId);
  ensureManagePermission(req, garageRow);

  const result = await pool.query(
    `DELETE FROM garage_services
     WHERE id = $1 AND garage_id = $2
     RETURNING id`,
    [serviceId, garageId]
  );

  if (result.rows.length === 0) {
    throw new AppError('Service introuvable pour ce garage', 404, 'GARAGE_SERVICE_NOT_FOUND');
  }

  return sendApiResponse(res, {
    message: 'Service garage supprime avec succes',
    data: null
  });
});

module.exports = {
  listGarageServices,
  listMyGarageServices,
  createGarageService,
  updateGarageService,
  deleteGarageService
};


