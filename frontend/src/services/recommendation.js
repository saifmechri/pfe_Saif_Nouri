import API from "./api";

export const getDynamicRecommendations = (params = {}) => {
  return API.get("/recommandations/classees", { params });
};
