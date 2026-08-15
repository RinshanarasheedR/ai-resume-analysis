const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getStats,
  getProgress,
  getRecommendations
} = require('../controllers/dashboardController');

router.get('/stats', protect, getStats);
router.get('/progress', protect, getProgress);
router.get('/recommendations', protect, getRecommendations);

module.exports = router;
