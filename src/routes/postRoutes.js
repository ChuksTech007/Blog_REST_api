const express = require('express');
const router = express.Router();
const { 
    createPost, 
    getPosts, 
    getPostBySlug, 
    updatePost, 
    deletePost } = require('../controllers/postController');
const { protect, optionalProtect } = require('../middleware/authMiddleware');

// Only authenticated users can create posts
router.get('/', optionalProtect, getPosts);
router.get('/:slug', getPostBySlug);
router.post('/', protect, createPost);
router.put('/:id', protect, updatePost);
router.delete('/:id', protect, deletePost);

module.exports = router;