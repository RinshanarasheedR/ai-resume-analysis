const mongoose = require('mongoose');

const mockInterviewSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  resumeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resume'
  },
  interviewType: {
    type: String,
    enum: ['hr', 'technical', 'mixed'],
    required: true
  },
  jobRole: String,
  company: String,
  status: {
    type: String,
    enum: ['in-progress', 'completed', 'abandoned'],
    default: 'in-progress'
  },
  chatHistory: [{
    role: {
      type: String,
      enum: ['user', 'ai']
    },
    message: String,
    timestamp: Date,
    audioTranscript: String
  }],
  evaluation: {
    overallScore: Number,
    confidenceScore: Number,
    communicationScore: Number,
    technicalScore: Number,
    clarityScore: Number,
    relevanceScore: Number,
    strengths: [String],
    weaknesses: [String],
    feedback: String,
    improvementSuggestions: [String]
  },
  duration: Number, // in seconds
  questionCount: Number,
  mode: {
    type: String,
    enum: ['text', 'voice'],
    default: 'text'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('MockInterview', mockInterviewSchema);
