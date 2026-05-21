const { asyncHandler } = require('../middlewares/asyncHandler');
const { sendApiResponse } = require('../utils/apiResponse');
const { AppError } = require('../utils/appError');
const maintenanceService = require('../services/maintenanceService');

const normalizeServiceError = (error) => {
  if (error && error.code === 'FORBIDDEN') {
    return new AppError('Acces refuse : non proprietaire', 403, 'FORBIDDEN');
  }

  return error;
};

const getMaintenanceDashboard = asyncHandler(async (req, res) => {
  const vehicleId = Number(req.query.vehicleId);

  if (!Number.isInteger(vehicleId) || vehicleId <= 0) {
    throw new AppError('vehicleId invalide', 400, 'INVALID_VEHICLE_ID');
  }

  let dashboard;
  try {
    dashboard = await maintenanceService.buildMaintenanceDashboard(vehicleId, req.user);
  } catch (error) {
    throw normalizeServiceError(error);
  }

  if (!dashboard) {
    throw new AppError('Vehicule introuvable', 404, 'VEHICLE_NOT_FOUND');
  }

  return sendApiResponse(res, {
    message: 'Tableau de bord maintenance calcule',
    data: dashboard
  });
});

const getNextRevision = asyncHandler(async (req, res) => {
  const vehicleId = Number(req.params.vehicleId);

  if (!Number.isInteger(vehicleId) || vehicleId <= 0) {
    throw new AppError('vehicleId invalide', 400, 'INVALID_VEHICLE_ID');
  }

  let revisionData;
  try {
    revisionData = await maintenanceService.calculateNextRevision(vehicleId, req.user);
  } catch (error) {
    throw normalizeServiceError(error);
  }

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
  getMaintenanceDashboard,
  getNextRevision
};


