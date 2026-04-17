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

const parsePositiveInteger = (value, fieldName) => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new AppError(`${fieldName} doit etre un entier superieur a 0`, 400, 'INVALID_INTEGER');
  }

  return parsed;
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
    sql: ' AND (p.nom ILIKE $1 OR p.reference ILIKE $1)',
    params: [searchParam]
  };
};

const buildSortClause = (sortBy, sortOrder) => {
  const normalizedSortBy = ALLOWED_SORT_FIELDS.has(sortBy) ? sortBy : 'created_at';
  const normalizedSortOrder = ALLOWED_SORT_ORDERS.has(String(sortOrder).toLowerCase()) ? String(sortOrder).toUpperCase() : 'DESC';

  const fieldMap = {
    nom: 'p.nom',
    reference: 'p.reference',
    prix_unitaire: 'p.prix_unitaire',
    created_at: 'p.created_at',
    updated_at: 'p.updated_at'
  };

  return `${fieldMap[normalizedSortBy] || 'p.created_at'} ${normalizedSortOrder}`;
};

const mapPieceRow = (row) => ({
  id: row.id,
  user_id: row.user_id === null || row.user_id === undefined ? null : Number(row.user_id),
  seller_name: row.seller_name || null,
  seller_store_name: row.seller_store_name || null,
  seller_phone: row.seller_phone || null,
  seller_role: row.seller_role || null,
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
  created_at: row.created_at,
  updated_at: row.updated_at,
  deleted_at: row.deleted_at || null
});

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
    `SELECT id, stock
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

  if (!nom) {
    throw new AppError('Le nom est obligatoire', 400, 'INVALID_NAME');
  }

  if (!reference) {
    throw new AppError('La reference est obligatoire', 400, 'INVALID_REFERENCE');
  }

  try {
    const result = await pool.query(
      `INSERT INTO pieces (user_id, nom, reference, description, photo_url, prix_unitaire, stock, condition, zone_geographique, marque, modele, categorie)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING id, user_id, nom, reference, description, photo_url, prix_unitaire, stock, condition, zone_geographique, marque, modele, categorie, created_at, updated_at, deleted_at`,
      [userId, nom, reference, description, photoUrl, prix_unitaire, stock, condition, zone_geographique, marque, modele, categorie]
    );

    return mapPieceRow(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      throw new AppError('Cette reference existe deja dans votre espace vendeur', 400, 'PIECE_REFERENCE_ALREADY_EXISTS');
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
      u.store_name AS seller_store_name,
      u.phone AS seller_phone,
      r.name AS seller_role,
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
  const result = await pool.query(query, params);
  const totalItems = result.rows.length > 0 ? Number(result.rows[0].total_count) : 0;

  return {
    items: result.rows.map(mapPieceRow),
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
            u.name AS seller_name, u.store_name AS seller_store_name, u.phone AS seller_phone, r.name AS seller_role
     FROM pieces p
     LEFT JOIN users u ON u.id = p.user_id
     LEFT JOIN roles r ON r.id = u.role_id
     WHERE p.id = $1 AND p.deleted_at IS NULL`,
    [id]
  );

  if (result.rows.length === 0) {
    throw new AppError('Piece non trouvee', 404, 'PIECE_NOT_FOUND');
  }

  return mapPieceRow(result.rows[0]);
};

const mapVendorOfferRow = (row) => ({
  piece_id: Number(row.piece_id),
  nom: row.nom,
  reference: row.reference,
  prix_unitaire: Number(row.prix_unitaire),
  stock: Number(row.stock),
  condition: row.condition || 'Neuf',
  zone_geographique: row.zone_geographique || null,
  marque: row.marque || null,
  modele: row.modele || null,
  categorie: row.categorie || null,
  photo_url: row.photo_url || null,
  vendeur: {
    id: Number(row.vendeur_id),
    nom: row.vendeur_nom || null,
    magasin: row.vendeur_magasin || null,
    telephone: row.vendeur_telephone || null,
    email: row.vendeur_email || null,
    latitude: row.vendeur_latitude === null ? null : Number(row.vendeur_latitude),
    longitude: row.vendeur_longitude === null ? null : Number(row.vendeur_longitude)
  }
});

