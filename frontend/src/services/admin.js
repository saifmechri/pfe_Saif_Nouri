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

// Get moderation users (automobiliste/vendeur)
// Fallback to pending endpoint when backend has not yet exposed /users/moderation.
export const getModerationUsers = async () => {
  try {
    return await API.get('/admin/users/moderation');
  } catch (error) {
    if (error?.response?.status === 404) {
      return API.get('/admin/users/pending');
    }
    throw error;
  }
};

// Approve a user
export const approveUser = (userId) => {
  return API.post(`/admin/users/${userId}/approve`);
};

// Reject a user
export const rejectUser = (userId) => {
  return API.post(`/admin/users/${userId}/reject`);
};

// Toggle account block/unblock
export const toggleUserBlock = (userId) => {
  return API.post(`/admin/users/${userId}/toggle-block`);
};

// Get pending reports
export const getPendingReports = () => {
  return API.get('/admin/reports/pending');
};

// Get report summary counters
export const getReportStats = () => {
  return API.get('/admin/reports/stats');
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

// Toggle garage block/unblock
export const toggleGarageBlock = (garageId) => {
  return API.post(`/admin/garages/${garageId}/toggle-block`);
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

// Get audit logs (paginated)
export const getAuditLogs = (params) => {
  return API.get('/admin/audit-logs', { params });
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


