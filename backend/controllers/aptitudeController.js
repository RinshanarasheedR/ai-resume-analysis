const AptitudeQuestion = require('../models/AptitudeQuestion');
const Score = require('../models/Score');
const axios = require('axios');

// @desc    Get aptitude questions
// @route   GET /api/aptitude/questions
// @access  Private
exports.getQuestions = async (req, res, next) => {
  try {
    const { category, topic, difficulty, limit } = req.query;

    // Call Python microservice to generate questions
    const pythonServiceUrl = process.env.PYTHON_SERVICE_URL || 'http://127.0.0.1:8000';
    
    try {
      const response = await axios.post(`${pythonServiceUrl}/api/ai/generate-aptitude`, {
        category: category || 'general',
        difficulty: difficulty || 'medium',
        limit: parseInt(limit) || 10
      }, { timeout: 15000 });
      
      if (response.data.success && response.data.questions) {
        return res.status(200).json({
          success: true,
          count: response.data.questions.length,
          questions: response.data.questions
        });
      }
    } catch (pythonError) {
      console.warn('Python service unavailable, serving questions from database:', pythonError.message);
      const filter = { isActive: true };
      if (category) filter.category = category;
      if (difficulty) filter.difficulty = difficulty;

      const questions = await AptitudeQuestion.find(filter)
        .limit(parseInt(limit) || 10)
        .select('-correctAnswer -explanation');

      return res.status(200).json({
        success: true,
        count: questions.length,
        questions
      });
    }

  } catch (error) {
    next(error);
  }
};

// @desc    Submit quiz answers
// @route   POST /api/aptitude/submit
// @access  Private
exports.submitQuiz = async (req, res, next) => {
  try {
    const { answers, timeTaken } = req.body;

    let correctCount = 0;
    const processedAnswers = [];

    for (const answer of answers) {
      // answer now directly provides whether it was correct (evaluated by frontend)
      const isCorrect = answer.isCorrect === true;
      if (isCorrect) correctCount++;

      processedAnswers.push({
        questionId: answer.question || 'ai-generated',
        userAnswer: answer.userAnswer,
        isCorrect,
        timeSpent: answer.timeSpent || 0
      });
    }

    const percentage = Math.round((correctCount / answers.length) * 100);

    // Save score
    const score = await Score.create({
      userId: req.user.id,
      quizType: 'aptitude',
      category: answers[0]?.category || 'mixed',
      topic: answers[0]?.topic || 'mixed',
      difficulty: answers[0]?.difficulty || 'mixed',
      totalQuestions: answers.length,
      correctAnswers: correctCount,
      score: correctCount,
      percentage,
      timeTaken,
      answers: processedAnswers
    });

    res.status(200).json({
      success: true,
      score,
      correctCount,
      totalQuestions: answers.length,
      percentage
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get aptitude scores
// @route   GET /api/aptitude/scores
// @access  Private
exports.getScores = async (req, res, next) => {
  try {
    const scores = await Score.find({
      userId: req.user.id,
      quizType: 'aptitude'
    }).sort({ completedAt: -1 });

    res.status(200).json({
      success: true,
      count: scores.length,
      scores
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get aptitude analytics
// @route   GET /api/aptitude/analytics
// @access  Private
exports.getAnalytics = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Get all aptitude scores
    const scores = await Score.find({
      userId,
      quizType: 'aptitude'
    });

    // Calculate average by category
    const categoryStats = {};
    scores.forEach(score => {
      if (!categoryStats[score.category]) {
        categoryStats[score.category] = { total: 0, count: 0 };
      }
      categoryStats[score.category].total += score.percentage;
      categoryStats[score.category].count += 1;
    });

    const analytics = Object.entries(categoryStats).map(([category, data]) => ({
      category,
      averageScore: Math.round(data.total / data.count),
      quizCount: data.count
    }));

    // Overall average
    const overallAverage = scores.length > 0
      ? Math.round(scores.reduce((sum, s) => sum + s.percentage, 0) / scores.length)
      : 0;

    res.status(200).json({
      success: true,
      analytics,
      overallAverage,
      totalQuizzes: scores.length
    });
  } catch (error) {
    next(error);
  }
};
