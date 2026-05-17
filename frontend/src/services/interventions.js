/**
 * INTERVENTIONS SERVICE
 *
 * Manages vehicle maintenance records and intervention history.
 */

import API from './api';

const notifyMaintenanceRefresh = (vehicleId) => {
  if (typeof window === 'undefined') return;

  window.dispatchEvent(
    new CustomEvent('maintenance:refresh', {
      detail: { vehicleId: Number(vehicleId) },
    })
  );
};

const listForVehicle = async (vehicleId, { page = 1, limit = 50 } = {}) => {
  const params = { page, limit, _: Date.now() };
  const res = await API.get(`/vehicules/${vehicleId}/interventions`, { params });
  return res.data?.data || res.data;
};

const getById = async (vehicleId, id) => {
  const res = await API.get(`/vehicules/${vehicleId}/interventions/${id}`);
  return res.data?.data || res.data;
};

const create = async (vehicleId, payload) => {
  const res = await API.post(`/vehicules/${vehicleId}/interventions`, payload);
  notifyMaintenanceRefresh(vehicleId);
  return res.data?.data || res.data;
};

const update = async (vehicleId, id, payload) => {
  const res = await API.patch(`/vehicules/${vehicleId}/interventions/${id}`, payload);
  notifyMaintenanceRefresh(vehicleId);
  return res.data?.data || res.data;
};

const remove = async (vehicleId, id) => {
  const res = await API.delete(`/vehicules/${vehicleId}/interventions/${id}`);
  notifyMaintenanceRefresh(vehicleId);
  return res.data;
};

const deleteIntervention = async (vehicleId, id) => {
  return remove(vehicleId, id);
};

const addPiece = async (vehicleId, interventionId, payload) => {
  const res = await API.post(`/vehicules/${vehicleId}/interventions/${interventionId}/pieces`, payload);
  return res.data?.data || res.data;
};

export default {
  listForVehicle,
  getById,
  create,
  update,
  remove,
  deleteIntervention,
  addPiece,
};

