const TechnicalQuestion = require('../models/TechnicalQuestion');
const Score = require('../models/Score');

// @desc    Get technical questions
// @route   GET /api/technical/questions
// @access  Private
exports.getQuestions = async (req, res, next) => {
  try {
    const { topic, difficulty, questionType, limit } = req.query;

    const filter = { isActive: true };
    if (topic) filter.topic = topic;
    if (difficulty) filter.difficulty = difficulty;
    if (questionType) filter.questionType = questionType;

    const questions = await TechnicalQuestion.find(filter)
      .limit(parseInt(limit) || 10)
      .select('-correctAnswer -explanation');

    res.status(200).json({
      success: true,
      count: questions.length,
      questions
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit technical quiz answers
// @route   POST /api/technical/submit
// @access  Private
exports.submitQuiz = async (req, res, next) => {
  try {
    const { answers, timeTaken } = req.body;

    let correctCount = 0;
    const processedAnswers = [];

    for (const answer of answers) {
      const question = await TechnicalQuestion.findById(answer.questionId);
      if (!question) continue;

      const isCorrect = answer.userAnswer === question.correctAnswer;
      if (isCorrect) correctCount++;

      processedAnswers.push({
        questionId: answer.questionId,
        userAnswer: answer.userAnswer,
        isCorrect,
        timeSpent: answer.timeSpent || 0
      });
    }

    const percentage = Math.round((correctCount / answers.length) * 100);

    // Save score
    const score = await Score.create({
      userId: req.user.id,
      quizType: 'technical',
      category: answers[0]?.topic || 'mixed',
      topic: answers[0]?.subtopic || 'mixed',
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

// @desc    Get technical scores
// @route   GET /api/technical/scores
// @access  Private
exports.getScores = async (req, res, next) => {
  try {
    const scores = await Score.find({
      userId: req.user.id,
      quizType: 'technical'
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

// @desc    Get technical analytics
// @route   GET /api/technical/analytics
// @access  Private
exports.getAnalytics = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Get all technical scores
    const scores = await Score.find({
      userId,
      quizType: 'technical'
    });

    // Calculate average by topic
    const topicStats = {};
    scores.forEach(score => {
      if (!topicStats[score.category]) {
        topicStats[score.category] = { total: 0, count: 0 };
      }
      topicStats[score.category].total += score.percentage;
      topicStats[score.category].count += 1;
    });

    const analytics = Object.entries(topicStats).map(([topic, data]) => ({
      topic,
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
