const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/authMiddleware');
const { getRecommendations } = require('../controllers/recommendationController');

router.get('/classees', verifyToken, getRecommendations);
router.get('/', verifyToken, getRecommendations);

module.exports = router;
