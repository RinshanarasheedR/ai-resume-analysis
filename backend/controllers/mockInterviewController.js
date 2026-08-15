const MockInterview = require('../models/MockInterview');
const Resume = require('../models/Resume');
const axios = require('axios');

// @desc    Start a mock interview
// @route   POST /api/mock-interview/start
// @access  Private
exports.startInterview = async (req, res, next) => {
  try {
    const { interviewType, resumeId, jobRole, company, mode } = req.body;

    // Get resume if provided
    let resumeContent = null;
    if (resumeId) {
      const resume = await Resume.findOne({
        _id: resumeId,
        userId: req.user.id
      });
      if (resume) {
        resumeContent = resume.content;
      }
    }

    // Call Python service to get first question
    const response = await axios.post(
      `${process.env.PYTHON_SERVICE_URL}/api/ai/chat-interview`,
      {
        interviewType,
        jobRole,
        company,
        resumeContent,
        isFirstQuestion: true
      }
    );

    // Create interview session
    const interview = await MockInterview.create({
      userId: req.user.id,
      resumeId,
      interviewType,
      jobRole,
      company,
      mode: mode || 'text',
      chatHistory: [
        {
          role: 'ai',
          message: response.data.message,
          timestamp: new Date()
        }
      ]
    });

    res.status(201).json({
      success: true,
      interview,
      firstQuestion: response.data.message
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Chat with AI interviewer
// @route   POST /api/mock-interview/chat
// @access  Private
exports.chat = async (req, res, next) => {
  try {
    const { interviewId, message } = req.body;

    const interview = await MockInterview.findOne({
      _id: interviewId,
      userId: req.user.id
    });

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found'
      });
    }

    // Add user message to history
    interview.chatHistory.push({
      role: 'user',
      message,
      timestamp: new Date()
    });

    // Call Python service for AI response
    const response = await axios.post(
      `${process.env.PYTHON_SERVICE_URL}/api/ai/chat-interview`,
      {
        interviewType: interview.interviewType,
        jobRole: interview.jobRole,
        company: interview.company,
        chatHistory: interview.chatHistory,
        isFirstQuestion: false
      }
    );

    // Add AI response to history
    interview.chatHistory.push({
      role: 'ai',
      message: response.data.message,
      timestamp: new Date()
    });

    interview.questionCount = interview.chatHistory.filter(
      msg => msg.role === 'ai'
    ).length;

    await interview.save();

    res.status(200).json({
      success: true,
      response: response.data.message,
      interview
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Evaluate interview and end session
// @route   POST /api/mock-interview/evaluate
// @access  Private
exports.evaluate = async (req, res, next) => {
  try {
    const { interviewId } = req.body;

    const interview = await MockInterview.findOne({
      _id: interviewId,
      userId: req.user.id
    });

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found'
      });
    }

    // Calculate duration
    interview.duration = Math.floor(
      (new Date() - interview.createdAt) / 1000
    );

    // Call Python service for evaluation
    const response = await axios.post(
      `${process.env.PYTHON_SERVICE_URL}/api/ai/evaluate-interview`,
      {
        chatHistory: interview.chatHistory,
        interviewType: interview.interviewType
      }
    );

    interview.evaluation = response.data.evaluation;
    interview.status = 'completed';
    await interview.save();

    res.status(200).json({
      success: true,
      interview
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get interview history
// @route   GET /api/mock-interview/history
// @access  Private
exports.getHistory = async (req, res, next) => {
  try {
    const interviews = await MockInterview.find({ userId: req.user.id })
      .populate('resumeId', 'title')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: interviews.length,
      interviews
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single interview
// @route   GET /api/mock-interview/:id
// @access  Private
exports.getInterview = async (req, res, next) => {
  try {
    const interview = await MockInterview.findOne({
      _id: req.params.id,
      userId: req.user.id
    }).populate('resumeId');

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found'
      });
    }

    res.status(200).json({
      success: true,
      interview
    });
  } catch (error) {
    next(error);
  }
};
