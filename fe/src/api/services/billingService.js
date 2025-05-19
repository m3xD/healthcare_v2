// src/api/services/billingService.js
import api from '../api';

export const billingService = {
  getBills: () => api.get('/api/v1/billing/bills/'),
  getBillById: (id) => api.get(`/api/v1/billing/bills/${id}/`),
  createBill: (data) => api.post('/api/v1/billing/bills/', data),
  addPayment: (id, amount) => api.post(`/api/v1/billing/bills/${id}/add_payment/`, { amount }),
  getInsuranceProviders: () => api.get('/api/v1/billing/insurance-providers/'),
  getPatientInsurance: () => api.get('/api/v1/billing/patient-insurance/'),
  createInsuranceClaim: (data) => api.post('/api/v1/billing/insurance-claims/', data),
  getInsuranceClaims: () => api.get('/api/v1/billing/insurance-claims/'),
  submitClaim: (id) => api.post(`/api/v1/billing/insurance-claims/${id}/submit_claim/`)
};