const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  getAnalytics,
  createAptitudeQuestion,
  createTechnicalQuestion,
  createResource
} = require('../controllers/adminController');

// All admin routes require admin role
router.use(protect);
router.use(authorize('admin'));

// User management
router.get('/users', getUsers);
router.get('/users/:id', getUser);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

// Analytics
router.get('/analytics', getAnalytics);

// Content management
router.post('/aptitude-questions', createAptitudeQuestion);
router.post('/technical-questions', createTechnicalQuestion);
router.post('/resources', createResource);

module.exports = router;
