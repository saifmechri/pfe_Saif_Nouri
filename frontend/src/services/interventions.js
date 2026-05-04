import API from './api';

const listForVehicle = async (vehicleId, { page = 1, limit = 50 } = {}) => {
  const params = { page, limit };
  const res = await API.get(`/vehicules/${vehicleId}/interventions`, { params });
  return res.data?.data || res.data;
};

const getById = async (vehicleId, id) => {
  const res = await API.get(`/vehicules/${vehicleId}/interventions/${id}`);
  return res.data?.data || res.data;
};

const create = async (vehicleId, payload) => {
  const res = await API.post(`/vehicules/${vehicleId}/interventions`, payload);
  return res.data?.data || res.data;
};

const update = async (vehicleId, id, payload) => {
  const res = await API.patch(`/vehicules/${vehicleId}/interventions/${id}`, payload);
  return res.data?.data || res.data;
};

const remove = async (vehicleId, id) => {
  const res = await API.delete(`/vehicules/${vehicleId}/interventions/${id}`);
  return res.data;
};

export default {
  listForVehicle,
  getById,
  create,
  update,
  remove
};
