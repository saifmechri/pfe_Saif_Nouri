const express = require('express');
const router = express.Router();
const publicController = require('../controllers/publicController');

// Public stats for landing page
router.get('/stats', publicController.getPublicStats);

module.exports = router;
