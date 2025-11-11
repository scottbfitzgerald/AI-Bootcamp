const connectToDatabase = require('../../backend/config/database');
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

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await connectToDatabase();

    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'No authentication token, access denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    if (user.subscriptionTier !== 'none') {
      return res.status(400).json({ message: 'You already have a subscription' });
    }

    user.subscriptionTier = 'free';
    user.subscriptionStatus = 'active';
    await user.save();

    res.json({
      message: 'Successfully subscribed to free tier',
      user: {
        id: user._id,
        subscriptionTier: user.subscriptionTier,
        subscriptionStatus: user.subscriptionStatus
      }
    });
  } catch (error) {
    console.error('Free subscription error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
