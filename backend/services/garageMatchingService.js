const garageMatchingModel = require('../models/garageMatching.model');

const matchGarages = async (vehicleId, maxDistance = 50) => {
  return garageMatchingModel.matchGaragesForVehicle(vehicleId, maxDistance);
};

module.exports = {
  matchGarages
};
