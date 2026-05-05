const express = require('express');
const { param } = require('express-validator');
const router = express.Router({ mergeParams: true });
const { verifyToken } = require('../middlewares/authMiddleware');
const { validateRequest } = require('../middlewares/validateRequest');
const maintenanceController = require('../controllers/maintenance.controller');

const vehicleIdParam = param('vehicleId').isInt({ gt: 0 }).withMessage('vehicleId invalide');

// GET - Calculate next revision for a vehicle
router.get('/:vehicleId/next-revision', vehicleIdParam, validateRequest, verifyToken, maintenanceController.getNextRevision);

module.exports = router;
