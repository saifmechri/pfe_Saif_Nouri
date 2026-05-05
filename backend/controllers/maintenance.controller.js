const { asyncHandler } = require('../middlewares/asyncHandler');
const { sendApiResponse } = require('../utils/apiResponse');
const { AppError } = require('../utils/appError');
const maintenanceService = require('../services/maintenanceService');
const { pool } = require('../db');

const getNextRevision = asyncHandler(async (req, res) => {
  const vehicleId = Number(req.params.vehicleId);
  
  if (!Number.isInteger(vehicleId) || vehicleId <= 0) {
    throw new AppError('vehicleId invalide', 400, 'INVALID_VEHICLE_ID');
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

  const revisionData = await maintenanceService.calculateNextRevision(vehicleId);

  if (!revisionData) {
    return sendApiResponse(res, {
      message: 'Aucune intervention enregistree pour ce vehicule',
      data: null
    });
  }

  return sendApiResponse(res, {
    message: 'Prochaine revision calculee',
    data: revisionData
  });
});

module.exports = {
  getNextRevision
};
