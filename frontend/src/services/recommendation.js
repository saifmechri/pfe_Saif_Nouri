import API from "./api";

export const getDynamicRecommendations = (params = {}) => {
  return API.get("/recommendations/classees", { params });
};
