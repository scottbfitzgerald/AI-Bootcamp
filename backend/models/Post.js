const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  excerpt: {
    type: String,
    trim: true
  },
  accessLevel: {
    type: String,
    enum: ['public', 'free', 'paid'],
    required: true,
    default: 'public'
  },
  contentType: {
    type: String,
    enum: ['text', 'image', 'video', 'pdf', 'mixed'],
    default: 'text'
  },
  media: [{
    type: {
      type: String,
      enum: ['image', 'video', 'pdf']
    },
    url: String,
    filename: String
  }],
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tags: [String],
  published: {
    type: Boolean,
    default: true
  },
  views: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for efficient queries
postSchema.index({ accessLevel: 1, published: 1, createdAt: -1 });

module.exports = mongoose.model('Post', postSchema);
