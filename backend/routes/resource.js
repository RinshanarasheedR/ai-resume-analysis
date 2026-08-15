const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getResources,
  getResource,
  getRoadmaps,
  likeResource,
  generateResourceContent
} = require('../controllers/resourceController');

router.get('/', protect, getResources);
router.get('/roadmaps', protect, getRoadmaps);
router.get('/:id', protect, getResource);
router.post('/:id/like', protect, likeResource);
router.post('/:id/generate', protect, generateResourceContent);

module.exports = router;
