const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const reportController = require('../controllers/report.controller');
const { verifyAdminToken } = require('../middlewares/adminAuthMiddleware');

// Public admin login route: only the predefined admin can authenticate here.
router.post('/login', adminController.login);

// Protected validation routes for user accounts.
router.get('/users/pending', verifyAdminToken, adminController.listPendingUsers);
router.post('/users/:id/approve', verifyAdminToken, adminController.approveUser);
router.post('/users/:id/reject', verifyAdminToken, adminController.rejectUser);

// Protected moderation routes for reports.
router.get('/reports/pending', verifyAdminToken, reportController.listPendingReports);
router.get('/reports/:id', verifyAdminToken, reportController.getReport);
router.post('/reports/:id/resolve', verifyAdminToken, reportController.resolveReport);
router.post('/reports/:id/dismiss', verifyAdminToken, reportController.dismissReport);

module.exports = router;
