import API from './api';
import { getMatchingGarages } from './alerts';

const buildNoCacheParams = (params = {}) => ({
  ...params,
  _: Date.now(),
});

export const getMaintenanceDashboard = async (vehicleId) => {
  const response = await API.get('/maintenance', { params: buildNoCacheParams({ vehicleId }) });
  return response.data?.data ?? response.data ?? null;
};

export const getMaintenanceRecommendations = async (vehicleId, params = {}) => {
  const maxDistance = Number(params.maxDistance ?? 50);
  return getMatchingGarages(vehicleId, maxDistance);
};

