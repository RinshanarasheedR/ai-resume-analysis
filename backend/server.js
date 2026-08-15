const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const dashboardRoutes = require('./routes/dashboard');
const resumeRoutes = require('./routes/resume');
const atsRoutes = require('./routes/ats');
const aptitudeRoutes = require('./routes/aptitude');
const technicalRoutes = require('./routes/technical');
const mockInterviewRoutes = require('./routes/mockInterview');
const resourceRoutes = require('./routes/resource');
const adminRoutes = require('./routes/admin');

// Initialize app
const app = express();

// Security middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/uploads', express.static('uploads'));

// Database connection
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/interview-portal';
mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB Connected'))
.catch(err => console.error('MongoDB Connection Error:', err));

// Set fallback for environment variables
if (!process.env.JWT_SECRET) {
  console.warn('Warning: JWT_SECRET not set in environment variables. Using default for development.');
  process.env.JWT_SECRET = 'dev-secret-key-change-in-production';
}

if (!process.env.JWT_EXPIRE) {
  console.warn('Warning: JWT_EXPIRE not set in environment variables. Using default: 7d');
  process.env.JWT_EXPIRE = '7d';
}

if (!process.env.PYTHON_SERVICE_URL) {
  console.warn('Warning: PYTHON_SERVICE_URL not set in environment variables. Using default: http://localhost:8000');
  process.env.PYTHON_SERVICE_URL = 'http://localhost:8000';
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/resume', resumeRoutes);
app.use('/api/ats', atsRoutes);
app.use('/api/aptitude', aptitudeRoutes);
app.use('/api/technical', technicalRoutes);
app.use('/api/mock-interview', mockInterviewRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`MongoDB URI: ${mongoUri}`);
});

module.exports = app;
