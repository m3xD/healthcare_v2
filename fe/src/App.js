// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import viVN from 'antd/lib/locale/vi_VN'; // Import locale tiếng Việt cho Ant Design
import { AuthProvider, useAuth } from './context/AuthContext';

// Layouts
import MainLayout from './layouts/MainLayout';

// Pages
import Home from './pages/Home';
import DiagnosisResult from './pages/DiagnosisResult';
import DiagnosisHistory from './pages/DiagnosisHistory';
import DiagnosisDetail from './pages/DiagnosisDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';

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

              {/* Protected routes */}
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

              <Route path="*" element={<NotFound />} />
            </Routes>
          </MainLayout>
        </Router>
      </AuthProvider>
    </ConfigProvider>
  );
};

export default App;