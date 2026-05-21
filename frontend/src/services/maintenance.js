import API from './api';

const buildNoCacheParams = (params = {}) => ({
  ...params,
  _: Date.now(),
});

export const getMaintenanceDashboard = async (vehicleId) => {
  const response = await API.get('/maintenance', { params: buildNoCacheParams({ vehicleId }) });
  return response.data?.data ?? response.data ?? null;
};

export const getMaintenanceRecommendations = async (vehicleId, params = {}) => {
  // Dynamic recommendations feature removed — return empty list for compatibility.
  return [];
};

