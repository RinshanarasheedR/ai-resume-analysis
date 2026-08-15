const LearningResource = require('../models/LearningResource');

// @desc    Get all learning resources
// @route   GET /api/resources
// @access  Private
exports.getResources = async (req, res, next) => {
  try {
    const { type, category, topic, difficulty } = req.query;

    const filter = { isActive: true };
    if (type) filter.type = type;
    if (category) filter.category = category;
    if (topic) filter.topic = topic;
    if (difficulty) filter.difficulty = difficulty;

    const resources = await LearningResource.find(filter)
      .sort({ order: 1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: resources.length,
      resources
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single resource
// @route   GET /api/resources/:id
// @access  Private
exports.getResource = async (req, res, next) => {
  try {
    const resource = await LearningResource.findById(req.params.id);

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found'
      });
    }

    // Increment view count
    resource.views += 1;
    await resource.save();

    res.status(200).json({
      success: true,
      resource
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get roadmaps
// @route   GET /api/resources/roadmaps
// @access  Private
exports.getRoadmaps = async (req, res, next) => {
  try {
    const roadmaps = await LearningResource.find({
      type: 'roadmap',
      isActive: true
    }).sort({ order: 1 });

    res.status(200).json({
      success: true,
      count: roadmaps.length,
      roadmaps
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Like a resource
// @route   POST /api/resources/:id/like
// @access  Private
exports.likeResource = async (req, res, next) => {
  try {
    const resource = await LearningResource.findById(req.params.id);

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found'
      });
    }

    const alreadyLiked = resource.likedBy.includes(req.user.id);

    if (alreadyLiked) {
      resource.likedBy = resource.likedBy.filter(
        id => id.toString() !== req.user.id.toString()
      );
      resource.likes -= 1;
    } else {
      resource.likedBy.push(req.user.id);
      resource.likes += 1;
    }

    await resource.save();

    res.status(200).json({
      success: true,
      liked: !alreadyLiked,
      likes: resource.likes
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Generate detailed AI content for a resource
// @route   POST /api/resources/:id/generate
// @access  Private
exports.generateResourceContent = async (req, res, next) => {
  try {
    const resource = await LearningResource.findById(req.params.id);

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found'
      });
    }

    const axios = require('axios');
    const response = await axios.post(
      `${process.env.PYTHON_SERVICE_URL}/api/ai/generate-learning-content`,
      {
        title: resource.title,
        type: resource.type,
        category: resource.category || '',
        topic: resource.topic || ''
      }
    );

    const generatedContent = response.data.content;
    resource.content = generatedContent;
    await resource.save();

    res.status(200).json({
      success: true,
      content: generatedContent,
      resource
    });
  } catch (error) {
    next(error);
  }
};
