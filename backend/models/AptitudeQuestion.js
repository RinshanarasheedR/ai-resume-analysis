const mongoose = require('mongoose');

const aptitudeQuestionSchema = new mongoose.Schema({
  category: {
    type: String,
    enum: ['quantitative', 'logical', 'verbal', 'data-interpretation'],
    required: true
  },
  topic: {
    type: String,
    required: true
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  question: {
    type: String,
    required: true
  },
  options: [{
    type: String,
    required: true
  }],
  correctAnswer: {
    type: Number,
    required: true
  },
  explanation: String,
  timeLimit: {
    type: Number,
    default: 60 // seconds
  },
  tags: [String],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('AptitudeQuestion', aptitudeQuestionSchema);
