import API from "./api";

export const listAppointments = (params = {}) => {
  return API.get("/appointments", { params });
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
  createAppointment,
  updateAppointment,
  deleteAppointment,
};
