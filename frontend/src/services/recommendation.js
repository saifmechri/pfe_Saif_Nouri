import API from "./api";

export const getDynamicRecommendations = (params = {}) => {
  return API.get("/recommendations/classees", { params });
};

export const getGarageServicesById = (garageId, params = {}) => {
  return API.get(`/garages/${garageId}/services`, { params });
};
