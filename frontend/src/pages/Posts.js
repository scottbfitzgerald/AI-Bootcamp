import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const Posts = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();

  const navigate = useNavigate();
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    fetchPosts();
  }, [user]);

  const fetchPosts = async () => {
    try {
      const response = await axios.get(`${API_URL}/posts`);
      setPosts(response.data.posts);
      setLoading(false);
    } catch (err) {
      setError('Error loading posts');
      setLoading(false);
    }
  };

  const getAccessBadge = (accessLevel) => {
    const badges = {
      public: { text: 'Public', class: 'badge-public' },
      free: { text: 'Free Subscribers', class: 'badge-free' },
      paid: { text: 'Premium Only', class: 'badge-paid' }
    };
    return badges[accessLevel] || badges.public;
  };

  if (loading) {
    return <div className="loading">Loading posts...</div>;
  }

  if (error) {
    return <div className="page"><div className="error">{error}</div></div>;
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Content Library</h1>
        <p className="page-subtitle">
          {user ? `Viewing as: ${user.subscriptionTier} subscriber` : 'Viewing public content only'}
        </p>
      </div>

      {posts.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <h3>No posts available yet</h3>
          <p>Check back soon for new content!</p>
        </div>
      ) : (
        <div className="posts-grid">
          {posts.map((post) => {
            const badge = getAccessBadge(post.accessLevel);
            return (
              <div
                key={post._id}
                className="post-card"
                onClick={() => navigate(`/posts/${post._id}`)}
              >
                <div className="post-content">
                  <span className={`post-badge ${badge.class}`}>
                    {badge.text}
                  </span>
                  <h3 className="post-title">{post.title}</h3>
                  <p className="post-excerpt">
                    {post.excerpt || post.content.substring(0, 150)}...
                  </p>
                  <div className="post-meta">
                    <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                    <span>{post.views} views</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Posts;
