// src/api/services/laboratoryService.js
import api from '../api';

export const laboratoryService = {
  getLabTests: () => api.get('/api/v1/laboratory/tests/'),
  getLabRequests: () => api.get('/api/v1/laboratory/requests/'),
  getLabRequestById: (id) => api.get(`/api/v1/laboratory/requests/${id}/`),
  createLabRequest: (data) => api.post('/api/v1/laboratory/requests/', data),
  updateLabRequestStatus: (id, status) => api.post(`/api/v1/laboratory/requests/${id}/update_status/`, { status }),
  getTestResults: () => api.get('/api/v1/laboratory/results/'),
  updateTestResult: (id, data) => api.put(`/api/v1/laboratory/results/${id}/`, data)
};