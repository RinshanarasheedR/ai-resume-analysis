const Resume = require('../models/Resume');
const axios = require('axios');

// @desc    Create new resume
// @route   POST /api/resume/create
// @access  Private
exports.createResume = async (req, res, next) => {
  try {
    const { title, template, content } = req.body;

    const resume = await Resume.create({
      userId: req.user.id,
      title,
      template: template || 'modern',
      content
    });

    res.status(201).json({
      success: true,
      resume
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all user resumes
// @route   GET /api/resume/list
// @access  Private
exports.getResumes = async (req, res, next) => {
  try {
    const resumes = await Resume.find({ userId: req.user.id })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: resumes.length,
      resumes
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single resume
// @route   GET /api/resume/:id
// @access  Private
exports.getResume = async (req, res, next) => {
  try {
    const resume = await Resume.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found'
      });
    }

    res.status(200).json({
      success: true,
      resume
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update resume
// @route   PUT /api/resume/:id
// @access  Private
exports.updateResume = async (req, res, next) => {
  try {
    const { title, template, content } = req.body;

    let resume = await Resume.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found'
      });
    }

    if (title) resume.title = title;
    if (template) resume.template = template;
    if (content) resume.content = content;

    await resume.save();

    res.status(200).json({
      success: true,
      resume
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete resume
// @route   DELETE /api/resume/:id
// @access  Private
exports.deleteResume = async (req, res, next) => {
  try {
    const resume = await Resume.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Resume deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Generate AI resume content
// @route   POST /api/resume/generate-ai
// @access  Private
exports.generateAIContent = async (req, res, next) => {
  try {
    const { education, skills, projects, certifications, careerObjective } = req.body;

    // Call Python service for AI generation
    let response;
    try {
      response = await axios.post(
        `${process.env.PYTHON_SERVICE_URL}/api/ai/generate-resume`,
        {
          education,
          skills,
          projects,
          certifications,
          careerObjective
        },
        { timeout: 30000 }
      );
    } catch (pythonError) {
      console.warn('Python service unavailable for AI resume generation:', pythonError.message);
      return res.status(503).json({
        success: false,
        message: 'AI resume generation service is currently unavailable. Please try again later or fill in the resume manually.'
      });
    }

    const generatedContent = response.data.content;

    // Auto-save the generated resume
    const resume = await Resume.create({
      userId: req.user.id,
      title: `AI Generated Resume - ${new Date().toLocaleDateString()}`,
      template: 'modern',
      content: generatedContent
    });

    res.status(200).json({
      success: true,
      content: generatedContent,
      resumeId: resume._id
    });
  } catch (error) {
    next(error);
  }
};

