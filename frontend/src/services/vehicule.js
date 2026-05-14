/**
 * VEHICLE SERVICE
 *
 * Manages vehicle operations and maintenance history.
 */

import API from './api';

export const getVehicules = () => {
  return API.get('/vehicules');
};

export const createVehicule = (vehiculeData) => {
  return API.post('/vehicules', vehiculeData);
};

export const updateVehicule = (vehiculeId, vehiculeData) => {
  return API.put(`/vehicules/${vehiculeId}`, vehiculeData);
};

export const deleteVehicule = (vehiculeId) => {
  return API.delete(`/vehicules/${vehiculeId}`);
};

export const getInterventionsByVehicle = (vehiculeId) => {
  return API.get(`/vehicules/${vehiculeId}/interventions`).then((res) => res.data?.data ?? res.data ?? []);
};

export const createIntervention = (vehiculeId, interventionData) => {
  return API.post(`/vehicules/${vehiculeId}/interventions`, interventionData).then((res) => res.data?.data ?? res.data);
};

export const getPieces = () => {
  return API.get('/pieces');
};