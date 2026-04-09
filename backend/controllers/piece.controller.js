const { asyncHandler } = require('../middlewares/asyncHandler');
const { sendApiResponse } = require('../utils/apiResponse');
const { AppError } = require('../utils/appError');
const pieceService = require('../services/pieceService');

const createPiece = asyncHandler(async (req, res) => {
  const piece = await pieceService.createPiece(req.body || {});

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

const updatePiece = asyncHandler(async (req, res) => {
  const pieceId = Number.parseInt(req.params.id, 10);
  if (!Number.isFinite(pieceId) || pieceId <= 0) {
    throw new AppError('Identifiant de piece invalide', 400, 'INVALID_PIECE_ID');
  }

  const piece = await pieceService.updatePiece(pieceId, req.body || {});

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
  updatePiece,
  deletePiece,
  adjustPieceStock,
  setPieceStock,
  getPieceStockMovements
};