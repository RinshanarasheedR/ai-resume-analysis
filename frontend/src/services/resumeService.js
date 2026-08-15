import api from './api';

export const resumeService = {
  createResume: async (resumeData) => {
    const response = await api.post('/api/resume/create', resumeData);
    return response.data;
  },

  getResumes: async () => {
    const response = await api.get('/api/resume/list');
    return response.data;
  },

  getResume: async (id) => {
    const response = await api.get(`/api/resume/${id}`);
    return response.data;
  },

  updateResume: async (id, resumeData) => {
    const response = await api.put(`/api/resume/${id}`, resumeData);
    return response.data;
  },

  deleteResume: async (id) => {
    const response = await api.delete(`/api/resume/${id}`);
    return response.data;
  },

  generateAIContent: async (data) => {
    const response = await api.post('/api/resume/generate-ai', data);
    return response.data;
  }
};
