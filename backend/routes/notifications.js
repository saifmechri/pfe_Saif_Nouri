const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/authMiddleware');
const notificationController = require('../controllers/notification.controller');

// Get notifications for current user
router.get('/', verifyToken, notificationController.listNotifications);

// Create notification (protected)
router.post('/', verifyToken, notificationController.createNotification);

// Mark single notification as read
router.patch('/:id/read', verifyToken, notificationController.markAsRead);

// Mark all as read for current user
router.patch('/read-all', verifyToken, notificationController.markAll);

// Delete notification
router.delete('/:id', verifyToken, notificationController.removeNotification);

module.exports = router;
