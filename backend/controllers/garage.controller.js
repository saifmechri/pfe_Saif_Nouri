const { pool } = require('../db');
const { asyncHandler } = require('../middlewares/asyncHandler');
const { sendApiResponse } = require('../utils/apiResponse');
const { AppError } = require('../utils/appError');
const { haversine } = require('../utils/algorithms');

const mapGarageRow = (row) => ({
  id: Number(row.id),
  user_id: row.user_id === null ? null : Number(row.user_id),
  name: row.name,
  adresse: row.adresse || null,
  telephone: row.telephone || null,
  email: row.email || null,
  latitude: row.latitude === null ? null : Number(row.latitude),
  longitude: row.longitude === null ? null : Number(row.longitude),
  rating: row.rating === null ? null : Number(row.rating),
  is_open: row.is_open === null ? true : Boolean(row.is_open),
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

const parseNullableNumber = (value, fieldName) => {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new AppError(`${fieldName} invalide`, 400, 'INVALID_NUMERIC_VALUE');
  }

  return parsed;
};

const parseOptionalCoordinate = (value, fieldName) => {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new AppError(`${fieldName} invalide`, 400, 'INVALID_COORDINATE');
  }

  return parsed;
};

const parseOptionalPositiveNumber = (value, fieldName) => {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new AppError(`${fieldName} doit etre superieur a 0`, 400, 'INVALID_NUMERIC_VALUE');
  }

  return parsed;
};

const parseOptionalIntegerList = (value, fieldName) => {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const rawItems = String(value)
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

  if (rawItems.length === 0) {
    throw new AppError(`${fieldName} invalide`, 400, 'INVALID_LIST_FILTER');
  }

  const parsedItems = rawItems.map((item) => Number.parseInt(item, 10));
  const hasInvalidItem = parsedItems.some((item) => !Number.isInteger(item) || item <= 0);
  if (hasInvalidItem) {
    throw new AppError(`${fieldName} invalide`, 400, 'INVALID_LIST_FILTER');
  }

  return [...new Set(parsedItems)];
};

const parseOptionalStringList = (value, fieldName) => {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const normalizedItems = String(value)
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter((item) => item.length > 0);

  if (normalizedItems.length === 0) {
    throw new AppError(`${fieldName} invalide`, 400, 'INVALID_LIST_FILTER');
  }

  return [...new Set(normalizedItems)];
};

const resolveOwnerUserId = (req, providedUserId) => {
  const role = req.user?.role;
  const currentUserId = Number(req.user?.id);

  if (!Number.isFinite(currentUserId) || currentUserId <= 0) {
    throw new AppError('Utilisateur authentifie invalide', 401, 'INVALID_AUTH_USER');
  }

  if (role === 'admin') {
    if (providedUserId === undefined || providedUserId === null || providedUserId === '') {
      return null;
    }

    const parsed = Number.parseInt(providedUserId, 10);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      throw new AppError('user_id invalide', 400, 'INVALID_USER_ID');
    }

    return parsed;
  }

  if (role === 'garage') {
    if (providedUserId !== undefined && Number.parseInt(providedUserId, 10) !== currentUserId) {
      throw new AppError('Un garage ne peut creer que son propre profil', 403, 'FORBIDDEN_OWNER_ASSIGNMENT');
    }

    return currentUserId;
  }

  throw new AppError('Acces refuse : role non autorise', 403, 'FORBIDDEN_ROLE');
};

const ensureGarageUserRole = async (userId) => {
  if (userId === null) {
    return;
  }

  const result = await pool.query(
    `SELECT r.name AS role
     FROM users u
     JOIN roles r ON r.id = u.role_id
     WHERE u.id = $1`,
    [userId]
  );

  if (result.rows.length === 0) {
    throw new AppError('Utilisateur proprietaire introuvable', 404, 'USER_NOT_FOUND');
  }

  if (result.rows[0].role !== 'garage') {
    throw new AppError('Le proprietaire doit avoir le role garage', 400, 'INVALID_GARAGE_OWNER_ROLE');
  }
};

