const connectToDatabase = require('../../backend/config/database');
const Post = require('../../backend/models/Post');
const User = require('../../backend/models/User');
const jwt = require('jsonwebtoken');

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

  try {
    await connectToDatabase();

    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ message: 'Post ID is required' });
    }

    if (req.method === 'GET') {
      return await getPost(req, res, id);
    } else if (req.method === 'PUT') {
      return await updatePost(req, res, id);
    } else if (req.method === 'DELETE') {
      return await deletePost(req, res, id);
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('Post operation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

async function getPost(req, res, id) {
  try {
    const post = await Post.findById(id).populate('author', 'name email');

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Determine user's subscription tier
    let userTier = 'none';
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);
        if (user) {
          userTier = user.subscriptionTier;
        }
      } catch (err) {
        // Invalid token, continue with 'none'
      }
    }

    // Check access permissions
    const accessLevels = {
      'public': 0,
      'free': 1,
      'paid': 2
    };

    const tierLevels = {
      'none': 0,
      'free': 1,
      'paid': 2
    };

    if (tierLevels[userTier] < accessLevels[post.accessLevel]) {
      return res.status(403).json({
        message: 'Subscription required to view this content',
        requiredTier: post.accessLevel,
        currentTier: userTier
      });
    }

    // Increment views
    post.views += 1;
    await post.save();

    res.json({ post });
  } catch (error) {
    throw error;
  }
}

async function updatePost(req, res, id) {
  try {
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

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.author.toString() !== user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this post' });
    }

    const { title, content, excerpt, accessLevel, contentType, tags, published } = req.body;

    if (title) post.title = title;
    if (content) post.content = content;
    if (excerpt) post.excerpt = excerpt;
    if (accessLevel) post.accessLevel = accessLevel;
    if (contentType) post.contentType = contentType;
    if (tags) post.tags = tags;
    if (published !== undefined) post.published = published;

    await post.save();
    await post.populate('author', 'name email');

    res.json({
      message: 'Post updated successfully',
      post
    });
  } catch (error) {
    throw error;
  }
}

async function deletePost(req, res, id) {
  try {
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

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.author.toString() !== user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this post' });
    }

    await post.deleteOne();

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    throw error;
  }
}
