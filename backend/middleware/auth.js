const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verify JWT token
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'No authentication token, access denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = user;
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// Check if user is trainer or admin
const isTrainer = (req, res, next) => {
  if (req.user.role !== 'trainer' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Trainer privileges required.' });
  }
  next();
};

// Check subscription access level
const checkAccess = (requiredLevel) => {
  return (req, res, next) => {
    const userTier = req.user?.subscriptionTier || 'none';

    const accessLevels = {
      'none': 0,
      'free': 1,
      'paid': 2
    };

    if (accessLevels[userTier] >= accessLevels[requiredLevel]) {
      next();
    } else {
      res.status(403).json({
        message: 'Subscription required to access this content',
        requiredTier: requiredLevel,
        currentTier: userTier
      });
    }
  };
};

module.exports = { auth, isTrainer, checkAccess };