const ensureGarageOwnershipAllowed = (req, garage) => {
  const role = req.user?.role;
  const currentUserId = Number(req.user?.id);

  if (role === 'admin') {
    return;
  }

  if (role !== 'garage') {
    throw new AppError('Acces refuse : role non autorise', 403, 'FORBIDDEN_ROLE');
  }

  if (garage.user_id === null || Number(garage.user_id) !== currentUserId) {
    throw new AppError('Acces refuse : ce garage ne vous appartient pas', 403, 'FORBIDDEN_GARAGE_ACCESS');
  }
};

const createGarage = asyncHandler(async (req, res) => {
  const ownerUserId = resolveOwnerUserId(req, req.body?.user_id);
  const garageName = normalizeOptionalString(req.body?.name);

  if (!garageName) {
    throw new AppError('Le nom du garage est obligatoire', 400, 'VALIDATION_ERROR');
  }

  await ensureGarageUserRole(ownerUserId);

  if (ownerUserId !== null) {
    const existingForOwner = await pool.query(
      'SELECT id FROM garages WHERE user_id = $1 LIMIT 1',
      [ownerUserId]
    );

    if (existingForOwner.rows.length > 0) {
      throw new AppError('Ce compte garage possede deja un profil garage', 409, 'GARAGE_ALREADY_EXISTS_FOR_USER');
    }
  }

  const insertResult = await pool.query(
    `INSERT INTO garages (user_id, name, adresse, telephone, email, latitude, longitude, rating, is_open, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, COALESCE($9, true), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
     RETURNING id, user_id, name, adresse, telephone, email, latitude, longitude, rating, is_open, created_at, updated_at`,
    [
      ownerUserId,
      garageName,
      normalizeOptionalString(req.body?.adresse),
      normalizeOptionalString(req.body?.telephone),
      normalizeOptionalString(req.body?.email),
      parseNullableNumber(req.body?.latitude, 'latitude'),
      parseNullableNumber(req.body?.longitude, 'longitude'),
      req.body?.rating === undefined || req.body?.rating === null || req.body?.rating === ''
        ? 3.5
        : parseNullableNumber(req.body?.rating, 'rating'),
      req.body?.is_open
    ]
  );

  return sendApiResponse(res, {
    statusCode: 201,
    message: 'Garage cree avec succes',
    data: mapGarageRow(insertResult.rows[0])
  });
});

