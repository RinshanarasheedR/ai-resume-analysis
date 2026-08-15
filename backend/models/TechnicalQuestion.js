const mongoose = require('mongoose');

const technicalQuestionSchema = new mongoose.Schema({
  topic: {
    type: String,
    enum: ['programming', 'sql', 'dbms', 'os', 'cn', 'oop', 'java', 'python', 'javascript', 'mern', 'ai-ml'],
    required: true
  },
  subtopic: String,
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  question: {
    type: String,
    required: true
  },
  questionType: {
    type: String,
    enum: ['mcq', 'coding', 'theoretical'],
    default: 'mcq'
  },
  options: [{
    type: String
  }],
  correctAnswer: {
    type: mongoose.Schema.Types.Mixed // Can be number for MCQ or string/object for coding
  },
  explanation: String,
  codeSnippet: String,
  sampleInput: String,
  sampleOutput: String,
  timeLimit: {
    type: Number,
    default: 120 // seconds
  },
  tags: [String],
  companySpecific: [String], // Companies that ask this question
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('TechnicalQuestion', technicalQuestionSchema);
