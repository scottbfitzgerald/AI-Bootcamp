import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  // Set axios default headers
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUser();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const fetchUser = async () => {
    try {
      const response = await axios.get(`${API_URL}/auth/me`);
      setUser(response.data.user);
    } catch (error) {
      console.error('Error fetching user:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, { email, password });
      const { token, user } = response.data;

      localStorage.setItem('token', token);
      setToken(token);
      setUser(user);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed'
      };
    }
  };

  const register = async (name, email, password) => {
    try {
      const response = await axios.post(`${API_URL}/auth/register`, { name, email, password });
      const { token, user } = response.data;

      localStorage.setItem('token', token);
      setToken(token);
      setUser(user);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed'
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  const subscribeFree = async () => {
    try {
      const response = await axios.post(`${API_URL}/auth/subscribe-free`);
      setUser(response.data.user);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Subscription failed'
      };
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    subscribeFree,
    isAuthenticated: !!user,
    isTrainer: user?.role === 'trainer' || user?.role === 'admin'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
