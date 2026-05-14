/**
 * APPOINTMENTS SERVICE
 * 
 * Manages appointment bookings between users and garages.
 * 
 * WORKFLOW:
 * 1. User creates appointment with preferred dates
 * 2. Garage proposes available time slots
 * 3. User confirms selected time
 * 4. Appointment scheduled
 * 
 * STATUSES: PENDING, PROPOSED, CONFIRMED, COMPLETED, CANCELLED
 */

import API from "./api";

export const listAppointments = (params = {}) => {
  return API.get("/appointments", { params });
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
};

export default {
  listAppointments,
  getAppointment,
  createAppointment,
  updateAppointment,
  deleteAppointment,
};
