// src/api/services/notificationService.js
import api from '../api';

export const notificationService = {
  getNotifications: () => api.get('/api/v1/notifications/'),
  getUnreadNotifications: () => api.get('/api/v1/notifications/unread/'),
  markAsRead: (id) => api.post(`/api/v1/notifications/${id}/mark_read/`),
  markAllAsRead: () => api.post('/api/v1/notifications/mark_all_read/')
};