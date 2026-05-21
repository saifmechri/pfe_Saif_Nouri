const { pool } = require('../db');
const { AppError } = require('../utils/appError');

const ALLOWED_SORT_FIELDS = new Set(['nom', 'reference', 'prix_unitaire', 'created_at', 'updated_at']);
const ALLOWED_SORT_ORDERS = new Set(['asc', 'desc']);
const STOCK_MOVEMENT_TYPES = new Set(['IN', 'OUT', 'ADJUSTMENT', 'SET']);

const normalizeText = (value) => {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const parsePositiveNumber = (value, fieldName) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new AppError(`${fieldName} doit être supérieur à 0`, 400, 'INVALID_PRICE');
  }

  return parsed;
};

const parseNonNegativeInteger = (value, fieldName) => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new AppError(`${fieldName} doit être un entier positif ou nul`, 400, 'INVALID_STOCK');
  }

  return parsed;
};

const buildSearchClause = (search) => {
  const normalizedSearch = normalizeText(search);
  if (!normalizedSearch) {
    return { sql: '', params: [] };
  }

  const searchParam = `%${normalizedSearch.replace(/%/g, '\\%').replace(/_/g, '\\_')}%`;
  return {
    sql: ' AND (nom ILIKE $1 OR reference ILIKE $1)',
    params: [searchParam]
  };
};

const buildSortClause = (sortBy, sortOrder) => {
  const normalizedSortBy = ALLOWED_SORT_FIELDS.has(sortBy) ? sortBy : 'created_at';
  const normalizedSortOrder = ALLOWED_SORT_ORDERS.has(String(sortOrder).toLowerCase()) ? String(sortOrder).toUpperCase() : 'DESC';

  // always qualify with pieces table alias to avoid ambiguous column references when joining users/roles
  return `p.${normalizedSortBy} ${normalizedSortOrder}`;
};

const mapPieceRow = (row) => ({
  id: row.id,
  user_id: row.user_id === null || row.user_id === undefined ? null : Number(row.user_id),
  nom: row.nom,
  reference: row.reference,
  description: row.description,
  photo_url: row.photo_url || null,
  prix_unitaire: Number(row.prix_unitaire),
  stock: Number(row.stock),
  condition: row.condition || "Neuf",
  zone_geographique: row.zone_geographique || null,
  marque: row.marque || null,
  modele: row.modele || null,
  categorie: row.categorie || null,
  is_validated: row.is_validated === null || row.is_validated === undefined ? false : Boolean(row.is_validated),
  created_at: row.created_at,
  updated_at: row.updated_at,
  deleted_at: row.deleted_at || null,
  seller_name: row.seller_name || null,
  seller_phone: row.seller_phone || null,
  seller_email: row.seller_email || null,
  seller_store_name: row.seller_store_name || null,
  seller_store_address: row.seller_store_address || null,
  seller_role: row.seller_role || null
});

const getSellerDisplayName = (row) => {
  const sellerRole = String(row.seller_role || '').toLowerCase();
  if (sellerRole === 'admin') {
    return 'admin';
  }

  return row.seller_name || null;
};

const mapStockMovementRow = (row) => ({
  id: row.id,
  piece_id: Number(row.piece_id),
  user_id: row.user_id === null ? null : Number(row.user_id),
  movement_type: row.movement_type,
  quantity_change: Number(row.quantity_change),
  stock_before: Number(row.stock_before),
  stock_after: Number(row.stock_after),
  reason: row.reason,
  created_at: row.created_at
});

const normalizeStockMovementType = (value) => {
  if (typeof value !== 'string') {
    throw new AppError('movement_type est obligatoire', 400, 'INVALID_MOVEMENT_TYPE');
  }

  const normalized = value.trim().toUpperCase();
  if (!STOCK_MOVEMENT_TYPES.has(normalized)) {
    throw new AppError('movement_type invalide', 400, 'INVALID_MOVEMENT_TYPE');
  }

  return normalized;
};

