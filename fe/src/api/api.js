// src/api/api.js
import axios from 'axios';

const API_URL = 'http://localhost:8000';

// Cấu hình axios
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Thêm interceptor cho authentication
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// API endpoints
export const symptomsApi = {
  getAll: () => api.get('/api/v1/symptoms/'),
};

export const diagnosisApi = {
  diagnose: (symptomValues) => api.post('/diagnoses/diagnose/', { symptom_values: symptomValues }),
  getHistory: () => api.get('/api/v1/diagnoses/'),
  getDetail: (id) => api.get(`/api/v1/diagnoses/${id}/`),
};

export const authApi = {
  login: (credentials) => api.post('/auth/login/', credentials),
  register: (userData) => api.post('/auth/register/', userData),
  logout: () => api.post('/auth/logout/'),
  getProfile: () => api.get('/auth/profile/'),
};

export default api;