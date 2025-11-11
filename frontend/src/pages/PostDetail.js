import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

const PostDetail = () => {
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const { id } = useParams();
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    fetchPost();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchPost = async () => {
    try {
      const response = await axios.get(`${API_URL}/posts/${id}`);
      setPost(response.data.post);
      setLoading(false);
    } catch (err) {
      if (err.response?.status === 403) {
        setError('This content requires a subscription. Please upgrade your subscription to view.');
      } else {
        setError('Error loading post');
      }
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading post...</div>;
  }

  if (error) {
    return (
      <div className="page">
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <h3>Access Denied</h3>
          <p className="error">{error}</p>
          <Link to="/subscription" className="btn btn-primary" style={{ marginTop: '1rem' }}>
            View Subscription Options
          </Link>
        </div>
      </div>
    );
  }

  if (!post) {
    return <div className="page"><div className="error">Post not found</div></div>;
  }

  const getAccessBadge = (accessLevel) => {
    const badges = {
      public: { text: 'Public', class: 'badge-public' },
      free: { text: 'Free Subscribers', class: 'badge-free' },
      paid: { text: 'Premium Only', class: 'badge-paid' }
    };
    return badges[accessLevel] || badges.public;
  };

  const badge = getAccessBadge(post.accessLevel);

  return (
    <div className="page">
      <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <span className={`post-badge ${badge.class}`}>
          {badge.text}
        </span>

        <h1 style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>{post.title}</h1>

        <div className="post-meta" style={{ marginBottom: '2rem' }}>
          <span>By {post.author?.name}</span>
          <span>{new Date(post.createdAt).toLocaleDateString()}</span>
          <span>{post.views} views</span>
        </div>

        <div style={{ lineHeight: '1.8', whiteSpace: 'pre-wrap' }}>
          {post.content}
        </div>

        {post.media && post.media.length > 0 && (
          <div style={{ marginTop: '2rem' }}>
            <h3>Media</h3>
            <div style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
              {post.media.map((item, index) => (
                <div key={index}>
                  {item.type === 'image' && (
                    <img
                      src={`${API_URL.replace('/api', '')}${item.url}`}
                      alt={item.filename}
                      style={{ maxWidth: '100%', borderRadius: '8px' }}
                    />
                  )}
                  {item.type === 'video' && (
                    <video
                      controls
                      style={{ maxWidth: '100%', borderRadius: '8px' }}
                    >
                      <source src={`${API_URL.replace('/api', '')}${item.url}`} />
                      Your browser does not support video playback.
                    </video>
                  )}
                  {item.type === 'pdf' && (
                    <a
                      href={`${API_URL.replace('/api', '')}${item.url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-primary"
                    >
                      Download PDF: {item.filename}
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {post.tags && post.tags.length > 0 && (
          <div style={{ marginTop: '2rem' }}>
            <strong>Tags: </strong>
            {post.tags.map((tag, index) => (
              <span
                key={index}
                style={{
                  display: 'inline-block',
                  background: '#ecf0f1',
                  padding: '4px 12px',
                  borderRadius: '12px',
                  margin: '0 5px',
                  fontSize: '0.9rem'
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div style={{ textAlign: 'center', marginTop: '2rem' }}>
        <Link to="/posts" className="btn btn-secondary">
          Back to All Posts
        </Link>
      </div>
    </div>
  );
};

export default PostDetail;