const runInTransaction = async (executor) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await executor(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const getPieceForUpdate = async (client, pieceId) => {
  const result = await client.query(
    `SELECT id, user_id, stock
     FROM pieces
     WHERE id = $1 AND deleted_at IS NULL
     FOR UPDATE`,
    [pieceId]
  );

  if (result.rows.length === 0) {
    throw new AppError('Piece non trouvee', 404, 'PIECE_NOT_FOUND');
  }

  return result.rows[0];
};

const getManagedPieceById = async (pieceId) => {
  const result = await pool.query(
    `SELECT id, user_id
     FROM pieces
     WHERE id = $1 AND deleted_at IS NULL`,
    [pieceId]
  );

  if (result.rows.length === 0) {
    throw new AppError('Piece non trouvee', 404, 'PIECE_NOT_FOUND');
  }

  return result.rows[0];
};

const canManagePiece = (pieceRow, actorUser = null) => {
  if (!pieceRow) {
    return false;
  }

  if (String(actorUser?.role || '').toLowerCase() === 'admin') {
    return true;
  }

  const actorId = Number.parseInt(actorUser?.id, 10);
  const ownerId = pieceRow.user_id === null || pieceRow.user_id === undefined ? null : Number.parseInt(pieceRow.user_id, 10);
  return Number.isInteger(actorId) && actorId > 0 && ownerId !== null && ownerId === actorId;
};

const assertCanManagePiece = (pieceRow, actorUser = null) => {
  if (!canManagePiece(pieceRow, actorUser)) {
    throw new AppError('Acces refuse : piece appartenant a un autre vendeur', 403, 'FORBIDDEN_PIECE_OWNER');
  }
};

const createStockMovement = async (client, payload) => {
  const movementResult = await client.query(
    `INSERT INTO piece_stock_movements (
       piece_id,
       user_id,
       movement_type,
       quantity_change,
       stock_before,
       stock_after,
       reason
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, piece_id, user_id, movement_type, quantity_change, stock_before, stock_after, reason, created_at`,
    [
      payload.pieceId,
      payload.userId || null,
      payload.movementType,
      payload.quantityChange,
      payload.stockBefore,
      payload.stockAfter,
      payload.reason || null
    ]
  );

  return mapStockMovementRow(movementResult.rows[0]);
};

const buildPieceSearchClause = (name) => {
  const normalizedName = normalizeText(name);
  if (!normalizedName) {
    return { sql: '', params: [] };
  }

  const searchTerm = `%${normalizedName.replace(/%/g, '\\%').replace(/_/g, '\\_')}%`;
  return {
    sql: ' AND (p.nom ILIKE $1 OR p.reference ILIKE $1)',
    params: [searchTerm]
  };
};

const comparePieceAcrossVendors = async ({ pieceId = null, name = '', includeOutOfStock = false } = {}) => {
  const normalizedName = normalizeText(name);
  const clauses = ['p.deleted_at IS NULL', 'COALESCE(p.is_validated, false) = true'];
  const params = [];

  if (pieceId !== null && pieceId !== undefined && pieceId !== '') {
    const parsedPieceId = Number(pieceId);
    if (!Number.isInteger(parsedPieceId) || parsedPieceId <= 0) {
      throw new AppError('Identifiant de piece invalide', 400, 'INVALID_PIECE_ID');
    }

    params.push(parsedPieceId);
    clauses.push(`p.id = $${params.length}`);
  }

  if (normalizedName) {
    params.push(`%${normalizedName.replace(/%/g, '\\%').replace(/_/g, '\\_')}%`);
    clauses.push(`(p.nom ILIKE $${params.length} OR p.reference ILIKE $${params.length})`);
  }

  if (!pieceId && !normalizedName) {
    throw new AppError('Nom ou reference de piece requis', 400, 'INVALID_PIECE_SEARCH');
  }

  if (!includeOutOfStock) {
    clauses.push('COALESCE(p.stock, 0) > 0');
  }

  const result = await pool.query(
    `SELECT
      p.id,
      p.user_id,
      p.nom,
      p.reference,
      p.description,
      p.photo_url,
      p.prix_unitaire,
      p.stock,
      p.condition,
      p.zone_geographique,
      p.marque,
      p.modele,
      p.categorie,
      p.is_validated,
      p.created_at,
      p.updated_at,
      u.name AS seller_name,
      u.phone AS seller_phone,
      u.email AS seller_email,
      u.store_name AS seller_store_name,
      u.store_address AS seller_store_address
     FROM pieces p
     LEFT JOIN users u ON u.id = p.user_id
     WHERE ${clauses.join(' AND ')}
     ORDER BY p.prix_unitaire ASC, p.created_at DESC, p.id DESC`,
    params
  );

  const offers = result.rows.map((row) => ({
    id: Number(row.id),
    user_id: row.user_id === null || row.user_id === undefined ? null : Number(row.user_id),
    nom: row.nom,
    reference: row.reference,
    description: row.description,
    photo_url: row.photo_url || null,
    prix_unitaire: Number(row.prix_unitaire),
    stock: Number(row.stock),
    condition: row.condition || 'Neuf',
    zone_geographique: row.zone_geographique || null,
    marque: row.marque || null,
    modele: row.modele || null,
    categorie: row.categorie || null,
    is_validated: row.is_validated === null || row.is_validated === undefined ? false : Boolean(row.is_validated),
    created_at: row.created_at,
    updated_at: row.updated_at,
    vendeur: {
      id: row.user_id === null || row.user_id === undefined ? null : Number(row.user_id),
      nom: row.seller_name || null,
      telephone: row.seller_phone || null,
      email: row.seller_email || null,
      magasin: row.seller_store_name || null,
      adresse: row.seller_store_address || null
    },
    seller_name: row.seller_name || null,
    seller_phone: row.seller_phone || null,
    seller_email: row.seller_email || null,
    seller_store_name: row.seller_store_name || null,
    seller_store_address: row.seller_store_address || null
  }));

  const prices = offers.map((offer) => Number(offer.prix_unitaire));
  const stockValues = offers.map((offer) => Number(offer.stock));
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
  const bestOffer = offers[0] || null;

  return {
    piece: bestOffer,
    best_offer: bestOffer,
    offres: offers,
    offers,
    summary: {
      vendeurs_count: offers.length,
      prix_min: minPrice,
      prix_max: maxPrice,
      economie_max: maxPrice > 0 ? maxPrice - minPrice : 0,
      stock_total: stockValues.reduce((acc, value) => acc + value, 0)
    }
  };
};

const getPieceSellerLocations = async ({ name = '', pieceId = null } = {}) => {
  const normalizedName = normalizeText(name);
  const clauses = ['p.deleted_at IS NULL', 'COALESCE(p.is_validated, false) = true'];
  const params = [];

  if (pieceId !== null && pieceId !== undefined && pieceId !== '') {
    const parsedPieceId = Number(pieceId);
    if (!Number.isInteger(parsedPieceId) || parsedPieceId <= 0) {
      throw new AppError('Identifiant de piece invalide', 400, 'INVALID_PIECE_ID');
    }

    params.push(parsedPieceId);
    clauses.push(`p.id = $${params.length}`);
  }

  if (normalizedName) {
    params.push(`%${normalizedName.replace(/%/g, '\\%').replace(/_/g, '\\_')}%`);
    clauses.push(`(p.nom ILIKE $${params.length} OR p.reference ILIKE $${params.length})`);
  }

  const result = await pool.query(
    `SELECT
       u.id AS seller_id,
       u.name AS seller_name,
       u.email AS seller_email,
       u.phone AS seller_phone,
       u.store_name AS seller_store_name,
       u.store_address AS seller_store_address,
       p.zone_geographique,
       COUNT(p.id)::int AS pieces_count
     FROM pieces p
     LEFT JOIN users u ON u.id = p.user_id
     WHERE ${clauses.join(' AND ')}
     GROUP BY u.id, u.name, u.email, u.phone, u.store_name, u.store_address, p.zone_geographique
     ORDER BY pieces_count DESC, u.store_name ASC NULLS LAST, u.name ASC NULLS LAST`,
    params
  );

  return {
    items: result.rows.map((row) => ({
      seller_id: row.seller_id === null || row.seller_id === undefined ? null : Number(row.seller_id),
      seller_name: row.seller_name || null,
      seller_email: row.seller_email || null,
      seller_phone: row.seller_phone || null,
      seller_store_name: row.seller_store_name || null,
      seller_store_address: row.seller_store_address || null,
      zone_geographique: row.zone_geographique || null,
      pieces_count: Number(row.pieces_count || 0)
    }))
  };
};

const createPiece = async (payload) => {
  const userId = payload.user_id ? Number.parseInt(payload.user_id, 10) : null;
  const nom = normalizeText(payload.nom);
  const reference = normalizeText(payload.reference);
  const description = normalizeText(payload.description);
  const photoUrl = normalizeText(payload.photo_url);
  const condition = normalizeText(payload.condition) || "Neuf";
  const zone_geographique = normalizeText(payload.zone_geographique);
  const marque = normalizeText(payload.marque);
  const modele = normalizeText(payload.modele);
  const categorie = normalizeText(payload.categorie);
  const prix_unitaire = parsePositiveNumber(payload.prix_unitaire, 'prix_unitaire');
  const stock = payload.stock === undefined || payload.stock === null || payload.stock === ''
    ? 0
    : parseNonNegativeInteger(payload.stock, 'stock');
  const isValidated = Boolean(payload.is_validated);

  if (!nom) {
    throw new AppError('Le nom est obligatoire', 400, 'INVALID_NAME');
  }

  if (!reference) {
    throw new AppError('La reference est obligatoire', 400, 'INVALID_REFERENCE');
  }

  try {
    const result = await pool.query(
      `INSERT INTO pieces (user_id, nom, reference, description, photo_url, prix_unitaire, stock, condition, zone_geographique, marque, modele, categorie, is_validated)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING id, user_id, nom, reference, description, photo_url, prix_unitaire, stock, condition, zone_geographique, marque, modele, categorie, is_validated, created_at, updated_at, deleted_at`,
      [userId, nom, reference, description, photoUrl, prix_unitaire, stock, condition, zone_geographique, marque, modele, categorie, isValidated]
    );

    return mapPieceRow(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      throw new AppError('Cette reference de piece existe deja', 400, 'PIECE_REFERENCE_ALREADY_EXISTS');
    }

    throw error;
  }
};

const getPieces = async ({ page = 1, limit = 10, search = '', sortBy = 'created_at', sortOrder = 'desc' } = {}) => {
  const safePage = Math.max(Number.parseInt(page, 10) || 1, 1);
  const safeLimit = Math.min(Math.max(Number.parseInt(limit, 10) || 10, 1), 100);
  const offset = (safePage - 1) * safeLimit;
  const searchClause = buildSearchClause(search);
  const orderByClause = buildSortClause(sortBy, sortOrder);

  const query = `
    SELECT
      p.id,
      p.user_id,
      p.nom,
      p.reference,
      p.description,
      p.photo_url,
      p.prix_unitaire,
      p.stock,
      p.condition,
      p.zone_geographique,
      p.marque,
      p.modele,
      p.categorie,
      p.created_at,
      p.updated_at,
      p.deleted_at,
      u.name AS seller_name,
      u.phone AS seller_phone,
      u.email AS seller_email,
      u.store_name AS seller_store_name,
      u.store_address AS seller_store_address,
      LOWER(r.name) AS seller_role,
      COUNT(*) OVER() AS total_count
    FROM pieces p
    LEFT JOIN users u ON u.id = p.user_id
    LEFT JOIN roles r ON r.id = u.role_id
    WHERE p.deleted_at IS NULL${searchClause.sql}
    ORDER BY ${orderByClause}
    LIMIT $${searchClause.params.length + 1}
    OFFSET $${searchClause.params.length + 2}
  `;

  const params = [...searchClause.params, safeLimit, offset];
  let result;
  try {
    result = await pool.query(query, params);
  } catch (err) {
    // Retry once for transient connection timeout / termination errors
    const msg = String(err && err.message || '').toLowerCase();
    if (msg.includes('connection timeout') || msg.includes('terminated') || msg.includes('timeout')) {
      try {
        await new Promise((r) => setTimeout(r, 200));
        result = await pool.query(query, params);
      } catch (retryErr) {
        console.error('getPieces retry failed', retryErr);
        throw retryErr;
      }
    } else {
      throw err;
    }
  }
  const totalItems = result.rows.length > 0 ? Number(result.rows[0].total_count) : 0;

  return {
    items: result.rows.map((row) => {
      const mappedRow = mapPieceRow(row);
      return {
        ...mappedRow,
        seller_name: getSellerDisplayName(row)
      };
    }),
    pagination: {
      page: safePage,
      limit: safeLimit,
      totalItems,
      totalPages: totalItems === 0 ? 0 : Math.ceil(totalItems / safeLimit)
    }
  };
};

const getMyPieces = async ({ userId, page = 1, limit = 10, search = '', sortBy = 'created_at', sortOrder = 'desc' } = {}) => {
  const parsedUserId = Number.parseInt(userId, 10);
  if (!Number.isInteger(parsedUserId) || parsedUserId <= 0) {
    return getPieces({ page, limit, search, sortBy, sortOrder });
  }

  const safePage = Math.max(Number.parseInt(page, 10) || 1, 1);
  const safeLimit = Math.min(Math.max(Number.parseInt(limit, 10) || 10, 1), 100);
  const offset = (safePage - 1) * safeLimit;
  const orderByClause = buildSortClause(sortBy, sortOrder);
  const normalizedSearch = normalizeText(search);
  const searchSql = normalizedSearch ? ' AND (p.nom ILIKE $2 OR p.reference ILIKE $2)' : '';
  const limitIndex = normalizedSearch ? 3 : 2;
  const offsetIndex = normalizedSearch ? 4 : 3;
  const searchParam = normalizedSearch ? [`%${normalizedSearch.replace(/%/g, '\\%').replace(/_/g, '\\_')}%`] : [];

  const query = `
    SELECT
      p.id,
      p.user_id,
      p.nom,
      p.reference,
      p.description,
      p.photo_url,
      p.prix_unitaire,
      p.stock,
      p.condition,
      p.zone_geographique,
      p.marque,
      p.modele,
      p.categorie,
      p.created_at,
      p.updated_at,
      p.deleted_at,
      u.name AS seller_name,
      u.phone AS seller_phone,
      u.email AS seller_email,
      u.store_name AS seller_store_name,
      u.store_address AS seller_store_address,
      LOWER(r.name) AS seller_role,
      COUNT(*) OVER() AS total_count
    FROM pieces p
    LEFT JOIN users u ON u.id = p.user_id
    LEFT JOIN roles r ON r.id = u.role_id
    WHERE p.deleted_at IS NULL
      AND p.user_id = $1${searchSql}
    ORDER BY ${orderByClause}
    LIMIT $${limitIndex}
    OFFSET $${offsetIndex}
  `;

  const params = [parsedUserId, ...searchParam, safeLimit, offset];
  const result = await pool.query(query, params);
  const totalItems = result.rows.length > 0 ? Number(result.rows[0].total_count) : 0;

  return {
    items: result.rows.map((row) => {
      const mappedRow = mapPieceRow(row);
      return {
        ...mappedRow,
        seller_name: getSellerDisplayName(row)
      };
    }),
    pagination: {
      page: safePage,
      limit: safeLimit,
      totalItems,
      totalPages: totalItems === 0 ? 0 : Math.ceil(totalItems / safeLimit)
    }
  };
};

const getPieceById = async (id) => {
  const result = await pool.query(
    `SELECT p.id, p.user_id, p.nom, p.reference, p.description, p.photo_url, p.prix_unitaire, p.stock, p.condition, p.zone_geographique, p.marque, p.modele, p.categorie, p.created_at, p.updated_at, p.deleted_at,
            u.name AS seller_name,
            u.phone AS seller_phone,
            u.email AS seller_email,
            u.store_name AS seller_store_name,
            u.store_address AS seller_store_address,
            LOWER(r.name) AS seller_role
     FROM pieces p
     LEFT JOIN users u ON u.id = p.user_id
     LEFT JOIN roles r ON r.id = u.role_id
     WHERE p.id = $1 AND p.deleted_at IS NULL`,
    [id]
  );

  if (result.rows.length === 0) {
    throw new AppError('Piece non trouvee', 404, 'PIECE_NOT_FOUND');
  }

  return {
    ...mapPieceRow(result.rows[0]),
    seller_name: getSellerDisplayName(result.rows[0])
  };
};

const updatePiece = async (id, payload, actorUser = null) => {
  const currentPiece = await getManagedPieceById(id);
  assertCanManagePiece(currentPiece, actorUser);

  const currentDetails = await pool.query(
    `SELECT id, user_id, nom, reference, description, photo_url, prix_unitaire, stock, condition, zone_geographique, marque, modele, categorie, is_validated, deleted_at
     FROM pieces
     WHERE id = $1 AND deleted_at IS NULL`,
    [id]
  );

  const current = currentDetails.rows[0];
  const nextNom = normalizeText(payload.nom) || current.nom;
  const nextReference = normalizeText(payload.reference) || current.reference;
  const nextDescription = payload.description === undefined ? current.description : normalizeText(payload.description);
  const nextPhotoUrl = payload.photo_url === undefined ? current.photo_url : normalizeText(payload.photo_url);
  const nextCondition = payload.condition === undefined ? current.condition : (normalizeText(payload.condition) || "Neuf");
  const nextZoneGeographique = payload.zone_geographique === undefined ? current.zone_geographique : normalizeText(payload.zone_geographique);
    const nextMarque = payload.marque === undefined ? current.marque : normalizeText(payload.marque);
    const nextModele = payload.modele === undefined ? current.modele : normalizeText(payload.modele);
    const nextCategorie = payload.categorie === undefined ? current.categorie : normalizeText(payload.categorie);
  const nextPrice = payload.prix_unitaire === undefined || payload.prix_unitaire === null || payload.prix_unitaire === ''
    ? Number(current.prix_unitaire)
    : parsePositiveNumber(payload.prix_unitaire, 'prix_unitaire');
  const nextStock = payload.stock === undefined || payload.stock === null || payload.stock === ''
    ? Number(current.stock)
    : parseNonNegativeInteger(payload.stock, 'stock');

  try {
    const result = await pool.query(
      `UPDATE pieces
       SET nom = $1,
           reference = $2,
           description = $3,
           photo_url = $4,
           prix_unitaire = $5,
           stock = $6,
           condition = $7,
           zone_geographique = $8,
             marque = $9,
             modele = $10,
             categorie = $11,
           updated_at = NOW()
         WHERE id = $12 AND deleted_at IS NULL
         RETURNING id, user_id, nom, reference, description, photo_url, prix_unitaire, stock, condition, zone_geographique, marque, modele, categorie, is_validated, created_at, updated_at, deleted_at`,
        [nextNom, nextReference, nextDescription, nextPhotoUrl, nextPrice, nextStock, nextCondition, nextZoneGeographique, nextMarque, nextModele, nextCategorie, id]
    );

    return mapPieceRow(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      throw new AppError('Cette reference de piece existe deja', 400, 'PIECE_REFERENCE_ALREADY_EXISTS');
    }

    throw error;
  }
};

const deletePiece = async (id, actorUser = null) => {
  const currentPiece = await getManagedPieceById(id);
  assertCanManagePiece(currentPiece, actorUser);

  const result = await pool.query(
    `UPDATE pieces
     SET deleted_at = NOW(), updated_at = NOW()
     WHERE id = $1 AND deleted_at IS NULL
     RETURNING id`,
    [id]
  );

  if (result.rows.length === 0) {
    throw new AppError('Piece non trouvee', 404, 'PIECE_NOT_FOUND');
  }

  return true;
};

const adjustPieceStock = async (id, payload = {}, actorUser = null) => {
  const quantityChange = Number(payload.quantity_change);
  if (!Number.isInteger(quantityChange) || quantityChange === 0) {
    throw new AppError('quantity_change doit etre un entier non nul', 400, 'INVALID_QUANTITY_CHANGE');
  }

  const movementType = normalizeStockMovementType(payload.movement_type || 'ADJUSTMENT');
  if (movementType === 'IN' && quantityChange < 0) {
    throw new AppError('quantity_change doit etre positif pour un mouvement IN', 400, 'INVALID_QUANTITY_CHANGE');
  }

  if (movementType === 'OUT' && quantityChange > 0) {
    throw new AppError('quantity_change doit etre negatif pour un mouvement OUT', 400, 'INVALID_QUANTITY_CHANGE');
  }

  if (movementType === 'SET') {
    throw new AppError('Utilisez l endpoint de definition de stock pour movement_type SET', 400, 'INVALID_MOVEMENT_TYPE');
  }

  const reason = normalizeText(payload.reason);

  return runInTransaction(async (client) => {
    const piece = await getPieceForUpdate(client, id);
    assertCanManagePiece(piece, actorUser);
    const stockBefore = Number(piece.stock);
    const stockAfter = stockBefore + quantityChange;

    if (stockAfter < 0) {
      throw new AppError('Stock insuffisant pour cette operation', 400, 'INSUFFICIENT_STOCK');
    }

    const updateResult = await client.query(
      `UPDATE pieces
       SET stock = $1,
           updated_at = NOW()
       WHERE id = $2
         RETURNING id, user_id, nom, reference, description, photo_url, prix_unitaire, stock, condition, zone_geographique, marque, modele, categorie, is_validated, created_at, updated_at, deleted_at`,
      [stockAfter, id]
    );

    const movement = await createStockMovement(client, {
      pieceId: id,
      userId: Number.parseInt(actorUser?.id, 10) || null,
      movementType,
      quantityChange,
      stockBefore,
      stockAfter,
      reason
    });

    return {
      piece: mapPieceRow(updateResult.rows[0]),
      movement
    };
  });
};

const setPieceStock = async (id, payload = {}, actorUser = null) => {
  const nextStock = Number(payload.stock);
  if (!Number.isInteger(nextStock) || nextStock < 0) {
    throw new AppError('stock doit etre un entier positif ou nul', 400, 'INVALID_STOCK');
  }

  const reason = normalizeText(payload.reason);

  return runInTransaction(async (client) => {
    const piece = await getPieceForUpdate(client, id);
    assertCanManagePiece(piece, actorUser);
    const stockBefore = Number(piece.stock);
    const quantityChange = nextStock - stockBefore;

    if (quantityChange === 0) {
      throw new AppError('Aucun changement de stock detecte', 400, 'NO_STOCK_CHANGE');
    }

    const updateResult = await client.query(
      `UPDATE pieces
       SET stock = $1,
           updated_at = NOW()
       WHERE id = $2
         RETURNING id, user_id, nom, reference, description, photo_url, prix_unitaire, stock, condition, zone_geographique, marque, modele, categorie, is_validated, created_at, updated_at, deleted_at`,
      [nextStock, id]
    );

    const movement = await createStockMovement(client, {
      pieceId: id,
      userId: Number.parseInt(actorUser?.id, 10) || null,
      movementType: 'SET',
      quantityChange,
      stockBefore,
      stockAfter: nextStock,
      reason
    });

    return {
      piece: mapPieceRow(updateResult.rows[0]),
      movement
    };
  });
};

const getPieceStockMovements = async (id, { page = 1, limit = 20 } = {}, actorUser = null) => {
  const safePage = Math.max(Number.parseInt(page, 10) || 1, 1);
  const safeLimit = Math.min(Math.max(Number.parseInt(limit, 10) || 20, 1), 100);
  const offset = (safePage - 1) * safeLimit;

  const piece = await getManagedPieceById(id);
  assertCanManagePiece(piece, actorUser);

  const result = await pool.query(
    `SELECT
      id,
      piece_id,
      user_id,
      movement_type,
      quantity_change,
      stock_before,
      stock_after,
      reason,
      created_at,
      COUNT(*) OVER() AS total_count
     FROM piece_stock_movements
     WHERE piece_id = $1
     ORDER BY created_at DESC, id DESC
     LIMIT $2 OFFSET $3`,
    [id, safeLimit, offset]
  );

  const totalItems = result.rows.length > 0 ? Number(result.rows[0].total_count) : 0;

  return {
    items: result.rows.map(mapStockMovementRow),
    pagination: {
      page: safePage,
      limit: safeLimit,
      totalItems,
      totalPages: totalItems === 0 ? 0 : Math.ceil(totalItems / safeLimit)
    }
  };
};

module.exports = {
  createPiece,
  getPieces,
  getMyPieces,
  getPieceById,
  updatePiece,
  deletePiece,
  adjustPieceStock,
  setPieceStock,
  getPieceStockMovements,
  comparePieceAcrossVendors,
  getPieceSellerLocations
};

