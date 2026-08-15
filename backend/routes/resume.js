const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createResume,
  getResumes,
  getResume,
  updateResume,
  deleteResume,
  generateAIContent
} = require('../controllers/resumeController');

router.post('/create', protect, createResume);
router.get('/list', protect, getResumes);
router.get('/:id', protect, getResume);
router.put('/:id', protect, updateResume);
router.delete('/:id', protect, deleteResume);
router.post('/generate-ai', protect, generateAIContent);

module.exports = router;
