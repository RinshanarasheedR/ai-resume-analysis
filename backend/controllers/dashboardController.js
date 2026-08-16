const Resume = require('../models/Resume');
const ATSReport = require('../models/ATSReport');
const Score = require('../models/Score');
const MockInterview = require('../models/MockInterview');

// @desc    Get dashboard statistics
// @route   GET /api/dashboard/stats
// @access  Private
exports.getStats = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Get counts
    const resumeCount = await Resume.countDocuments({ userId });
    const atsReportCount = await ATSReport.countDocuments({ userId });
    const aptitudeScoreCount = await Score.countDocuments({ userId, quizType: 'aptitude' });
    const technicalScoreCount = await Score.countDocuments({ userId, quizType: 'technical' });
    const interviewCount = await MockInterview.countDocuments({ userId });

    // Get latest scores
    const latestAptitudeScore = await Score.findOne({ userId, quizType: 'aptitude' })
      .sort({ completedAt: -1 });
    const latestTechnicalScore = await Score.findOne({ userId, quizType: 'technical' })
      .sort({ completedAt: -1 });
    const latestInterview = await MockInterview.findOne({ userId })
      .sort({ createdAt: -1 });

    // Get average ATS score
    const atsReports = await ATSReport.find({ userId });
    const avgAtsScore = atsReports.length > 0
      ? atsReports.reduce((sum, report) => sum + report.overallScore, 0) / atsReports.length
      : 0;

    res.status(200).json({
      success: true,
      stats: {
        resumeCount,
        atsReportCount,
        aptitudeScoreCount,
        technicalScoreCount,
        interviewCount,
        avgAtsScore: Math.round(avgAtsScore),
        latestAptitudeScore: latestAptitudeScore?.percentage || 0,
        latestTechnicalScore: latestTechnicalScore?.percentage || 0,
        latestInterviewScore: latestInterview?.evaluation?.overallScore || 0
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get preparation progress
// @route   GET /api/dashboard/progress
// @access  Private
exports.getProgress = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const days = 7; // Last 7 days

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get scores in the last 7 days
    const scores = await Score.find({
      userId,
      completedAt: { $gte: startDate }
    }).sort({ completedAt: 1 });

    // Get interviews in the last 7 days
    const interviews = await MockInterview.find({
      userId,
      createdAt: { $gte: startDate }
    }).sort({ createdAt: 1 });

    // Group by date
    const progressData = [];
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const dayScores = scores.filter(s => 
        new Date(s.completedAt).toISOString().split('T')[0] === dateStr
      );
      const dayInterviews = interviews.filter(int => 
        new Date(int.createdAt).toISOString().split('T')[0] === dateStr
      );

      progressData.push({
        date: dateStr,
        quizzesCompleted: dayScores.length,
        interviewsCompleted: dayInterviews.length,
        avgScore: dayScores.length > 0 
          ? dayScores.reduce((sum, s) => sum + s.percentage, 0) / dayScores.length 
          : 0
      });
    }

    res.status(200).json({
      success: true,
      progress: progressData.reverse()
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get learning recommendations
// @route   GET /api/dashboard/recommendations
// @access  Private
exports.getRecommendations = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Get user's recent performance
    const recentScores = await Score.find({ userId })
      .sort({ completedAt: -1 })
      .limit(10);

    // Analyze weak areas
    const topicPerformance = {};
    recentScores.forEach(score => {
      if (!topicPerformance[score.topic]) {
        topicPerformance[score.topic] = { total: 0, count: 0 };
      }
      topicPerformance[score.topic].total += score.percentage;
      topicPerformance[score.topic].count += 1;
    });

    const weakAreas = Object.entries(topicPerformance)
      .filter(([_, data]) => data.total / data.count < 60)
      .map(([topic, _]) => topic);

    // Generate recommendations
    const recommendations = [
      {
        type: 'practice',
        title: 'Focus on weak areas',
        description: weakAreas.length > 0 
          ? `Practice more in: ${weakAreas.join(', ')}`
          : 'Continue your current learning path',
        priority: 'high'
      },
      {
        type: 'interview',
        title: 'Take a mock interview',
        description: 'Practice your communication skills with AI mock interviews',
        priority: 'medium'
      },
      {
        type: 'resume',
        title: 'Optimize your resume',
        description: 'Use the ATS checker to improve your resume compatibility',
        priority: 'medium'
      }
    ];

    res.status(200).json({
      success: true,
      recommendations
    });
  } catch (error) {
    next(error);
  }
};
