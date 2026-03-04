/**
 * Forum routes: all require authentication.
 * Students can create/interact; admins can only view.
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { upload } = require('../middleware/uploadMiddleware');
const {
  getPosts,
  createPost,
  toggleLike,
  addComment,
  deletePost,
  deleteComment,
  uploadImage,
} = require('../controllers/forumController');

router.use(protect);

router.get('/posts', getPosts);
router.post('/upload', upload.single('image'), uploadImage);
router.post('/posts', createPost);
router.post('/posts/:id/like', toggleLike);
router.post('/posts/:id/comment', addComment);
router.delete('/posts/:id', deletePost);
router.delete('/comments/:postId/:commentId', deleteComment);

module.exports = router;
