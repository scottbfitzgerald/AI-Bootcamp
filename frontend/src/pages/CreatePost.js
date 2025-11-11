import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const CreatePost = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [accessLevel, setAccessLevel] = useState('public');
  const [contentType, setContentType] = useState('text');
  const [tags, setTags] = useState('');
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState('');

  const navigate = useNavigate();
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const getFileType = (file) => {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('video/')) return 'video';
    if (file.type === 'application/pdf') return 'pdf';
    return 'image';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Create the post first
      const postData = {
        title,
        content,
        excerpt: excerpt || content.substring(0, 150),
        accessLevel,
        contentType,
        tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag)
      };

      const response = await axios.post(`${API_URL}/posts`, postData);
      const postId = response.data.post._id;

      // Upload files if any
      if (files.length > 0) {
        setUploadProgress('Uploading files...');

        for (const file of files) {
          const base64Data = await convertToBase64(file);
          const fileType = getFileType(file);

          await axios.post(`${API_URL}/posts/upload`, {
            postId,
            fileData: base64Data,
            fileType,
            fileName: file.name
          });
        }
      }

      setLoading(false);
      navigate(`/posts/${postId}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Error creating post');
      setLoading(false);
      setUploadProgress('');
    }
  };

  return (
    <div className="page">
      <div className="form-container" style={{ maxWidth: '800px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>Create New Post</h2>

        {error && <div className="error">{error}</div>}
        {uploadProgress && <div className="success">{uploadProgress}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Title *</label>
            <input
              type="text"
              className="form-control"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Content *</label>
            <textarea
              className="form-control"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows="10"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Excerpt (Optional)</label>
            <textarea
              className="form-control"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              rows="3"
              placeholder="Short description (will auto-generate if left empty)"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Access Level *</label>
            <select
              className="form-control"
              value={accessLevel}
              onChange={(e) => setAccessLevel(e.target.value)}
            >
              <option value="public">Public - Everyone can view</option>
              <option value="free">Free Subscribers Only</option>
              <option value="paid">Premium Members Only</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Content Type</label>
            <select
              className="form-control"
              value={contentType}
              onChange={(e) => setContentType(e.target.value)}
            >
              <option value="text">Text</option>
              <option value="image">Image</option>
              <option value="video">Video</option>
              <option value="pdf">PDF</option>
              <option value="mixed">Mixed Media</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Tags (comma-separated)</label>
            <input
              type="text"
              className="form-control"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="fitness, workout, nutrition"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Upload Files (images, videos, PDFs)</label>
            <input
              type="file"
              className="form-control"
              onChange={handleFileChange}
              multiple
              accept="image/*,video/*,.pdf"
            />
            {files.length > 0 && (
              <p style={{ marginTop: '0.5rem', color: '#666' }}>
                {files.length} file(s) selected
              </p>
            )}
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ flex: 1 }}
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Post'}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('/posts')}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePost;
