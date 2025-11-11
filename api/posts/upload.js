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

    if (!user || (user.role !== 'trainer' && user.role !== 'admin')) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { postId, fileData, fileType, fileName } = req.body;

    if (!postId || !fileData) {
      return res.status(400).json({ message: 'Post ID and file data are required' });
    }

    // Find post
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.author.toString() !== user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to upload to this post' });
    }

    // Upload to Cloudinary
    let resourceType = 'auto';
    if (fileType === 'video') resourceType = 'video';
    if (fileType === 'pdf') resourceType = 'raw';

    const uploadResult = await cloudinary.uploader.upload(fileData, {
      folder: 'trainer-app',
      resource_type: resourceType,
      public_id: `${postId}_${Date.now()}`
    });

    // Add media to post
    const mediaItem = {
      type: fileType,
      url: uploadResult.secure_url,
      filename: fileName || uploadResult.public_id
    };

    post.media.push(mediaItem);
    await post.save();

    res.json({
      message: 'File uploaded successfully',
      media: mediaItem
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Server error uploading file' });
  }
};
