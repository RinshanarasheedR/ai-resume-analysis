const mongoose = require('../utils/sheetsMongoose');

const atsReportSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  resumeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resume'
  },
  fileName: {
    type: String,
    default: ''
  },
  jobDescription: String,
  jobTitle: String,
  company: String,
  overallScore: {
    type: Number,
    min: 0,
    max: 100
  },
  sections: {
    formatScore: { type: Number, default: 0 },
    keywordScore: { type: Number, default: 0 },
    skillsScore: { type: Number, default: 0 },
    experienceScore: { type: Number, default: 0 },
    educationScore: { type: Number, default: 0 }
  },
  keywords: {
    matched: [String],
    missing: [String],
    suggested: [String]
  },
  skills: {
    matched: [String],
    missing: [String],
    suggested: [String]
  },
  formatIssues: [{
    type: { type: String },
    description: String,
    severity: String
  }],
  suggestions: [{
    category: String,
    suggestion: String,
    priority: String
  }],
  skillGapAnalysis: {
    critical: [String],
    important: [String],
    niceToHave: [String]
  },
  companyUrl: {
    type: String,
    default: ''
  },
  companyAlignment: {
    score: { type: Number, default: 0 },
    explanation: { type: String, default: '' },
    suggestions: [String]
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ATSReport', atsReportSchema);
