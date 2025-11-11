const connectToDatabase = require('../../backend/config/database');
const Post = require('../../backend/models/Post');
const User = require('../../backend/models/User');
const jwt = require('jsonwebtoken');
const cloudinary = require('../../backend/config/cloudinary');

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', process.env.CLIENT_URL || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await connectToDatabase();

    // Verify authentication
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'No authentication token' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Check if user is trainer
    if (user.role !== 'trainer' && user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Trainer privileges required.' });
    }

    const { title, content, excerpt, accessLevel, contentType, tags, mediaFiles } = req.body;

    // Validation
    if (!title || !content || !accessLevel) {
      return res.status(400).json({ message: 'Title, content, and access level are required' });
    }

    // Create post
    const post = new Post({
      title,
      content,
      excerpt: excerpt || content.substring(0, 150),
      accessLevel,
      contentType: contentType || 'text',
      author: user._id,
      tags: tags || [],
      media: mediaFiles || []
    });

    await post.save();
    await post.populate('author', 'name email');

    res.status(201).json({
      message: 'Post created successfully',
      post
    });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ message: 'Server error creating post' });
  }
};
