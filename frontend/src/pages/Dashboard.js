import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const Dashboard = () => {
  const { user } = useAuth();
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    if (user?.subscriptionTier === 'paid') {
      fetchSubscriptionStatus();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchSubscriptionStatus = async () => {
    try {
      const response = await axios.get(`${API_URL}/subscription/status`);
      setSubscriptionStatus(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching subscription status:', error);
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!window.confirm('Are you sure you want to cancel your subscription?')) {
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/subscription/cancel`);
      alert(response.data.message);
      fetchSubscriptionStatus();
    } catch (error) {
      alert('Error canceling subscription');
    }
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Welcome back, {user?.name}!</p>
      </div>

      <div className="container">
        {/* User Profile Card */}
        <div className="card">
          <h2>Your Profile</h2>
          <div style={{ marginTop: '1rem' }}>
            <p><strong>Name:</strong> {user?.name}</p>
            <p><strong>Email:</strong> {user?.email}</p>
            <p><strong>Role:</strong> {user?.role}</p>
            <p><strong>Subscription Tier:</strong> {user?.subscriptionTier}</p>
            {user?.subscriptionStatus && (
              <p><strong>Status:</strong> {user?.subscriptionStatus}</p>
            )}
          </div>
        </div>

        {/* Subscription Info */}
        <div className="card">
          <h2>Subscription Information</h2>

          {user?.subscriptionTier === 'none' && (
            <div>
              <p>You don't have an active subscription.</p>
              <Link to="/subscription" className="btn btn-primary" style={{ marginTop: '1rem' }}>
                View Subscription Options
              </Link>
            </div>
          )}

          {user?.subscriptionTier === 'free' && (
            <div>
              <p>You have a free subscription with access to:</p>
              <ul style={{ marginTop: '1rem', marginLeft: '1.5rem' }}>
                <li>All public content</li>
                <li>Exclusive free subscriber articles</li>
                <li>Weekly workout plans</li>
              </ul>
              <Link to="/subscription" className="btn btn-success" style={{ marginTop: '1rem' }}>
                Upgrade to Premium
              </Link>
            </div>
          )}

          {user?.subscriptionTier === 'paid' && subscriptionStatus && (
            <div>
              <p>You have a premium subscription with full access!</p>
              <ul style={{ marginTop: '1rem', marginLeft: '1.5rem' }}>
                <li>All content including videos and PDFs</li>
                <li>Direct trainer support</li>
                <li>Priority access to new content</li>
              </ul>

              {subscriptionStatus.details && (
                <div style={{ marginTop: '1.5rem' }}>
                  <p><strong>Status:</strong> {subscriptionStatus.details.status}</p>
                  <p><strong>Renewal Date:</strong> {new Date(subscriptionStatus.details.currentPeriodEnd).toLocaleDateString()}</p>

                  {!subscriptionStatus.details.cancelAtPeriodEnd ? (
                    <button
                      onClick={handleCancelSubscription}
                      className="btn btn-secondary"
                      style={{ marginTop: '1rem' }}
                    >
                      Cancel Subscription
                    </button>
                  ) : (
                    <p style={{ color: '#e74c3c', marginTop: '1rem' }}>
                      Your subscription will be canceled at the end of the billing period.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="card">
          <h2>Quick Actions</h2>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
            <Link to="/posts" className="btn btn-primary">
              Browse Content
            </Link>
            {user?.role === 'trainer' && (
              <Link to="/create-post" className="btn btn-success">
                Create New Post
              </Link>
            )}
            {user?.subscriptionTier !== 'paid' && (
              <Link to="/subscription" className="btn btn-success">
                Upgrade Subscription
              </Link>
            )}
          </div>
        </div>

        {/* Content Access Summary */}
        <div className="card">
          <h2>What You Can Access</h2>
          <div style={{ marginTop: '1rem' }}>
            {user?.subscriptionTier === 'none' && (
              <p>Currently, you can only view public content. Subscribe for free to access more!</p>
            )}
            {user?.subscriptionTier === 'free' && (
              <p>You can view public and free subscriber content. Upgrade to premium for full access!</p>
            )}
            {user?.subscriptionTier === 'paid' && (
              <p>You have full access to all content including premium videos, PDFs, and exclusive material!</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