const listGarages = asyncHandler(async (req, res) => {
  // Pagination standard (utilisee aussi apres filtrage geo).
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 10));
  const offset = (page - 1) * limit;
  const search = normalizeOptionalString(req.query.search);
  const includeClosed = ['true', '1', 'yes', 'on'].includes(String(req.query.includeClosed || '').toLowerCase());
  const includeInactiveServices = ['true', '1', 'yes', 'on'].includes(String(req.query.includeInactiveServices || '').toLowerCase());
  const minRating = parseNullableNumber(req.query.minRating, 'minRating');
  const maxRating = parseNullableNumber(req.query.maxRating, 'maxRating');
  const serviceIds = parseOptionalIntegerList(req.query.serviceIds, 'serviceIds');
  const serviceNames = parseOptionalStringList(req.query.services, 'services');
  const serviceMatch = String(req.query.serviceMatch || 'any').toLowerCase() === 'all' ? 'all' : 'any';

  // Parametres geographiques pour activer la distance Haversine.
  const userLat = parseOptionalCoordinate(req.query.userLat, 'userLat');
  const userLon = parseOptionalCoordinate(req.query.userLon, 'userLon');
  const radiusKm = parseOptionalPositiveNumber(req.query.radiusKm, 'radiusKm');
  const sortBy = String(req.query.sortBy || '').toLowerCase();
  const sortOrder = String(req.query.sortOrder || 'asc').toLowerCase() === 'desc' ? 'desc' : 'asc';

  // On impose une paire complete: latitude + longitude.
  if ((userLat === null) !== (userLon === null)) {
    throw new AppError('userLat et userLon doivent etre fournis ensemble', 400, 'MISSING_COORDINATE_PAIR');
  }

  const useDistance = userLat !== null && userLon !== null;

  // Tri distance ou rayon impossible sans position utilisateur.
  if ((sortBy === 'distance' || radiusKm !== null) && !useDistance) {
    throw new AppError('userLat et userLon sont obligatoires pour distance/radiusKm', 400, 'COORDINATES_REQUIRED');
  }

  if (minRating !== null && (minRating < 0 || minRating > 5)) {
    throw new AppError('minRating doit etre compris entre 0 et 5', 400, 'INVALID_RATING_FILTER');
  }

  if (maxRating !== null && (maxRating < 0 || maxRating > 5)) {
    throw new AppError('maxRating doit etre compris entre 0 et 5', 400, 'INVALID_RATING_FILTER');
  }

  if (minRating !== null && maxRating !== null && minRating > maxRating) {
    throw new AppError('minRating doit etre inferieur ou egal a maxRating', 400, 'INVALID_RATING_RANGE');
  }

  const whereClauses = [];
  const params = [];

  if (!includeClosed) {
    whereClauses.push('g.is_open = true');
  }

  if (search) {
    params.push(`%${search}%`);
    const p = `$${params.length}`;
    whereClauses.push(`(g.name ILIKE ${p} OR g.adresse ILIKE ${p} OR g.email ILIKE ${p})`);
  }

  if (minRating !== null) {
    params.push(minRating);
    whereClauses.push(`g.rating >= $${params.length}`);
  }

  if (maxRating !== null) {
    params.push(maxRating);
    whereClauses.push(`g.rating <= $${params.length}`);
  }

  const serviceActiveClause = includeInactiveServices ? '' : 'AND gs.is_active = true';

  if (serviceIds && serviceIds.length > 0) {
    params.push(serviceIds);
    const idsParam = `$${params.length}`;

    if (serviceMatch === 'all') {
      params.push(serviceIds.length);
      const countParam = `$${params.length}`;
      whereClauses.push(
        `(SELECT COUNT(DISTINCT gs.id)
          FROM garage_services gs
          WHERE gs.garage_id = g.id
            ${serviceActiveClause}
            AND gs.id = ANY(${idsParam}::bigint[])) = ${countParam}`
      );
    } else {
      whereClauses.push(
        `EXISTS (
          SELECT 1
          FROM garage_services gs
          WHERE gs.garage_id = g.id
            ${serviceActiveClause}
            AND gs.id = ANY(${idsParam}::bigint[])
        )`
      );
    }
  }

  if (serviceNames && serviceNames.length > 0) {
    params.push(serviceNames);
    const namesParam = `$${params.length}`;

    if (serviceMatch === 'all') {
      params.push(serviceNames.length);
      const countParam = `$${params.length}`;
      whereClauses.push(
        `(SELECT COUNT(DISTINCT LOWER(gs.name))
          FROM garage_services gs
          WHERE gs.garage_id = g.id
            ${serviceActiveClause}
            AND LOWER(gs.name) = ANY(${namesParam}::text[])) = ${countParam}`
      );
    } else {
      whereClauses.push(
        `EXISTS (
          SELECT 1
          FROM garage_services gs
          WHERE gs.garage_id = g.id
            ${serviceActiveClause}
            AND LOWER(gs.name) = ANY(${namesParam}::text[])
        )`
      );
    }
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  // Si geo activee: on charge d abord le jeu complet, puis on applique
  // calcul distance/filtrage/tri en memoire avant la pagination finale.
  // Sinon: pagination SQL classique pour performance.
  const needsGeoPostProcessing = useDistance || radiusKm !== null || sortBy === 'distance';

  let rows = [];
  if (needsGeoPostProcessing) {
    const result = await pool.query(
      `SELECT g.id, g.user_id, g.name, g.adresse, g.telephone, g.email, g.latitude, g.longitude, g.rating, g.is_open, g.created_at, g.updated_at
       FROM garages g
       ${whereSql}
       ORDER BY g.created_at DESC`,
      params
    );

    rows = result.rows;
  } else {
    params.push(limit);
    params.push(offset);

    const result = await pool.query(
      `SELECT g.id, g.user_id, g.name, g.adresse, g.telephone, g.email, g.latitude, g.longitude, g.rating, g.is_open, g.created_at, g.updated_at,
              COUNT(*) OVER() AS total_count
       FROM garages g
       ${whereSql}
       ORDER BY g.created_at DESC
       LIMIT $${params.length - 1}
       OFFSET $${params.length}`,
      params
    );

    rows = result.rows;
  }

  const mappedItems = rows.map((row) => {
    const mapped = mapGarageRow(row);

    // Pas de distance si coords utilisateur absentes ou coords garage manquantes.
    if (!useDistance || mapped.latitude === null || mapped.longitude === null) {
      return {
        ...mapped,
        distance_km: null
      };
    }

    // Distance (km) via formule Haversine.
    return {
      ...mapped,
      distance_km: haversine(userLat, userLon, mapped.latitude, mapped.longitude)
    };
  });

  let filteredItems = mappedItems;
  // Filtre de proximite uniquement si radiusKm est fourni.
  if (radiusKm !== null) {
    filteredItems = mappedItems.filter((item) => item.distance_km !== null && item.distance_km <= radiusKm);
  }

  // Tri geographique avec fallback (distance null a la fin).
  if (sortBy === 'distance' && useDistance) {
    filteredItems = filteredItems.sort((a, b) => {
      if (a.distance_km === null && b.distance_km === null) {
        return 0;
      }

      if (a.distance_km === null) {
        return 1;
      }

      if (b.distance_km === null) {
        return -1;
      }

      return sortOrder === 'desc'
        ? b.distance_km - a.distance_km
        : a.distance_km - b.distance_km;
    });
  }

  const totalItems = needsGeoPostProcessing
    ? filteredItems.length
    : (rows.length > 0 ? Number(rows[0].total_count) : 0);

  // Pagination appliquee apres traitements geo pour un resultat coherent.
  const paginatedItems = needsGeoPostProcessing
    ? filteredItems.slice(offset, offset + limit)
    : filteredItems;

  return sendApiResponse(res, {
    message: 'Liste des garages recuperee avec succes',
    data: {
      items: paginatedItems,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages: totalItems === 0 ? 0 : Math.ceil(totalItems / limit)
      },
      filters: {
        userLat,
        userLon,
        radiusKm,
        minRating,
        maxRating,
        serviceIds,
        services: serviceNames,
        serviceMatch,
        includeInactiveServices,
        sortBy: sortBy || null,
        sortOrder: sortBy === 'distance' ? sortOrder : null
      }
    }
  });
});

