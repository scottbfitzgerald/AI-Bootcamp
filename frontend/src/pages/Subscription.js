import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Subscription = () => {
  const { user, isAuthenticated, subscribeFree } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  const handleFreeSubscribe = async () => {
    if (!isAuthenticated) {
      navigate('/register');
      return;
    }

    setLoading(true);
    setError('');

    const result = await subscribeFree();

    if (result.success) {
      setSuccess('Successfully subscribed to free tier!');
      setTimeout(() => navigate('/posts'), 2000);
    } else {
      setError(result.message);
    }

    setLoading(false);
  };

  const handlePaidSubscribe = async () => {
    if (!isAuthenticated) {
      navigate('/register');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API_URL}/subscription/create-checkout-session`);

      // Redirect to Stripe Checkout
      if (response.data.url) {
        window.location.href = response.data.url;
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error creating checkout session');
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header" style={{ textAlign: 'center' }}>
        <h1 className="page-title">Choose Your Plan</h1>
        <p className="page-subtitle">
          {user ? `Current tier: ${user.subscriptionTier}` : 'Sign up to get started'}
        </p>
      </div>

      {error && <div className="error" style={{ textAlign: 'center', marginBottom: '2rem' }}>{error}</div>}
      {success && <div className="success" style={{ textAlign: 'center', marginBottom: '2rem' }}>{success}</div>}

      <div className="subscription-grid">
        {/* Public Tier */}
        <div className="subscription-card">
          <h2>Public</h2>
          <div className="subscription-price">Free</div>
          <ul className="subscription-features">
            <li>Access to public content</li>
            <li>Browse workout tips</li>
            <li>Basic nutrition advice</li>
          </ul>
          <button className="btn btn-secondary" style={{ width: '100%' }} disabled>
            Current Access
          </button>
        </div>

        {/* Free Subscriber Tier */}
        <div className="subscription-card">
          <h2>Free Subscriber</h2>
          <div className="subscription-price">$0</div>
          <p style={{ color: '#7f8c8d', marginBottom: '1rem' }}>per month</p>
          <ul className="subscription-features">
            <li>All public content</li>
            <li>Exclusive articles</li>
            <li>Weekly workout plans</li>
            <li>Community access</li>
          </ul>
          <button
            className="btn btn-success"
            style={{ width: '100%' }}
            onClick={handleFreeSubscribe}
            disabled={loading || user?.subscriptionTier !== 'none'}
          >
            {user?.subscriptionTier === 'free' || user?.subscriptionTier === 'paid'
              ? 'Subscribed'
              : 'Subscribe Free'}
          </button>
        </div>

        {/* Premium Tier */}
        <div className="subscription-card featured">
          <h2>Premium Member</h2>
          <div className="subscription-price">$29.99</div>
          <p style={{ color: '#7f8c8d', marginBottom: '1rem' }}>per month</p>
          <ul className="subscription-features">
            <li>All free subscriber content</li>
            <li>Exclusive video tutorials</li>
            <li>Detailed meal prep guides</li>
            <li>Downloadable workout PDFs</li>
            <li>Direct trainer support</li>
            <li>Priority access to new content</li>
          </ul>
          <button
            className="btn btn-primary"
            style={{ width: '100%' }}
            onClick={handlePaidSubscribe}
            disabled={loading || user?.subscriptionTier === 'paid'}
          >
            {user?.subscriptionTier === 'paid' ? 'Active Subscription' : 'Upgrade to Premium'}
          </button>
        </div>
      </div>

      {!isAuthenticated && (
        <div style={{ textAlign: 'center', marginTop: '3rem' }}>
          <p>Need an account? <button onClick={() => navigate('/register')} className="btn btn-primary">Sign Up Now</button></p>
        </div>
      )}
    </div>
  );
};

export default Subscription;
