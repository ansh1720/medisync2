import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('medisync_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Only handle 401 errors automatically for session management
    if (error.response?.status === 401) {
      localStorage.removeItem('medisync_token');
      localStorage.removeItem('medisync_user');
      window.location.href = '/login';
      toast.error('Session expired. Please login again.');
    }
    
    return Promise.reject(error);
  }
);

// Auth API functions
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
};

// Risk Assessment API
export const riskAPI = {
  calculateRisk: (data) => api.post('/risk', data),
  getRiskHistory: () => api.get('/risk/history'),
};

// Hospital API
export const hospitalAPI = {
  getAllHospitals: () => api.get('/hospitals'),
  searchHospitals: (params) => api.get('/hospitals/search', { params }),
  getNearbyHospitals: (params) => api.get('/hospitals/nearby', { params }),
  getHospitalDetails: (id) => api.get(`/hospitals/${id}`),
  getHospitalById: (id) => api.get(`/hospitals/${id}`),
  addReview: (hospitalId, review) => api.post(`/hospitals/${hospitalId}/reviews`, review),
};

// Consultation API
export const consultationAPI = {
  getAvailableDoctors: (params) => api.get('/consultation/doctors', { params }),
  bookConsultation: (data) => api.post('/consultation/book', data),
  getConsultations: () => api.get('/consultation/my-consultations'),
  rescheduleConsultation: (id, data) => api.put(`/consultation/${id}/reschedule`, data),
  cancelConsultation: (id) => api.delete(`/consultation/${id}`),
  
  // Doctor-specific endpoints
  getDoctorSchedule: (params) => api.get('/consultation/doctor/schedule', { params }),
  getUpcomingConsultations: (params) => api.get('/consultation/upcoming', { params }),
  getConsultationStats: (params) => api.get('/consultation/stats/overview', { params }),
  completeConsultation: (id, data) => api.put(`/consultation/${id}/complete`, data),
  addConsultationNotes: (id, data) => api.post(`/consultation/${id}/add-notes`, data),
  addPrescription: (id, data) => api.post(`/consultation/${id}/prescription`, data),
  joinConsultation: (id) => api.get(`/consultation/${id}/join`),
};

// Equipment API
export const equipmentAPI = {
  addReading: (data) => api.post('/equipment/readings', data),
  getReadings: () => api.get('/equipment/readings'),
  getAnalytics: () => api.get('/equipment/analytics'),
};

// Forum API
export const forumAPI = {
  getPosts: (params) => api.get('/forum/posts', { params }),
  createPost: (data) => api.post('/forum/posts', data),
  addComment: (postId, comment) => api.post(`/forum/posts/${postId}/comments`, comment),
  likePost: (postId) => api.post(`/forum/posts/${postId}/like`),
};

// News API
export const newsAPI = {
  getNews: (params) => api.get('/news', { params }),
  getAlerts: () => api.get('/news/alerts'),
};

export default api;