const mongoose = require('mongoose');
const slugify = require('slugify');

const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a title'],
    trim: true,
  },
  slug: {
    type: String,
    unique: true,
  },
  content: {
    type: String,
    required: [true, 'Please add content'],
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // This creates the link to the User model
    required: true,
  },
  status: {
    type: String,
    enum: ['draft', 'published'],
    default: 'draft',
  },
  tags: [String],
  deletedAt: {
    type: Date,
    default: null, // If this is null, the post is not deleted
  },
}, { 
  timestamps: true // This automatically creates createdAt and updatedAt fields
});

// --- Logic for the Slug and Filtering ---
// Create post slug from the title before saving
postSchema.pre('save', function (next) {
  if (!this.isModified('title')) {
    next();
  }
  this.slug = slugify(this.title, {
    lower: true,
    strict: true,
  });
  next();
});

module.exports = mongoose.model('Post', postSchema);