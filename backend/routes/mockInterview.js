const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  startInterview,
  chat,
  evaluate,
  getHistory,
  getInterview
} = require('../controllers/mockInterviewController');

router.post('/start', protect, startInterview);
router.post('/chat', protect, chat);
router.post('/evaluate', protect, evaluate);
router.get('/history', protect, getHistory);
router.get('/:id', protect, getInterview);

module.exports = router;