const getGarageById = asyncHandler(async (req, res) => {
  const garageId = Number.parseInt(req.params.id, 10);
  if (!Number.isInteger(garageId) || garageId <= 0) {
    throw new AppError('Identifiant garage invalide', 400, 'INVALID_GARAGE_ID');
  }

  const result = await pool.query(
    `SELECT id, user_id, name, adresse, telephone, email, latitude, longitude, rating, is_open, created_at, updated_at
     FROM garages
     WHERE id = $1`,
    [garageId]
  );

  if (result.rows.length === 0) {
    throw new AppError('Garage non trouve', 404, 'GARAGE_NOT_FOUND');
  }

  return sendApiResponse(res, {
    message: 'Garage recupere avec succes',
    data: mapGarageRow(result.rows[0])
  });
});

const getMyGarage = asyncHandler(async (req, res) => {
  const currentUserId = Number(req.user?.id);

  if (!Number.isFinite(currentUserId) || currentUserId <= 0) {
    throw new AppError('Utilisateur authentifie invalide', 401, 'INVALID_AUTH_USER');
  }

  const result = await pool.query(
    `SELECT id, user_id, name, adresse, telephone, email, latitude, longitude, rating, is_open, created_at, updated_at
     FROM garages
     WHERE user_id = $1`,
    [currentUserId]
  );

  if (result.rows.length === 0) {
    throw new AppError('Profil garage introuvable pour cet utilisateur', 404, 'GARAGE_PROFILE_NOT_FOUND');
  }

  return sendApiResponse(res, {
    message: 'Profil garage recupere avec succes',
    data: mapGarageRow(result.rows[0])
  });
});

