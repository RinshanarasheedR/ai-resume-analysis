import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { dashboardService } from '../services/dashboardService';
import { 
  FileText, 
  CheckCircle, 
  Brain, 
  Code, 
  MessageSquare, 
  Award,
  Clock
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [statsRes, recRes] = await Promise.all([
        dashboardService.getStats(),
        dashboardService.getRecommendations()
      ]);

      setStats(statsRes.stats);
      setRecommendations(recRes.recommendations);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Resumes Created',
      value: stats?.resumeCount || 0,
      icon: FileText,
      color: 'bg-blue-500',
    },
    {
      title: 'ATS Reports',
      value: stats?.atsReportCount || 0,
      icon: CheckCircle,
      color: 'bg-green-500',
    },
    {
      title: 'Aptitude Quizzes',
      value: stats?.aptitudeScoreCount || 0,
      icon: Brain,
      color: 'bg-purple-500',
    },
    {
      title: 'Technical Quizzes',
      value: stats?.technicalScoreCount || 0,
      icon: Code,
      color: 'bg-orange-500',
    },
    {
      title: 'Mock Interviews',
      value: stats?.interviewCount || 0,
      icon: MessageSquare,
      color: 'bg-pink-500',
    },
    {
      title: 'Avg ATS Score',
      value: `${stats?.avgAtsScore || 0}%`,
      icon: Award,
      color: 'bg-teal-500',
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Welcome back, {user?.name}! 👋
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Here's an overview of your interview preparation progress
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.title} className="card">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400 truncate">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {stat.value}
                  </p>
                </div>
                <div className={`p-2.5 rounded-xl ${stat.color} shrink-0 ml-3`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recommendations & Actionable Steps */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Recommendations
        </h2>
        <div className="space-y-4">
          {recommendations.length > 0 ? (
            recommendations.map((rec, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border-l-4 ${
                  rec.priority === 'high'
                    ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                    : 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                }`}
              >
                <div className="flex items-start">
                  <Clock className={`w-5 h-5 mr-3 mt-0.5 ${
                    rec.priority === 'high' ? 'text-red-500' : 'text-blue-400'
                  }`} />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {rec.title}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {rec.description}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">No recommendations available at this time. Start practicing or build your resume to get custom insights!</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
