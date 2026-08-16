const mongoose = require('../utils/sheetsMongoose');

const scoreSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  quizType: {
    type: String,
    enum: ['aptitude', 'technical'],
    required: true
  },
  category: String,
  topic: String,
  difficulty: String,
  totalQuestions: Number,
  correctAnswers: Number,
  score: Number,
  percentage: Number,
  timeTaken: Number, // in seconds
  answers: [{
    questionId: mongoose.Schema.Types.ObjectId,
    userAnswer: mongoose.Schema.Types.Mixed,
    isCorrect: Boolean,
    timeSpent: Number
  }],
  completedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient queries
scoreSchema.index({ userId: 1, quizType: 1, completedAt: -1 });

module.exports = mongoose.model('Score', scoreSchema);
