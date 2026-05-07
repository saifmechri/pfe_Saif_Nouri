const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');
const { verifyToken } = require('../middlewares/authMiddleware');

// Public report submission endpoint (users can report garages, reviews, etc.)
router.post('/', verifyToken, reportController.createReport);

module.exports = router;
