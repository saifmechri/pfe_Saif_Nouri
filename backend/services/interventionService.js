const interventionModel = require('../models/intervention.model');

const create = async (data) => {
  return interventionModel.createIntervention(data);
};

const getById = async (id) => {
  return interventionModel.getInterventionById(id);
};

const listForVehicle = async (vehicleId, opts) => {
  return interventionModel.listInterventionsForVehicle(vehicleId, opts);
};

const listForUser = async (userId, opts) => {
  return interventionModel.listInterventionsForUser(userId, opts);
};

const update = async (id, updates) => {
  return interventionModel.updateIntervention(id, updates);
};

const remove = async (id) => {
  return interventionModel.deleteIntervention(id);
};

module.exports = {
  create,
  getById,
  listForVehicle,
  listForUser,
  update,
  remove
};


