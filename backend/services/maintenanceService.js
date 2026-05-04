const maintenanceModel = require('../models/maintenance.model');

const calculateNextRevision = async (vehicleId) => {
  return maintenanceModel.calculateNextRevisionForVehicle(vehicleId);
};

module.exports = {
  calculateNextRevision
};
