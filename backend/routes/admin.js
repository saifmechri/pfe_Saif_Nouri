const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const reportController = require('../controllers/report.controller');
const { verifyAdminToken } = require('../middlewares/adminAuthMiddleware');

// Public admin login route: only the predefined admin can authenticate here.
router.post('/login', adminController.login);

// Dashboard KPI stats for admin.
router.get('/stats', verifyAdminToken, adminController.getDashboardStats);

// Protected validation routes for user accounts.
router.get('/users/pending', verifyAdminToken, adminController.listPendingUsers);
router.get('/users/moderation', verifyAdminToken, adminController.listModerationUsers);
router.post('/users/:id/approve', verifyAdminToken, adminController.approveUser);
router.post('/users/:id/reject', verifyAdminToken, adminController.rejectUser);
router.post('/users/:id/toggle-block', verifyAdminToken, adminController.toggleUserBlock);

// Protected moderation routes for reports.
router.get('/reports/pending', verifyAdminToken, reportController.listPendingReports);
router.get('/reports/stats', verifyAdminToken, reportController.getReportStats);
router.get('/reports/:id', verifyAdminToken, reportController.getReport);
router.post('/reports/:id/resolve', verifyAdminToken, reportController.resolveReport);
router.post('/reports/:id/dismiss', verifyAdminToken, reportController.dismissReport);

// Protected routes for garage management
router.get('/garages', verifyAdminToken, adminController.listGarages);
router.get('/audit-logs', verifyAdminToken, adminController.listAuditLogs);
router.post('/garages/:id/deactivate', verifyAdminToken, adminController.deactivateGarage);
router.post('/garages/:id/toggle-block', verifyAdminToken, adminController.toggleGarageBlock);
router.delete('/garages/:id', verifyAdminToken, adminController.deleteGarageAdmin);
router.post('/garages/:id/approve', verifyAdminToken, adminController.approveGarage);
router.post('/garages/:id/reject', verifyAdminToken, adminController.rejectGarage);

// Protected routes for piece management
router.get('/pieces', verifyAdminToken, adminController.listPieces);
router.delete('/pieces/:id', verifyAdminToken, adminController.deletePieceAdmin);
router.post('/pieces/:id/approve', verifyAdminToken, adminController.approvePiece);
router.post('/pieces/:id/reject', verifyAdminToken, adminController.rejectPiece);

module.exports = router;


