import API from './api';
import { getDynamicRecommendations } from './recommendation';

export const getMaintenanceDashboard = async (vehicleId) => {
  const response = await API.get('/maintenance', { params: { vehicleId } });
  return response.data?.data ?? response.data ?? null;
};

export const getMaintenanceRecommendations = async (vehicleId, params = {}) => {
  const response = await getDynamicRecommendations({
    vehicleId,
    sortBy: 'score',
    order: 'desc',
    limit: 6,
    garageLimit: 4,
    ...params,
  });

  return response.data?.data ?? response.data ?? [];
};