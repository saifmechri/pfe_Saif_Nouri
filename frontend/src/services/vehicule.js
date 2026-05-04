import API from './api';

// GET - Récupérer la liste des véhicules
export const getVehicules = () => {
  return API.get('/vehicules');
};

// POST - Ajouter un véhicule
export const createVehicule = (vehiculeData) => {
  return API.post('/vehicules', vehiculeData);
};

// PUT - Modifier un véhicule
export const updateVehicule = (vehiculeId, vehiculeData) => {
  return API.put(`/vehicules/${vehiculeId}`, vehiculeData);
};

// DELETE - Supprimer un véhicule
export const deleteVehicule = (vehiculeId) => {
  return API.delete(`/vehicules/${vehiculeId}`);
};

// GET - Historique des interventions d'un véhicule
export const getInterventionsByVehicle = (vehiculeId) => {
  return API.get(`/vehicules/${vehiculeId}/interventions`).then((res) => res.data?.data ?? res.data ?? []);
};

// POST - Créer une intervention pour un véhicule
export const createIntervention = (vehiculeId, interventionData) => {
  return API.post(`/vehicules/${vehiculeId}/interventions`, interventionData).then((res) => res.data?.data ?? res.data);
};

// GET - Récupérer la liste des pièces disponibles
export const getPieces = () => {
  return API.get('/pieces');
};
