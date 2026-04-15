import API from "./api";

export const getPieces = (params = {}) => {
  return API.get("/pieces", { params });
};

export const createPiece = (formData) => {
  return API.post("/pieces", formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });
};
