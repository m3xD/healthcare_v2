// src/api/services/pharmacyService.js
import api from '../api';

export const pharmacyService = {
  getMedicines: () => api.get('/api/v1/pharmacy/medicines/'),
  getPrescriptions: () => api.get('/api/v1/pharmacy/prescriptions/'),
  getPrescriptionById: (id) => api.get(`/api/v1/pharmacy/prescriptions/${id}/`),
  createPrescription: (data) => api.post('/api/v1/pharmacy/prescriptions/', data),
  updatePrescriptionStatus: (id, status) => api.post(`/api/v1/pharmacy/prescriptions/${id}/update_status/`, { status }),
  getPendingPrescriptions: () => api.get('/api/v1/pharmacy/prescriptions/pending/')
};