const updateGarage = asyncHandler(async (req, res) => {
  const garageId = Number.parseInt(req.params.id, 10);
  if (!Number.isInteger(garageId) || garageId <= 0) {
    throw new AppError('Identifiant garage invalide', 400, 'INVALID_GARAGE_ID');
  }

  const existingGarageResult = await pool.query(
    `SELECT id, user_id, name, adresse, telephone, email, latitude, longitude, rating, is_open, created_at, updated_at
     FROM garages
     WHERE id = $1`,
    [garageId]
  );

  if (existingGarageResult.rows.length === 0) {
    throw new AppError('Garage non trouve', 404, 'GARAGE_NOT_FOUND');
  }

  const existingGarage = existingGarageResult.rows[0];
  ensureGarageOwnershipAllowed(req, existingGarage);

  const hasAnyField = [
    'name',
    'adresse',
    'telephone',
    'email',
    'latitude',
    'longitude',
    'rating',
    'is_open'
  ].some((field) => req.body?.[field] !== undefined);

  if (!hasAnyField) {
    throw new AppError('Au moins un champ doit etre fourni', 400, 'EMPTY_UPDATE_PAYLOAD');
  }

  const updatedResult = await pool.query(
    `UPDATE garages
     SET name = COALESCE($1, name),
         adresse = COALESCE($2, adresse),
         telephone = COALESCE($3, telephone),
         email = COALESCE($4, email),
         latitude = COALESCE($5, latitude),
         longitude = COALESCE($6, longitude),
         rating = COALESCE($7, rating),
         is_open = COALESCE($8, is_open),
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $9
     RETURNING id, user_id, name, adresse, telephone, email, latitude, longitude, rating, is_open, created_at, updated_at`,
    [
      req.body?.name !== undefined ? normalizeOptionalString(req.body.name) : null,
      req.body?.adresse !== undefined ? normalizeOptionalString(req.body.adresse) : null,
      req.body?.telephone !== undefined ? normalizeOptionalString(req.body.telephone) : null,
      req.body?.email !== undefined ? normalizeOptionalString(req.body.email) : null,
      req.body?.latitude !== undefined ? parseNullableNumber(req.body.latitude, 'latitude') : null,
      req.body?.longitude !== undefined ? parseNullableNumber(req.body.longitude, 'longitude') : null,
      req.body?.rating !== undefined ? parseNullableNumber(req.body.rating, 'rating') : null,
      req.body?.is_open !== undefined ? Boolean(req.body.is_open) : null,
      garageId
    ]
  );

  return sendApiResponse(res, {
    message: 'Garage mis a jour avec succes',
    data: mapGarageRow(updatedResult.rows[0])
  });
});

const deleteGarage = asyncHandler(async (req, res) => {
  const garageId = Number.parseInt(req.params.id, 10);
  if (!Number.isInteger(garageId) || garageId <= 0) {
    throw new AppError('Identifiant garage invalide', 400, 'INVALID_GARAGE_ID');
  }

  const existingGarageResult = await pool.query(
    `SELECT id, user_id
     FROM garages
     WHERE id = $1`,
    [garageId]
  );

  if (existingGarageResult.rows.length === 0) {
    throw new AppError('Garage non trouve', 404, 'GARAGE_NOT_FOUND');
  }

  ensureGarageOwnershipAllowed(req, existingGarageResult.rows[0]);

  await pool.query('DELETE FROM garages WHERE id = $1', [garageId]);

  return sendApiResponse(res, {
    message: 'Garage supprime avec succes',
    data: null
  });
});

module.exports = {
  createGarage,
  listGarages,
  getGarageById,
  getMyGarage,
  updateGarage,
  deleteGarage
};
