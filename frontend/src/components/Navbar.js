import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout, isAuthenticated, isTrainer } = useAuth();

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          FitContent
        </Link>
        <ul className="navbar-nav">
          <li><Link to="/posts" className="nav-link">Content</Link></li>
          <li><Link to="/subscription" className="nav-link">Subscribe</Link></li>

          {isAuthenticated ? (
            <>
              {isTrainer && (
                <li><Link to="/create-post" className="nav-link">Create Post</Link></li>
              )}
              <li><Link to="/dashboard" className="nav-link">Dashboard</Link></li>
              <li>
                <span className="nav-link" style={{ cursor: 'default' }}>
                  {user?.name} ({user?.subscriptionTier})
                </span>
              </li>
              <li>
                <button onClick={logout} className="btn btn-secondary" style={{ padding: '5px 15px' }}>
                  Logout
                </button>
              </li>
            </>
          ) : (
            <>
              <li><Link to="/login" className="nav-link">Login</Link></li>
              <li><Link to="/register" className="nav-link">Register</Link></li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
