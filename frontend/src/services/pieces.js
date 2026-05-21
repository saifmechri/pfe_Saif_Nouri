import API from "./api";

export const getPieces = (params = {}) => {
  return API.get("/pieces", { params });
};

export const getMyPieces = (params = {}) => {
  return API.get("/pieces/me", { params });
};

export const getPieceById = (pieceId) => {
  return API.get(`/pieces/${pieceId}`);
};

export const createPiece = (formData) => {
  return API.post("/pieces", formData);
};

export const updatePiece = (pieceId, pieceData) => {
  return API.put(`/pieces/${pieceId}`, pieceData);
};

export const deletePiece = (pieceId) => {
  return API.delete(`/pieces/${pieceId}`);
};

export const comparePieceAcrossVendors = (params = {}) => {
  return API.get("/pieces/compare/vendors", { params });
};

export const getPieceSellerLocations = (params = {}) => {
  return API.get("/pieces/seller-locations", { params });
};

export const setPieceStock = (pieceId, data = {}) => {
  return API.put(`/pieces/${pieceId}/stock`, data);
};


