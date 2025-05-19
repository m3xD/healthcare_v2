// src/api/services/doctorService.js
import api from '../api';

export const doctorService = {
  getDoctors: () => api.get('/api/v1/doctors/doctors/'),
  getDoctorById: (id) => api.get(`/api/v1/doctors/doctors/${id}/`),
  getDoctorSchedule: (id) => api.get(`/api/v1/doctors/doctors/${id}/schedules/`),
  getAvailableSlots: (id, date) => api.get(`/api/v1/doctors/doctors/${id}/available_slots/?date=${date}`)
};