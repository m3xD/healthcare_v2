// src/context/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../api/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Kiểm tra nếu người dùng đã đăng nhập (từ token)
  useEffect(() => {
    const checkLoggedIn = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setLoading(false);
          return;
        }

        // Gọi API lấy thông tin người dùng
        const response = await api.get('/api/v1/users/profile/');
        setUser(response.data.user);
      } catch (err) {
        console.error('Error checking auth status:', err);
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };

    checkLoggedIn();
  }, []);

  // Đăng nhập
  const login = async (username, password) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/api/token/', { username, password });
      const { access, refresh } = response.data;

      // Lưu tokens
      localStorage.setItem('token', access);
      localStorage.setItem('refreshToken', refresh);

      // Lấy thông tin người dùng
      // set token in header
      api.defaults.headers.common['Authorization'] = `Bearer ${access}`;

      const userResponse = await api.get('/api/v1/users/profile/');
      setUser(userResponse.data.user);

      return true;
    } catch (err) {
      setError(err.response?.data?.detail || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Đăng ký
  const register = async (userData) => {
    setLoading(true);
    setError(null);
    try {
      await api.post('/api/v1/users/register/', userData);
      return true;
    } catch (err) {
      if (err.response?.data) {
      // Đầu ra lỗi dạng chuỗi
      const errorMsg = Object.entries(err.response.data)
        .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
        .join('; ');
      setError(errorMsg);
    } else {
      setError('Đăng ký thất bại. Vui lòng thử lại.');
    }
    return false;
    } finally {
      setLoading(false);
    }
  };

  // Đăng xuất
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    setUser(null);
  };

  // Cập nhật thông tin người dùng
  const updateProfile = async (profileData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.put('/api/v1/users/profile/', profileData);
      setUser(response.data.user);
      return true;
    } catch (err) {
      setError(err.response?.data || 'Cập nhật thất bại. Vui lòng thử lại.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    updateProfile
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);