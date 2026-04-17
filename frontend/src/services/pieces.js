import API from "./api";

export const getPieces = (params = {}) => {
  return API.get("/pieces", { params });
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
