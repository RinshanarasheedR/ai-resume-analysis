const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect } = require('../middleware/auth');
const {
  analyzeResume,
  getReports,
  getReport,
  uploadAndAnalyze
} = require('../controllers/atsController');

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF and DOCX files are allowed.'), false);
    }
  }
});

router.post('/analyze', protect, analyzeResume);
router.get('/reports', protect, getReports);
router.get('/reports/:id', protect, getReport);
router.post('/upload', protect, upload.single('file'), uploadAndAnalyze);

module.exports = router;
