const connectToDatabase = require('../../backend/config/database');
const Post = require('../../backend/models/Post');

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

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await connectToDatabase();

    // Determine user's subscription tier from token if present
    let userTier = 'none';
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (token) {
      try {
        const jwt = require('jsonwebtoken');
        const User = require('../../backend/models/User');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);
        if (user) {
          userTier = user.subscriptionTier;
        }
      } catch (err) {
        // Invalid token, continue with 'none'
      }
    }

    // Build query based on user's access level
    let query = { published: true };

    if (userTier === 'none') {
      query.accessLevel = 'public';
    } else if (userTier === 'free') {
      query.accessLevel = { $in: ['public', 'free'] };
    }
    // If paid, show all posts (no additional filter needed)

    const posts = await Post.find(query)
      .populate('author', 'name email')
      .sort({ createdAt: -1 })
      .select('-__v');

    res.json({
      posts,
      userTier,
      totalCount: posts.length
    });
  } catch (error) {
    console.error('Fetch posts error:', error);
    res.status(500).json({ message: 'Server error fetching posts' });
  }
};
