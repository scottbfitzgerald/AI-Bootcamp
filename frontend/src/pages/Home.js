import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="page">
      <div className="page-header" style={{ textAlign: 'center', padding: '4rem 0' }}>
        <h1 className="page-title">Welcome to FitContent</h1>
        <p className="page-subtitle">
          Your personal trainer's exclusive content platform
        </p>
        <div style={{ marginTop: '2rem' }}>
          <Link to="/posts" className="btn btn-primary" style={{ marginRight: '1rem' }}>
            Browse Content
          </Link>
          <Link to="/subscription" className="btn btn-success">
            Subscribe Now
          </Link>
        </div>
      </div>

      <div className="container">
        <div className="subscription-grid">
          <div className="card">
            <h3>Public Content</h3>
            <p>Access free workout tips, nutrition advice, and motivational content.</p>
          </div>
          <div className="card">
            <h3>Free Subscriber Content</h3>
            <p>Get exclusive articles, weekly workout plans, and community access.</p>
          </div>
          <div className="card">
            <h3>Premium Content</h3>
            <p>Full access to video tutorials, meal plans, PDFs, and 1-on-1 support.</p>
          </div>
        </div>

        <div style={{ marginTop: '4rem', textAlign: 'center' }}>
          <h2>How It Works</h2>
          <div className="subscription-grid" style={{ marginTop: '2rem' }}>
            <div className="card">
              <h4>1. Browse Public Content</h4>
              <p>Check out our free content to see if you like our style.</p>
            </div>
            <div className="card">
              <h4>2. Subscribe for Free</h4>
              <p>Get access to exclusive free subscriber content.</p>
            </div>
            <div className="card">
              <h4>3. Upgrade to Premium</h4>
              <p>Unlock all content including videos, PDFs, and personalized support.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
