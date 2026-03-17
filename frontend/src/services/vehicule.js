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
