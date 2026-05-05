const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyAdminToken } = require('../middlewares/adminAuthMiddleware');

// Public admin login (no registration)
router.post('/login', adminController.login);

// Protected admin operations
router.get('/users/pending', verifyAdminToken, adminController.listPendingUsers);
router.post('/users/:id/approve', verifyAdminToken, adminController.approveUser);
router.post('/users/:id/reject', verifyAdminToken, adminController.rejectUser);

module.exports = router;
