import API from './api';

// Admin login
export const adminLogin = (email, password) => {
  return API.post('/admin/login', { email, password });
};

// Get dashboard KPI stats
export const getDashboardStats = () => {
  return API.get('/admin/stats');
};

// Get pending users (requires admin token)
export const getPendingUsers = () => {
  return API.get('/admin/users/pending');
};

// Approve a user
export const approveUser = (userId) => {
  return API.post(`/admin/users/${userId}/approve`);
};

// Reject a user
export const rejectUser = (userId) => {
  return API.post(`/admin/users/${userId}/reject`);
};

// Get pending reports
export const getPendingReports = () => {
  return API.get('/admin/reports/pending');
};

// Get a specific report
export const getReport = (reportId) => {
  return API.get(`/admin/reports/${reportId}`);
};

// Resolve a report
export const resolveReport = (reportId, resolution) => {
  return API.post(`/admin/reports/${reportId}/resolve`, { resolution });
};

// Dismiss a report
export const dismissReport = (reportId) => {
  return API.post(`/admin/reports/${reportId}/dismiss`);
};

// Get all garages
export const getGarages = () => {
  return API.get('/admin/garages');
};

// Deactivate a garage
export const deactivateGarage = (garageId) => {
  return API.post(`/admin/garages/${garageId}/deactivate`);
};

// Delete a garage
export const deleteGarage = (garageId) => {
  return API.delete(`/admin/garages/${garageId}`);
};

// Approve a garage
export const approveGarage = (garageId) => {
  return API.post(`/admin/garages/${garageId}/approve`);
};

// Reject a garage
export const rejectGarage = (garageId) => {
  return API.post(`/admin/garages/${garageId}/reject`);
};

// Get all pieces
export const getPieces = () => {
  return API.get('/admin/pieces');
};

// Delete a piece
export const deletePiece = (pieceId) => {
  return API.delete(`/admin/pieces/${pieceId}`);
};

// Approve a piece
export const approvePiece = (pieceId) => {
  return API.post(`/admin/pieces/${pieceId}/approve`);
};

// Reject a piece
export const rejectPiece = (pieceId) => {
  return API.post(`/admin/pieces/${pieceId}/reject`);
};
