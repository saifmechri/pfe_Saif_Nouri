/**
 * APPOINTMENTS SERVICE
 *
 * Manages appointment bookings between users and garages.
 */

import API from "./api";

export const listAppointments = (params = {}) => {
  return API.get("/appointments", { params: { ...params, _: Date.now() } });
};

export const getAppointment = (id) => {
  return API.get(`/appointments/${id}`);
};

export const createAppointment = (payload = {}) => {
  return API.post("/appointments", payload);
};

export const updateAppointment = (id, updates = {}) => {
  return API.patch(`/appointments/${id}`, updates);
};

export const deleteAppointment = (id) => {
  return API.delete(`/appointments/${id}`);
};

export default {
  listAppointments,
  getAppointment,
  createAppointment,
  updateAppointment,
  deleteAppointment,
};

