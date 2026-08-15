const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getQuestions,
  submitQuiz,
  getScores,
  getAnalytics
} = require('../controllers/technicalController');

router.get('/questions', protect, getQuestions);
router.post('/submit', protect, submitQuiz);
router.get('/scores', protect, getScores);
router.get('/analytics', protect, getAnalytics);

module.exports = router;
