const { asyncHandler } = require('../middlewares/asyncHandler');
const { sendApiResponse } = require('../utils/apiResponse');
const { AppError } = require('../utils/appError');
const pieceService = require('../services/pieceService');
const { logger } = require('../utils/logger');

const createPiece = asyncHandler(async (req, res) => {
  logger.info('POST /api/pieces payload received', {
    contentType: req.headers['content-type'],
    bodyKeys: Object.keys(req.body || {}),
    bodyPreview: {
      nom: req.body?.nom,
      reference: req.body?.reference,
      prix_unitaire: req.body?.prix_unitaire,
      stock: req.body?.stock,
      condition: req.body?.condition,
      zone_geographique: req.body?.zone_geographique,
      marque: req.body?.marque,
      modele: req.body?.modele,
      categorie: req.body?.categorie
    },
    hasFile: Boolean(req.file),
    fileInfo: req.file
      ? {
          fieldname: req.file.fieldname,
          originalname: req.file.originalname,
          mimetype: req.file.mimetype,
          filename: req.file.filename,
          size: req.file.size
        }
      : null
  });

  const payload = {
    ...(req.body || {}),
    user_id: req.user?.id || null
  };

  if (req.file) {
    payload.photo_url = `/uploads/pieces/${req.file.filename}`;
  }

  const piece = await pieceService.createPiece(payload);

  return sendApiResponse(res, {
    statusCode: 201,
    message: 'Piece creee avec succes',
    data: piece
  });
});

const getAllPieces = asyncHandler(async (req, res) => {
  const pieces = await pieceService.getPieces({
    page: req.query.page,
    limit: req.query.limit,
    search: req.query.search,
    sortBy: req.query.sortBy,
    sortOrder: req.query.sortOrder
  });

  return sendApiResponse(res, {
    message: 'Liste des pieces recuperée avec succes',
    data: pieces
  });
});

const getPieceById = asyncHandler(async (req, res) => {
  const pieceId = Number.parseInt(req.params.id, 10);
  if (!Number.isFinite(pieceId) || pieceId <= 0) {
    throw new AppError('Identifiant de piece invalide', 400, 'INVALID_PIECE_ID');
  }

  const piece = await pieceService.getPieceById(pieceId);

  return sendApiResponse(res, {
    message: 'Piece recuperée avec succes',
    data: piece
  });
});

const comparePieceAcrossVendors = asyncHandler(async (req, res) => {
  const pieceId = req.query.pieceId;
  const name = req.query.name;
  const includeOutOfStock = ['true', '1', 'yes', 'on']
    .includes(String(req.query.includeOutOfStock || '').toLowerCase());
  const userLat = req.query.userLat;
  const userLon = req.query.userLon;
  const radiusKm = req.query.radiusKm;
  const sortBy = req.query.sortBy;
  const sortOrder = req.query.sortOrder;

  const comparison = await pieceService.comparePieceAcrossVendors({
    pieceId,
    name,
    includeOutOfStock,
    userLat,
    userLon,
    radiusKm,
    sortBy,
    sortOrder
  });

  return sendApiResponse(res, {
    message: 'Comparaison multi-vendeurs recuperee avec succes',
    data: comparison
  });
});

const getPieceSellerLocations = asyncHandler(async (req, res) => {
  const locations = await pieceService.listPieceSellerLocations({
    userLat: req.query.userLat,
    userLon: req.query.userLon,
    radiusKm: req.query.radiusKm
  });

  return sendApiResponse(res, {
    message: 'Localisations vendeurs de pieces recuperees avec succes',
    data: locations
  });
});

const updatePiece = asyncHandler(async (req, res) => {
  const pieceId = Number.parseInt(req.params.id, 10);
  if (!Number.isFinite(pieceId) || pieceId <= 0) {
    throw new AppError('Identifiant de piece invalide', 400, 'INVALID_PIECE_ID');
  }

  const payload = req.body || {};

  if (req.file) {
    payload.photo_url = `/uploads/pieces/${req.file.filename}`;
  }

  const piece = await pieceService.updatePiece(pieceId, payload);

  return sendApiResponse(res, {
    message: 'Piece mise a jour avec succes',
    data: piece
  });
});

const deletePiece = asyncHandler(async (req, res) => {
  const pieceId = Number.parseInt(req.params.id, 10);
  if (!Number.isFinite(pieceId) || pieceId <= 0) {
    throw new AppError('Identifiant de piece invalide', 400, 'INVALID_PIECE_ID');
  }

  await pieceService.deletePiece(pieceId);

  return sendApiResponse(res, {
    message: 'Piece supprimee avec succes',
    data: null
  });
});

const adjustPieceStock = asyncHandler(async (req, res) => {
  const pieceId = Number.parseInt(req.params.id, 10);
  if (!Number.isFinite(pieceId) || pieceId <= 0) {
    throw new AppError('Identifiant de piece invalide', 400, 'INVALID_PIECE_ID');
  }

  const result = await pieceService.adjustPieceStock(pieceId, req.body || {}, req.user?.id || null);

  return sendApiResponse(res, {
    message: 'Stock ajuste avec succes',
    data: result
  });
});

const setPieceStock = asyncHandler(async (req, res) => {
  const pieceId = Number.parseInt(req.params.id, 10);
  if (!Number.isFinite(pieceId) || pieceId <= 0) {
    throw new AppError('Identifiant de piece invalide', 400, 'INVALID_PIECE_ID');
  }

  const result = await pieceService.setPieceStock(pieceId, req.body || {}, req.user?.id || null);

  return sendApiResponse(res, {
    message: 'Stock defini avec succes',
    data: result
  });
});

const getPieceStockMovements = asyncHandler(async (req, res) => {
  const pieceId = Number.parseInt(req.params.id, 10);
  if (!Number.isFinite(pieceId) || pieceId <= 0) {
    throw new AppError('Identifiant de piece invalide', 400, 'INVALID_PIECE_ID');
  }

  const movements = await pieceService.getPieceStockMovements(pieceId, {
    page: req.query.page,
    limit: req.query.limit
  });

  return sendApiResponse(res, {
    message: 'Historique de stock recupere avec succes',
    data: movements
  });
});

module.exports = {
  createPiece,
  getAllPieces,
  getPieceById,
  comparePieceAcrossVendors,
  getPieceSellerLocations,
  updatePiece,
  deletePiece,
  adjustPieceStock,
  setPieceStock,
  getPieceStockMovements
};