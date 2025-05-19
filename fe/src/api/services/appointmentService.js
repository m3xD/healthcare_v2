// src/api/services/appointmentService.js
import api from '../api';

export const appointmentService = {
  getAppointments: () => api.get('/api/v1/appointments/appointments/'),
  getAppointmentById: (id) => api.get(`/api/v1/appointments/appointments/${id}/`),
  createAppointment: (data) => api.post('/api/v1/appointments/appointments/', data),
  updateAppointment: (id, data) => api.put(`/api/v1/appointments/appointments/${id}/`, data),
  cancelAppointment: (id) => api.post(`/api/v1/appointments/appointments/${id}/update_status/`, { status: 'cancelled' }),
  getUpcomingAppointments: () => api.get('/api/v1/appointments/appointments/upcoming/'),
  addNote: (id, content, isPrivate = false) => api.post(`/api/v1/appointments/appointments/${id}/add_note/`, {
    content,
    is_private: isPrivate
  })
};