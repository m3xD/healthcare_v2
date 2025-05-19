// src/App.js (updated)
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import viVN from 'antd/lib/locale/vi_VN'; // Import locale tiếng Việt cho Ant Design
import { AuthProvider, useAuth } from './context/AuthContext';

// Layouts
import MainLayout from './layouts/MainLayout';

// Pages & Components
// Original pages
import Home from './pages/Home';
import DiagnosisResult from './pages/DiagnosisResult';
import DiagnosisHistory from './pages/DiagnosisHistory';
import DiagnosisDetail from './pages/DiagnosisDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';

// New pages
import Dashboard from './pages/Dashboard';
import DoctorList from './components/doctors/DoctorList';
import DoctorDetail from './components/doctors/DoctorDetail';
import AppointmentList from './components/appointments/AppointmentList';
import AppointmentForm from './components/appointments/AppointmentForm';
import AppointmentDetail from './components/appointments/AppointmentDetail';
import AIChat from './components/chat/AIChat';

// Components
import ProtectedRoute from './components/ProtectedRoute';

const App = () => {
  return (
    <ConfigProvider locale={viVN}>
      <AuthProvider>
        <Router>
          <MainLayout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/result" element={<DiagnosisResult />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/ai-chat" element={<AIChat />} />

              {/* Protected routes */}
              <Route
                path="/dashboard"
                element={<ProtectedRoute><Dashboard /></ProtectedRoute>}
              />
              <Route
                path="/history"
                element={<ProtectedRoute><DiagnosisHistory /></ProtectedRoute>}
              />
              <Route
                path="/history/:id"
                element={<ProtectedRoute><DiagnosisDetail /></ProtectedRoute>}
              />
              <Route
                path="/profile"
                element={<ProtectedRoute><Profile /></ProtectedRoute>}
              />

              {/* Doctor routes */}
              <Route path="/doctors" element={<DoctorList />} />
              <Route path="/doctors/:id" element={<DoctorDetail />} />

              {/* Appointment routes */}
              <Route
                path="/appointments"
                element={<ProtectedRoute><AppointmentList /></ProtectedRoute>}
              />
              <Route
                path="/appointments/new"
                element={<ProtectedRoute><AppointmentForm /></ProtectedRoute>}
              />
              <Route
                path="/appointments/:id"
                element={<ProtectedRoute><AppointmentDetail /></ProtectedRoute>}
              />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </MainLayout>
        </Router>
      </AuthProvider>
    </ConfigProvider>
  );
};

export default App;