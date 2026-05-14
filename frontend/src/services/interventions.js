/**
 * INTERVENTIONS SERVICE
 * 
 * Manages vehicle maintenance records (interventions/rendez-vous).
 * \n * WHAT IS AN INTERVENTION?\n * An intervention is a record of maintenance work performed on a vehicle.\n * Examples: oil change, inspection, repair, tire rotation, etc.\n * \n * FEATURES:\n * - Create new intervention records\n * - List intervention history for a vehicle\n * - Update intervention details\n * - Track parts used in each intervention\n * - Generate maintenance timeline\n */\n\nimport API from './api';\n\n/**\n * Get all interventions for a vehicle\n * \n * @param {number} vehicleId - Vehicle ID\n * @param {Object} options - Pagination options\n * @returns {Promise} Array of intervention records\n */\nconst listForVehicle = async (vehicleId, { page = 1, limit = 50 } = {}) => {
  const params = { page, limit };
  const res = await API.get(`/vehicules/${vehicleId}/interventions`, { params });
  return res.data?.data || res.data;
};

/**\n * Get specific intervention by ID\n * \n * @param {number} vehicleId - Vehicle ID\n * @param {number} id - Intervention ID\n * @returns {Promise} Intervention details\n */\nconst getById = async (vehicleId, id) => {
  const res = await API.get(`/vehicules/${vehicleId}/interventions/${id}`);
  return res.data?.data || res.data;
};

/**\n * Create new intervention (log maintenance)\n * \n * FIELDS:\n * - date_intervention: Date work done\n * - type: vidange, revision, repair, etc.\n * - garage_nom: Garage name\n * - garage_adresse: Garage address\n * - kilometrage: Km reading\n * - description: Notes\n * - pieces_libres: Parts used (text)\n * \n * @param {number} vehicleId - Vehicle ID\n * @param {Object} payload - Intervention data\n * @returns {Promise} Created intervention\n */\nconst create = async (vehicleId, payload) => {
  const res = await API.post(`/vehicules/${vehicleId}/interventions`, payload);
  return res.data?.data || res.data;
};

/**\n * Update intervention details\n * \n * @param {number} vehicleId - Vehicle ID\n * @param {number} id - Intervention ID\n * @param {Object} payload - Fields to update\n * @returns {Promise} Updated intervention\n */\nconst update = async (vehicleId, id, payload) => {
  const res = await API.patch(`/vehicules/${vehicleId}/interventions/${id}`, payload);
  return res.data?.data || res.data;
};

/**\n * Delete an intervention record\n * \n * @param {number} vehicleId - Vehicle ID\n * @param {number} id - Intervention ID\n * @returns {Promise} Deletion confirmation\n */\nconst remove = async (vehicleId, id) => {
  const res = await API.delete(`/vehicules/${vehicleId}/interventions/${id}`);
  return res.data;
};

/**\n * Add parts used to an intervention\n * \n * @param {number} vehicleId - Vehicle ID\n * @param {number} interventionId - Intervention ID\n * @param {Object} payload - Parts data\n * @returns {Promise} Updated intervention with parts\n */\nconst addPiece = async (vehicleId, interventionId, payload) => {
  const res = await API.post(`/vehicules/${vehicleId}/interventions/${interventionId}/pieces`, payload);
  return res.data?.data || res.data;
};

const removePiece = async (vehicleId, interventionId, pieceId) => {
  const res = await API.delete(`/vehicules/${vehicleId}/interventions/${interventionId}/pieces/${pieceId}`);
  return res.data?.data || res.data;
};

export default {
  listForVehicle,
  getById,
  create,
  update,
  remove,
  addPiece,
  removePiece
};
