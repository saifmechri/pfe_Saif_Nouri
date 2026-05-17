const { asyncHandler } = require('../middlewares/asyncHandler');
const { sendApiResponse } = require('../utils/apiResponse');
const { AppError } = require('../utils/appError');
const garageMatchingService = require('../services/garageMatchingService');
const { pool } = require('../db');

const matchGarages = asyncHandler(async (req, res) => {
  const vehicleId = Number(req.params.vehicleId);
  const maxDistance = Number(req.query.maxDistance) || 50;

  if (!Number.isInteger(vehicleId) || vehicleId <= 0) {
    throw new AppError('vehicleId invalide', 400, 'INVALID_VEHICLE_ID');
  }

  if (maxDistance <= 0 || maxDistance > 500) {
    throw new AppError('maxDistance doit etre entre 1 et 500 km', 400, 'INVALID_MAX_DISTANCE');
  }

  // Verify vehicle exists and user is authorized
  const vehicleResult = await pool.query('SELECT id, user_id FROM vehicules WHERE id = $1', [vehicleId]);
  if (vehicleResult.rows.length === 0) {
    throw new AppError('Vehicule introuvable', 404, 'VEHICLE_NOT_FOUND');
  }

  const vehicle = vehicleResult.rows[0];
  const currentUserId = Number(req.user?.id);
  const role = req.user?.role;

  // Only automobiliste owner, garage, or admin can view
  if (!(role === 'admin' || Number(vehicle.user_id) === currentUserId || role === 'garage')) {
    throw new AppError('Acces refuse : non proprietaire', 403, 'FORBIDDEN');
  }

  const matchedGarages = await garageMatchingService.matchGarages(vehicleId, maxDistance);

  return sendApiResponse(res, {
    message: `${matchedGarages.length} garages trouves et classÃ©s`,
    data: matchedGarages
  });
});

module.exports = {
  matchGarages
};


