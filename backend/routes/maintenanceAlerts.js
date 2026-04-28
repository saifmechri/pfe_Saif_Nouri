const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/authMiddleware');
const maintenanceAlertController = require('../controllers/maintenanceAlert.controller');

// List alerts for a vehicle
router.get('/', verifyToken, maintenanceAlertController.listAlerts);

// Create new alert
router.post('/', verifyToken, maintenanceAlertController.createAlert);

// Check due alerts and create notifications
router.post('/check-due', verifyToken, maintenanceAlertController.checkDueAlerts);

// Update alert
router.patch('/:id', verifyToken, maintenanceAlertController.updateAlert);

// Delete alert
router.delete('/:id', verifyToken, maintenanceAlertController.deleteAlert);

module.exports = router;
