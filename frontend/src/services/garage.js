import API from "./api";

// Cette section regroupe le CRUD du profil garage.
export const listGarages = (params = {}) => {
  return API.get("/garages", { params });
};

export const getGarageById = (garageId) => {
  return API.get(`/garages/${garageId}`);
};

export const getMyGarage = () => {
  return API.get("/garages/me");
};

export const createGarage = (garageData) => {
  return API.post("/garages", garageData);
};

export const updateGarage = (garageId, garageData) => {
  return API.put(`/garages/${garageId}`, garageData);
};

export const uploadGaragePhotos = (files = []) => {
  const formData = new FormData();
  files.forEach((file) => formData.append('photos', file));

  return API.post('/garages/photos/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};

export const deleteGarage = (garageId) => {
  return API.delete(`/garages/${garageId}`);
};

// Cette section gère les services proposés par un garage.
export const getServicesByGarage = (garageId, params = {}) => {
  return API.get(`/garages/${garageId}/services`, { params });
};

export const getMyGarageServices = () => {
  return API.get("/garages/me/services");
};

export const createGarageService = (garageId, serviceData) => {
  return API.post(`/garages/${garageId}/services`, serviceData);
};

export const updateGarageService = (garageId, serviceId, serviceData) => {
  return API.put(`/garages/${garageId}/services/${serviceId}`, serviceData);
};

export const deleteGarageService = (garageId, serviceId) => {
  return API.delete(`/garages/${garageId}/services/${serviceId}`);
};

// Cette section couvre les avis clients pour un garage.
export const getReviewsByGarage = (garageId, params = {}) => {
  return API.get(`/garages/${garageId}/reviews`, { params });
};

export const getMyGarageReviews = (params = {}) => {
  return API.get("/garages/me/reviews", { params });
};

export const createGarageReview = (garageId, reviewData) => {
  return API.post(`/garages/${garageId}/reviews`, reviewData);
};

export const updateGarageReview = (garageId, reviewId, reviewData) => {
  return API.put(`/garages/${garageId}/reviews/${reviewId}`, reviewData);
};

export const deleteGarageReview = (garageId, reviewId) => {
  return API.delete(`/garages/${garageId}/reviews/${reviewId}`);
};


// Cette section gère les options de filtres disponibles
export const getFilterOptions = () => {
  return API.get('/garages/filter-options');
};


