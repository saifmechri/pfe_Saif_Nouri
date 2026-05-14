/**
 * VEHICLE SERVICE
 * 
 * Manages vehicle operations and maintenance history.
 * 
 * KEY ENDPOINTS:
 * - Create vehicle (register new car)
 * - List vehicles (get all user's vehicles)
 * - Update vehicle info (km, details)
 * - Delete vehicle
 * - Get vehicle intervention history
 * - Create intervention (log maintenance)
 */

import API from './api';

/**
 * Get all user's vehicles
 * 
 * USAGE:\n * const response = await getVehicules();\n * console.log(response.data.data); // Array of vehicle objects\n * \n * @returns {Promise} Array of vehicles with details\n */\nexport const getVehicules = () => {
  return API.get('/vehicules');
};

/**
 * Create new vehicle (register car)\n * \n * FIELDS:\n * - marque (brand): Toyota, Renault, etc.\n * - modele (model): Corolla, Logan, etc.\n * - annee (year): 2020\n * - type_carburant (fuel): Essence, Diesel, Électrique\n * - kilometrage (current km): 45230\n * - matricule (plate): TN 123 TN\n * \n * USAGE:\n * await createVehicule({\n *   marque: 'Toyota',\n *   modele: 'Corolla',\n *   annee: 2020,\n *   type_carburant: 'Essence',\n *   kilometrage: 45000,\n *   matricule: 'TN 123 TN'\n * });\n * \n * @param {Object} vehiculeData - Vehicle details\n * @returns {Promise} Created vehicle object\n */\nexport const createVehicule = (vehiculeData) => {
  return API.post('/vehicules', vehiculeData);
};

/**
 * Update vehicle information\n * \n * Can update any vehicle fields (especially kilometer reading)\n * \n * USAGE:\n * await updateVehicule(vehicleId, { kilometrage: 50000 });\n * \n * @param {number} vehiculeId - Vehicle ID\n * @param {Object} vehiculeData - Fields to update\n * @returns {Promise} Updated vehicle\n */\nexport const updateVehicule = (vehiculeId, vehiculeData) => {
  return API.put(`/vehicules/${vehiculeId}`, vehiculeData);
};

/**
 * Delete a vehicle from user's account\n * \n * Removes vehicle and its associated history.\n * \n * @param {number} vehiculeId - ID of vehicle to delete\n * @returns {Promise} Deletion confirmation\n */\nexport const deleteVehicule = (vehiculeId) => {
  return API.delete(`/vehicules/${vehiculeId}`);
};

/**
 * Get complete intervention history for a vehicle\n * \n * Returns all maintenance records (past and present):\n * - vidange (oil change)\n * - révision (inspection)\n * - reparation (repair)\n * - etc.\n * \n * USAGE:\n * const history = await getInterventionsByVehicle(vehicleId);\n * history.forEach(intervention => {\n *   console.log(`${intervention.date}: ${intervention.type} at ${intervention.garage}`);\n * });\n * \n * @param {number} vehiculeId - Vehicle ID\n * @returns {Promise} Array of intervention records\n */\nexport const getInterventionsByVehicle = (vehiculeId) => {
  return API.get(`/vehicules/${vehiculeId}/interventions`).then((res) => res.data?.data ?? res.data ?? []);
};

/**
 * Log new intervention/maintenance for vehicle\n * \n * Records maintenance performed on the vehicle.\n * \n * FIELDS:\n * - date_intervention: Date work was performed\n * - type: vidange, révision, reparation, etc.\n * - garage_nom: Garage name where work done\n * - garage_adresse: Garage address\n * - kilometrage: Current km reading\n * - description: Detailed notes\n * - pieces_libres: Parts used (free text: \"Oil 5W30 x4L, Filter x1\")\n * \n * USAGE:\n * await createIntervention(vehicleId, {\n *   date_intervention: '2024-05-14',\n *   type: 'vidange',\n *   garage_nom: 'Auto Tech',\n *   kilometers: 45230,\n *   pieces_libres: 'Huile 5W30 x4L, Filtre x1'\n * });\n * \n * @param {number} vehiculeId - Vehicle ID\n * @param {Object} interventionData - Intervention details\n * @returns {Promise} Created intervention\n */\nexport const createIntervention = (vehiculeId, interventionData) => {
  return API.post(`/vehicules/${vehiculeId}/interventions`, interventionData).then((res) => res.data?.data ?? res.data);
};

// GET - Récupérer la liste des pièces disponibles
export const getPieces = () => {
  return API.get('/pieces');
};
