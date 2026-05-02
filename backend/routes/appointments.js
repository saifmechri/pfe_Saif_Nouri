const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/authMiddleware');
const appointmentController = require('../controllers/appointment.controller');

// List appointments for current user
router.get('/', verifyToken, appointmentController.listAppointments);

// Create new appointment
router.post('/', verifyToken, appointmentController.createAppointment);

// Update appointment
router.patch('/:id', verifyToken, appointmentController.updateAppointment);

// Delete appointment
router.delete('/:id', verifyToken, appointmentController.deleteAppointment);

module.exports = router;
