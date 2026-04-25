import axios from 'axios';

const API = axios.create({ baseURL: 'https://aural-ai.onrender.com/api' });

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  register: (data) => API.post('/auth/register', data),
  login: (data) => API.post('/auth/login', data),
  me: () => API.get('/auth/me'),
};

export const questionsAPI = {
  getAll: (params) => API.get('/questions', { params }),
  getById: (id) => API.get(`/questions/${id}`),
  getTopics: () => API.get('/questions/topics'),
  getCompanies: () => API.get('/questions/companies'),
  upvote: (id) => API.put(`/questions/${id}/upvote`),
};

export const aiAPI = {
  startInterview: (data) => API.post('/ai/interview/start', data),
  sendMessage: (id, message) => API.post(`/ai/interview/${id}/message`, { message }),
  completeInterview: (id) => API.post(`/ai/interview/${id}/complete`),
  getInterview: (id) => API.get(`/ai/interview/${id}`),
  getFeedback: (data) => API.post('/ai/feedback', data),
};

export const interviewsAPI = {
  getHistory: (params) => API.get('/interviews', { params }),
  getStats: () => API.get('/interviews/stats'),
  getById: (id) => API.get(`/interviews/${id}`),
  delete: (id) => API.delete(`/interviews/${id}`),
};

export const usersAPI = {
  getProfile: () => API.get('/users/profile'),
  updateProfile: (data) => API.put('/users/profile', data),
  updatePassword: (data) => API.put('/users/password', data),
  updateProgress: (data) => API.put('/users/progress', data),
  getActivity: () => API.get('/users/activity'),
  deleteAccount: (data) => API.delete('/users/account', { data }),
};

export default API;
