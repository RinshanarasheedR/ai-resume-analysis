const mongoose = require('../utils/sheetsMongoose');

const learningResourceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['roadmap', 'note', 'tip', 'faq', 'company-specific'],
    required: true
  },
  category: String,
  topic: String,
  content: String,
  url: String,
  company: String, // For company-specific resources
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced']
  },
  tags: [String],
  order: Number,
  relatedResources: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LearningResource'
  }],
  views: {
    type: Number,
    default: 0
  },
  likes: {
    type: Number,
    default: 0
  },
  likedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('LearningResource', learningResourceSchema);
