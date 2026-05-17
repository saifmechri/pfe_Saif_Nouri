const appointmentModel = require('../models/appointment.model');

const create = async (payload) => {
  return appointmentModel.createAppointment(payload);
};

const getById = async (appointmentId) => {
  return appointmentModel.getAppointmentById(appointmentId);
};

const listForAutomobiliste = async (automobilisteUserId, opts) => {
  return appointmentModel.listAppointmentsForAutomobiliste(automobilisteUserId, opts);
};

const listForGarage = async (garageId, opts) => {
  return appointmentModel.listAppointmentsForGarage(garageId, opts);
};

const update = async (appointmentId, updates) => {
  return appointmentModel.updateAppointment(appointmentId, updates);
};

const remove = async (appointmentId) => {
  return appointmentModel.deleteAppointment(appointmentId);
};

module.exports = {
  create,
  getById,
  listForAutomobiliste,
  listForGarage,
  update,
  remove
};


