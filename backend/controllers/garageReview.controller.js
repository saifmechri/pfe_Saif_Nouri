const { pool } = require('../db');
const { asyncHandler } = require('../middlewares/asyncHandler');
const { sendApiResponse } = require('../utils/apiResponse');
const { AppError } = require('../utils/appError');
const { findGarageIdentityById, findGarageIdentityByUserId } = require('../models/garage.model');

const mapReviewRow = (row) => ({
  id: Number(row.id),
  garage_id: Number(row.garage_id),
  user_id: Number(row.user_id),
  rating: row.rating === null ? null : Number(row.rating),
  comment: row.comment || null,
  is_published: row.is_published === null ? true : Boolean(row.is_published),
  created_at: row.created_at,
  updated_at: row.updated_at,
  reviewer: row.reviewer_name ? {
    id: Number(row.user_id),
    name: row.reviewer_name,
    email: row.reviewer_email || null,
    phone: row.reviewer_phone || null
  } : undefined
});

const normalizeOptionalString = (value) => {
  if (value === undefined || value === null) {
    return null;
  }

  const normalized = String(value).trim();
  return normalized.length === 0 ? null : normalized;
};

const parseRating = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1 || parsed > 5) {
    throw new AppError('rating doit etre compris entre 1 et 5', 400, 'INVALID_RATING');
  }

  return Number(parsed.toFixed(2));
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

const isGarageOwnerOrAdmin = (req, garageRow) => {
  if (req.user?.role === 'admin') {
    return true;
  }

  if (req.user?.role !== 'garage') {
    return false;
  }

  return Number(garageRow.user_id) === Number(req.user?.id);
};

const canManageReview = (req, garageRow, reviewRow) => {
  if (req.user?.role === 'admin') {
    return true;
  }

  if (req.user?.role === 'garage' && Number(garageRow.user_id) === Number(req.user?.id)) {
    return true;
  }

  return req.user?.role === 'automobiliste' && Number(reviewRow.user_id) === Number(req.user?.id);
};

const listGarageReviews = asyncHandler(async (req, res) => {
  const garageId = Number.parseInt(req.params.id, 10);
  if (!Number.isInteger(garageId) || garageId <= 0) {
    throw new AppError('Identifiant garage invalide', 400, 'INVALID_GARAGE_ID');
  }

  await getGarageById(garageId);

  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 10));
  const offset = (page - 1) * limit;
  const includeHidden = ['true', '1', 'yes', 'on'].includes(String(req.query.includeHidden || '').toLowerCase());

  const reviewScope = includeHidden && req.user && (req.user.role === 'admin' || req.user.role === 'garage')
    ? ''
    : 'AND r.is_published = true';

  const result = await pool.query(
    `SELECT r.id, r.garage_id, r.user_id, r.rating, r.comment, r.is_published, r.created_at, r.updated_at,
            u.name AS reviewer_name, u.email AS reviewer_email, u.phone AS reviewer_phone,
            COUNT(*) OVER() AS total_count
     FROM garage_reviews r
     LEFT JOIN users u ON u.id = r.user_id
     WHERE r.garage_id = $1 ${reviewScope}
     ORDER BY r.created_at DESC
     LIMIT $2
     OFFSET $3`,
    [garageId, limit, offset]
  );

  const statsResult = await pool.query(
    `SELECT COUNT(*)::int AS reviews_count,
            COALESCE(ROUND(AVG(rating)::numeric, 2), 0) AS average_rating,
            COALESCE(MIN(rating), 0) AS min_rating,
            COALESCE(MAX(rating), 0) AS max_rating
     FROM garage_reviews
     WHERE garage_id = $1 AND is_published = true`,
    [garageId]
  );

  const totalItems = result.rows.length > 0 ? Number(result.rows[0].total_count) : 0;
  const stats = statsResult.rows[0] || {};

  return sendApiResponse(res, {
    message: 'Avis du garage recuperes avec succes',
    data: {
      items: result.rows.map(mapReviewRow),
      summary: {
        reviews_count: Number(stats.reviews_count || 0),
        average_rating: Number(stats.average_rating || 0),
        min_rating: Number(stats.min_rating || 0),
        max_rating: Number(stats.max_rating || 0)
      },
      pagination: {
        page,
        limit,
        totalItems,
        totalPages: totalItems === 0 ? 0 : Math.ceil(totalItems / limit)
      }
    }
  });
});

const listMyGarageReviews = asyncHandler(async (req, res) => {
  const currentUserId = Number(req.user?.id);
  if (!Number.isInteger(currentUserId) || currentUserId <= 0) {
    throw new AppError('Utilisateur authentifie invalide', 401, 'INVALID_AUTH_USER');
  }

  const myGarage = await getMyGarageRow(currentUserId);
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 10));
  const offset = (page - 1) * limit;
  const includeHidden = ['true', '1', 'yes', 'on'].includes(String(req.query.includeHidden || '').toLowerCase());

  const result = await pool.query(
    `SELECT r.id, r.garage_id, r.user_id, r.rating, r.comment, r.is_published, r.created_at, r.updated_at,
            u.name AS reviewer_name, u.email AS reviewer_email, u.phone AS reviewer_phone,
            COUNT(*) OVER() AS total_count
     FROM garage_reviews r
     LEFT JOIN users u ON u.id = r.user_id
     WHERE r.garage_id = $1 ${includeHidden ? '' : 'AND r.is_published = true'}
     ORDER BY r.created_at DESC
     LIMIT $2
     OFFSET $3`,
    [myGarage.id, limit, offset]
  );

  const totalItems = result.rows.length > 0 ? Number(result.rows[0].total_count) : 0;

  return sendApiResponse(res, {
    message: 'Liste de vos avis recuperee avec succes',
    data: {
      garage_id: Number(myGarage.id),
      items: result.rows.map(mapReviewRow),
      pagination: {
        page,
        limit,
        totalItems,
        totalPages: totalItems === 0 ? 0 : Math.ceil(totalItems / limit)
      }
    }
  });
});

