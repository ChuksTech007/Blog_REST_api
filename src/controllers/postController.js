const Post = require('../models/Post');

// @desc    Create a new post
// @route   POST /api/posts
// @access  Private (Auth required)
exports.createPost = async (req, res) => {
  try {
    const { title, content, tags, status } = req.body;

    // Create post and link it to the logged-in user (req.user.id)
    const post = await Post.create({
      title,
      content,
      tags,
      status,
      author: req.user.id, 
    });

    res.status(201).json(post);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get all posts (with filtering, search, and pagination)
// @route   GET /api/posts
// @access  Public
exports.getPosts = async (req, res) => {
  try {
    let query;
    const reqQuery = { ...req.query };

    // 1. Fields to exclude from matching the database fields
    const removeFields = ['page', 'limit', 'search', 'tag'];
    removeFields.forEach(param => delete reqQuery[param]);

    // 2. Base Query (Only show non-deleted posts)
    let queryObj = { deletedAt: null };

    // 3. Authorization Logic: Public users only see "published"
    // Authenticated users see published + their own drafts
    if (req.user) {
      // Logged in: See published OR own drafts
      queryObj.$or = [
        { status: 'published' },
        { author: req.user.id }
      ];
    } else {
      // Public: ONLY published
      queryObj.status = 'published';
    }

    // 4. Search logic (Title or Content)
    if (req.query.search) {
      const searchRegex = { $regex: req.query.search, $options: 'i' };
      // Using $and ensures search works WITH the status logic above
      queryObj.$and = [
        { 
          $or: [
            { title: searchRegex },
            { content: searchRegex }
          ] 
        }
      ];
    }

    // 5. Tag filter
    if (req.query.tag) {
      queryObj.tags = req.query.tag;
    }

    query = Post.find(queryObj).populate('author', 'name email');

    // 6. Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    query = query.skip(skip).limit(limit);

    const posts = await query;

    res.status(200).json({
      count: posts.length,
      page,
      data: posts
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update post (Only Author)
exports.updatePost = async (req, res) => {
  try {
    let post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    // Ensure user is the owner
    if (post.author.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized to edit this post' });
    }

    post = await Post.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json(post);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Soft Delete (Only Author)
exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    if (post.author.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    post.deletedAt = Date.now();
    await post.save();
    res.status(200).json({ message: 'Post soft-deleted' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get single post by slug
exports.getPostBySlug = async (req, res) => {
  try {
    const post = await Post.findOne({ 
      slug: req.params.slug, 
      status: 'published', 
      deletedAt: null 
    }).populate('author', 'name');

    if (!post) return res.status(404).json({ message: 'Post not found' });
    res.status(200).json(post);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};