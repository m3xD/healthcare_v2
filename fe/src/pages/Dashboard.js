// src/pages/Dashboard.js
import React from 'react';
import { useAuth } from '../context/AuthContext';
import PatientDashboard from '../components/dashboard/PatientDashboard';
// Import other dashboard types when implemented
// import DoctorDashboard from '../components/dashboard/DoctorDashboard';
// import AdminDashboard from '../components/dashboard/AdminDashboard';

const Dashboard = () => {
  const { user } = useAuth();

  // Determine user role and show appropriate dashboard
  // For now, we only have PatientDashboard
  // You can extend this later for other roles

  return (
    <PatientDashboard />
  );
};

export default Dashboard;