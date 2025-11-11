import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, trainerOnly = false }) => {
  const { isAuthenticated, isTrainer, loading } = useAuth();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (trainerOnly && !isTrainer) {
    return <Navigate to="/" />;
  }

  return children;
};

export default ProtectedRoute;
