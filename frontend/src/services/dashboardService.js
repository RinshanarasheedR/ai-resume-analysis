import api from './api';

export const dashboardService = {
  getStats: async () => {
    const response = await api.get('/api/dashboard/stats');
    return response.data;
  },

  getProgress: async () => {
    const response = await api.get('/api/dashboard/progress');
    return response.data;
  },

  getRecommendations: async () => {
    const response = await api.get('/api/dashboard/recommendations');
    return response.data;
  }
};
