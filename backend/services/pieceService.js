const { pool } = require('../db');
const { AppError } = require('../utils/appError');

const ALLOWED_SORT_FIELDS = new Set(['nom', 'reference', 'prix_unitaire', 'created_at', 'updated_at']);
const ALLOWED_SORT_ORDERS = new Set(['asc', 'desc']);

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

  return `${normalizedSortBy} ${normalizedSortOrder}`;
};

const mapPieceRow = (row) => ({
  id: row.id,
  nom: row.nom,
  reference: row.reference,
  description: row.description,
  prix_unitaire: Number(row.prix_unitaire),
  stock: Number(row.stock),
  created_at: row.created_at,
  updated_at: row.updated_at,
  deleted_at: row.deleted_at || null
});

const createPiece = async (payload) => {
  const nom = normalizeText(payload.nom);
  const reference = normalizeText(payload.reference);
  const description = normalizeText(payload.description);
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
      `INSERT INTO pieces (nom, reference, description, prix_unitaire, stock)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, nom, reference, description, prix_unitaire, stock, created_at, updated_at, deleted_at`,
      [nom, reference, description, prix_unitaire, stock]
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
      id,
      nom,
      reference,
      description,
      prix_unitaire,
      stock,
      created_at,
      updated_at,
      deleted_at,
      COUNT(*) OVER() AS total_count
    FROM pieces
    WHERE deleted_at IS NULL${searchClause.sql}
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
    `SELECT id, nom, reference, description, prix_unitaire, stock, created_at, updated_at, deleted_at
     FROM pieces
     WHERE id = $1 AND deleted_at IS NULL`,
    [id]
  );

  if (result.rows.length === 0) {
    throw new AppError('Piece non trouvee', 404, 'PIECE_NOT_FOUND');
  }

  return mapPieceRow(result.rows[0]);
};

const updatePiece = async (id, payload) => {
  const currentPiece = await pool.query(
    `SELECT id, nom, reference, description, prix_unitaire, stock, deleted_at
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
           prix_unitaire = $4,
           stock = $5,
           updated_at = NOW()
       WHERE id = $6 AND deleted_at IS NULL
       RETURNING id, nom, reference, description, prix_unitaire, stock, created_at, updated_at, deleted_at`,
      [nextNom, nextReference, nextDescription, nextPrice, nextStock, id]
    );

    return mapPieceRow(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      throw new AppError('Cette reference de piece existe deja', 400, 'PIECE_REFERENCE_ALREADY_EXISTS');
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

module.exports = {
  createPiece,
  getPieces,
  getPieceById,
  updatePiece,
  deletePiece
};