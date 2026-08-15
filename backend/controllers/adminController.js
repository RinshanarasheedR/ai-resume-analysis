const User = require('../models/User');
const AptitudeQuestion = require('../models/AptitudeQuestion');
const TechnicalQuestion = require('../models/TechnicalQuestion');
const LearningResource = require('../models/LearningResource');
const Score = require('../models/Score');
const MockInterview = require('../models/MockInterview');

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
exports.getUsers = async (req, res, next) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single user
// @route   GET /api/admin/users/:id
// @access  Private/Admin
exports.getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user
// @route   PUT /api/admin/users/:id
// @access  Private/Admin
exports.updateUser = async (req, res, next) => {
  try {
    const { name, email, role, isActive } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;
    if (isActive !== undefined) user.isActive = isActive;

    await user.save();

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get admin analytics
// @route   GET /api/admin/analytics
// @access  Private/Admin
exports.getAnalytics = async (req, res, next) => {
  try {
    const userCount = await User.countDocuments();
    const aptitudeQuestionCount = await AptitudeQuestion.countDocuments();
    const technicalQuestionCount = await TechnicalQuestion.countDocuments();
    const resourceCount = await LearningResource.countDocuments();
    const scoreCount = await Score.countDocuments();
    const interviewCount = await MockInterview.countDocuments();

    // Get recent activity
    const recentScores = await Score.find()
      .populate('userId', 'name email')
      .sort({ completedAt: -1 })
      .limit(10);

    const recentInterviews = await MockInterview.find()
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      analytics: {
        userCount,
        aptitudeQuestionCount,
        technicalQuestionCount,
        resourceCount,
        scoreCount,
        interviewCount
      },
      recentActivity: {
        recentScores,
        recentInterviews
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create aptitude question
// @route   POST /api/admin/aptitude-questions
// @access  Private/Admin
exports.createAptitudeQuestion = async (req, res, next) => {
  try {
    const question = await AptitudeQuestion.create(req.body);

    res.status(201).json({
      success: true,
      question
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create technical question
// @route   POST /api/admin/technical-questions
// @access  Private/Admin
exports.createTechnicalQuestion = async (req, res, next) => {
  try {
    const question = await TechnicalQuestion.create(req.body);

    res.status(201).json({
      success: true,
      question
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create learning resource
// @route   POST /api/admin/resources
// @access  Private/Admin
exports.createResource = async (req, res, next) => {
  try {
    const resource = await LearningResource.create({
      ...req.body,
      createdBy: req.user.id
    });

    res.status(201).json({
      success: true,
      resource
    });
  } catch (error) {
    next(error);
  }
};