const createGarageReview = asyncHandler(async (req, res) => {
  const garageId = Number.parseInt(req.params.id, 10);
  if (!Number.isInteger(garageId) || garageId <= 0) {
    throw new AppError('Identifiant garage invalide', 400, 'INVALID_GARAGE_ID');
  }

  if (req.user?.role !== 'automobiliste') {
    throw new AppError('Seuls les automobilistes peuvent laisser un avis', 403, 'FORBIDDEN_ROLE');
  }

  await getGarageById(garageId);

  const rating = parseRating(req.body?.rating);
  const comment = normalizeOptionalString(req.body?.comment);

  const existingReview = await pool.query(
    `SELECT id FROM garage_reviews WHERE garage_id = $1 AND user_id = $2`,
    [garageId, req.user.id]
  );

  if (existingReview.rows.length > 0) {
    throw new AppError('Vous avez deja laisse un avis pour ce garage', 409, 'REVIEW_ALREADY_EXISTS');
  }

  const insertResult = await pool.query(
    `INSERT INTO garage_reviews (garage_id, user_id, rating, comment, is_published, created_at, updated_at)
     VALUES ($1, $2, $3, $4, COALESCE($5, true), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
     RETURNING id, garage_id, user_id, rating, comment, is_published, created_at, updated_at`,
    [garageId, req.user.id, rating, comment, req.body?.is_published]
  );

  return sendApiResponse(res, {
    statusCode: 201,
    message: 'Avis cree avec succes',
    data: mapReviewRow(insertResult.rows[0])
  });
});

const updateGarageReview = asyncHandler(async (req, res) => {
  const garageId = Number.parseInt(req.params.id, 10);
  const reviewId = Number.parseInt(req.params.reviewId, 10);

  if (!Number.isInteger(garageId) || garageId <= 0) {
    throw new AppError('Identifiant garage invalide', 400, 'INVALID_GARAGE_ID');
  }

  if (!Number.isInteger(reviewId) || reviewId <= 0) {
    throw new AppError('Identifiant avis invalide', 400, 'INVALID_REVIEW_ID');
  }

  const reviewResult = await pool.query(
    `SELECT id, garage_id, user_id, rating, comment, is_published, created_at, updated_at
     FROM garage_reviews
     WHERE id = $1 AND garage_id = $2`,
    [reviewId, garageId]
  );

  if (reviewResult.rows.length === 0) {
    throw new AppError('Avis introuvable pour ce garage', 404, 'REVIEW_NOT_FOUND');
  }

  const review = reviewResult.rows[0];
  const garageRow = await getGarageById(garageId);

  if (!canManageReview(req, garageRow, review)) {
    throw new AppError('Acces refuse : vous ne pouvez pas modifier cet avis', 403, 'FORBIDDEN_REVIEW_ACCESS');
  }

  const hasAnyField = ['rating', 'comment', 'is_published'].some((field) => req.body?.[field] !== undefined);
  if (!hasAnyField) {
    throw new AppError('Au moins un champ doit etre fourni', 400, 'EMPTY_UPDATE_PAYLOAD');
  }

  const updatedRating = req.body?.rating !== undefined ? parseRating(req.body.rating) : null;
  const updatedComment = req.body?.comment !== undefined ? normalizeOptionalString(req.body.comment) : null;
  const updatedPublished = req.body?.is_published !== undefined ? Boolean(req.body.is_published) : null;

  const updatedResult = await pool.query(
    `UPDATE garage_reviews
     SET rating = COALESCE($1, rating),
         comment = COALESCE($2, comment),
         is_published = COALESCE($3, is_published),
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $4 AND garage_id = $5
     RETURNING id, garage_id, user_id, rating, comment, is_published, created_at, updated_at`,
    [updatedRating, updatedComment, updatedPublished, reviewId, garageId]
  );

  return sendApiResponse(res, {
    message: 'Avis mis a jour avec succes',
    data: mapReviewRow(updatedResult.rows[0])
  });
});

const deleteGarageReview = asyncHandler(async (req, res) => {
  const garageId = Number.parseInt(req.params.id, 10);
  const reviewId = Number.parseInt(req.params.reviewId, 10);

  if (!Number.isInteger(garageId) || garageId <= 0) {
    throw new AppError('Identifiant garage invalide', 400, 'INVALID_GARAGE_ID');
  }

  if (!Number.isInteger(reviewId) || reviewId <= 0) {
    throw new AppError('Identifiant avis invalide', 400, 'INVALID_REVIEW_ID');
  }

  const reviewResult = await pool.query(
    `SELECT id, garage_id, user_id
     FROM garage_reviews
     WHERE id = $1 AND garage_id = $2`,
    [reviewId, garageId]
  );

  if (reviewResult.rows.length === 0) {
    throw new AppError('Avis introuvable pour ce garage', 404, 'REVIEW_NOT_FOUND');
  }

  const garageRow = await getGarageById(garageId);

  if (!canManageReview(req, garageRow, reviewResult.rows[0])) {
    throw new AppError('Acces refuse : vous ne pouvez pas supprimer cet avis', 403, 'FORBIDDEN_REVIEW_ACCESS');
  }

  await pool.query('DELETE FROM garage_reviews WHERE id = $1 AND garage_id = $2', [reviewId, garageId]);

  return sendApiResponse(res, {
    message: 'Avis supprime avec succes',
    data: null
  });
});

module.exports = {
  listGarageReviews,
  listMyGarageReviews,
  createGarageReview,
  updateGarageReview,
  deleteGarageReview
};