const comparePieceAcrossVendors = async ({ pieceId, name, includeOutOfStock = false } = {}) => {
  const hasPieceId = pieceId !== undefined && pieceId !== null && String(pieceId).trim() !== '';
  const normalizedName = normalizeText(name);

  if (!hasPieceId && !normalizedName) {
    throw new AppError('Vous devez fournir pieceId ou name', 400, 'MISSING_SEARCH_CRITERIA');
  }

  let targetPiece = null;
  if (hasPieceId) {
    const safePieceId = parsePositiveInteger(pieceId, 'pieceId');
    const targetResult = await pool.query(
      `SELECT id, nom, reference
       FROM pieces
       WHERE id = $1 AND deleted_at IS NULL`,
      [safePieceId]
    );

    if (targetResult.rows.length === 0) {
      throw new AppError('Piece de reference non trouvee', 404, 'PIECE_NOT_FOUND');
    }

    targetPiece = targetResult.rows[0];
  }

  const whereClauses = ['p.deleted_at IS NULL', "r.name = 'vendeur'"];
  const params = [];

  if (!includeOutOfStock) {
    whereClauses.push('p.stock > 0');
  }

  if (targetPiece && targetPiece.reference) {
    params.push(String(targetPiece.reference).trim());
    whereClauses.push(`LOWER(p.reference) = LOWER($${params.length})`);
  } else {
    const likeSearch = `%${normalizedName.replace(/%/g, '\\%').replace(/_/g, '\\_')}%`;
    params.push(likeSearch);
    whereClauses.push(`(p.nom ILIKE $${params.length} OR p.reference ILIKE $${params.length})`);
  }

  const offersResult = await pool.query(
    `SELECT
      p.id AS piece_id,
      p.nom,
      p.reference,
      p.prix_unitaire,
      p.stock,
      p.condition,
      p.zone_geographique,
      p.marque,
      p.modele,
      p.categorie,
      p.photo_url,
      u.id AS vendeur_id,
      u.name AS vendeur_nom,
      u.store_name AS vendeur_magasin,
      u.phone AS vendeur_telephone,
      u.email AS vendeur_email,
      u.latitude AS vendeur_latitude,
      u.longitude AS vendeur_longitude
     FROM pieces p
     INNER JOIN users u ON u.id = p.user_id
     INNER JOIN roles r ON r.id = u.role_id
     WHERE ${whereClauses.join(' AND ')}
     ORDER BY p.prix_unitaire ASC, p.stock DESC, p.id ASC`,
    params
  );

  const offers = offersResult.rows.map(mapVendorOfferRow);
  if (offers.length === 0) {
    throw new AppError('Aucune offre vendeur trouvee pour cette piece', 404, 'NO_VENDOR_OFFERS_FOUND');
  }

  const minPrice = offers[0].prix_unitaire;
  const maxPrice = offers[offers.length - 1].prix_unitaire;

  return {
    searched_with: {
      pieceId: hasPieceId ? Number(pieceId) : null,
      name: normalizedName || null
    },
    piece: {
      nom: offers[0].nom,
      reference: offers[0].reference,
      marque: offers[0].marque,
      modele: offers[0].modele,
      categorie: offers[0].categorie
    },
    summary: {
      vendeurs_count: offers.length,
      prix_min: minPrice,
      prix_max: maxPrice,
      economie_max: Number((maxPrice - minPrice).toFixed(2))
    },
    offres: offers
  };
};

const updatePiece = async (id, payload) => {
  const currentPiece = await pool.query(
    `SELECT id, user_id, nom, reference, description, photo_url, prix_unitaire, stock, condition, zone_geographique, marque, modele, categorie, deleted_at
     FROM pieces
     WHERE id = $1 AND deleted_at IS NULL`,
    [id]
  );

  if (currentPiece.rows.length === 0) {
    throw new AppError('Piece non trouvee', 404, 'PIECE_NOT_FOUND');
  }

  const current = currentPiece.rows[0];
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
         RETURNING id, user_id, nom, reference, description, photo_url, prix_unitaire, stock, condition, zone_geographique, marque, modele, categorie, created_at, updated_at, deleted_at`,
        [nextNom, nextReference, nextDescription, nextPhotoUrl, nextPrice, nextStock, nextCondition, nextZoneGeographique, nextMarque, nextModele, nextCategorie, id]
    );

    return mapPieceRow(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      throw new AppError('Cette reference existe deja dans votre espace vendeur', 400, 'PIECE_REFERENCE_ALREADY_EXISTS');
    }

    throw error;
  }
};

const deletePiece = async (id) => {
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

const adjustPieceStock = async (id, payload = {}, actorUserId = null) => {
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
         RETURNING id, user_id, nom, reference, description, photo_url, prix_unitaire, stock, condition, zone_geographique, marque, modele, categorie, created_at, updated_at, deleted_at`,
      [stockAfter, id]
    );

    const movement = await createStockMovement(client, {
      pieceId: id,
      userId: actorUserId,
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

const setPieceStock = async (id, payload = {}, actorUserId = null) => {
  const nextStock = Number(payload.stock);
  if (!Number.isInteger(nextStock) || nextStock < 0) {
    throw new AppError('stock doit etre un entier positif ou nul', 400, 'INVALID_STOCK');
  }

  const reason = normalizeText(payload.reason);

  return runInTransaction(async (client) => {
    const piece = await getPieceForUpdate(client, id);
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
         RETURNING id, user_id, nom, reference, description, photo_url, prix_unitaire, stock, condition, zone_geographique, marque, modele, categorie, created_at, updated_at, deleted_at`,
      [nextStock, id]
    );

    const movement = await createStockMovement(client, {
      pieceId: id,
      userId: actorUserId,
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

const getPieceStockMovements = async (id, { page = 1, limit = 20 } = {}) => {
  const safePage = Math.max(Number.parseInt(page, 10) || 1, 1);
  const safeLimit = Math.min(Math.max(Number.parseInt(limit, 10) || 20, 1), 100);
  const offset = (safePage - 1) * safeLimit;

  await getPieceById(id);

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
  getPieceById,
  comparePieceAcrossVendors,
  updatePiece,
  deletePiece,
  adjustPieceStock,
  setPieceStock,
  getPieceStockMovements
};