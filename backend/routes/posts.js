const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Post = require('../models/Post');
const { auth, isTrainer } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|mp4|mov|avi|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images, videos, and PDFs are allowed.'));
    }
  }
});

// Get all posts (filtered by user's subscription level)
router.get('/', async (req, res) => {
  try {
    const userTier = req.user?.subscriptionTier || 'none';

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
});

// Get single post by ID
router.get('/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate('author', 'name email');

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const userTier = req.user?.subscriptionTier || 'none';

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
    console.error('Fetch post error:', error);
    res.status(500).json({ message: 'Server error fetching post' });
  }
});

// Create new post (trainer only)
router.post('/',
  auth,
  isTrainer,
  [
    body('title').trim().notEmpty(),
    body('content').trim().notEmpty(),
    body('accessLevel').isIn(['public', 'free', 'paid'])
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { title, content, excerpt, accessLevel, contentType, tags } = req.body;

      const post = new Post({
        title,
        content,
        excerpt: excerpt || content.substring(0, 150),
        accessLevel,
        contentType: contentType || 'text',
        author: req.userId,
        tags: tags || []
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
  }
);

// Update post (trainer only)
router.put('/:id',
  auth,
  isTrainer,
  async (req, res) => {
    try {
      const post = await Post.findById(req.params.id);

      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }

      // Check if user is the author
      if (post.author.toString() !== req.userId) {
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
      console.error('Update post error:', error);
      res.status(500).json({ message: 'Server error updating post' });
    }
  }
);

// Delete post (trainer only)
router.delete('/:id', auth, isTrainer, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if user is the author
    if (post.author.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized to delete this post' });
    }

    await post.deleteOne();

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ message: 'Server error deleting post' });
  }
});

// Upload media files to post
router.post('/:id/upload',
  auth,
  isTrainer,
  upload.array('files', 10),
  async (req, res) => {
    try {
      const post = await Post.findById(req.params.id);

      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }

      if (post.author.toString() !== req.userId) {
        return res.status(403).json({ message: 'Not authorized to upload to this post' });
      }

      const mediaFiles = req.files.map(file => {
        let type = 'image';
        if (file.mimetype.startsWith('video')) type = 'video';
        if (file.mimetype === 'application/pdf') type = 'pdf';

        return {
          type,
          url: `/uploads/${file.filename}`,
          filename: file.filename
        };
      });

      post.media.push(...mediaFiles);
      await post.save();

      res.json({
        message: 'Files uploaded successfully',
        media: mediaFiles
      });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ message: 'Server error uploading files' });
    }
  }
);

module.exports = router;
