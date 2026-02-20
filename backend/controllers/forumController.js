/**
 * Forum controller: CRUD for posts, likes, comments.
 * Students can create/interact; admins can only view.
 */

const Post = require('../models/Post');

/**
 * GET /api/forum/posts
 * Returns all posts, newest first, with user details populated.
 */
const getPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate('userId', 'name email')
      .populate('likes', 'name')
      .populate('comments.userId', 'name email')
      .sort({ createdAt: -1 })
      .lean();
    res.status(200).json(posts);
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ message: 'Failed to fetch posts' });
  }
};

/**
 * POST /api/forum/posts
 * Body: { content, imageUrl? }
 * Creates a new post. Only students can create posts.
 */
const createPost = async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      return res.status(403).json({ message: 'Admins cannot create posts' });
    }

    const { content, imageUrl } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Post content is required' });
    }

    const post = await Post.create({
      userId: req.user.id,
      content: content.trim(),
      imageUrl: imageUrl || '',
    });

    const populatedPost = await Post.findById(post._id)
      .populate('userId', 'name email')
      .populate('likes', 'name')
      .populate('comments.userId', 'name email')
      .lean();

    res.status(201).json(populatedPost);
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ message: messages.join('. ') });
    }
    console.error('Create post error:', error);
    res.status(500).json({ message: 'Failed to create post' });
  }
};

/**
 * POST /api/forum/posts/:id/like
 * Toggles like on a post. Only students can like.
 */
const toggleLike = async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      return res.status(403).json({ message: 'Admins cannot like posts' });
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const userId = req.user.id;
    const likeIndex = post.likes.indexOf(userId);

    if (likeIndex > -1) {
      post.likes.splice(likeIndex, 1);
    } else {
      post.likes.push(userId);
    }

    await post.save();

    const populatedPost = await Post.findById(post._id)
      .populate('userId', 'name email')
      .populate('likes', 'name')
      .populate('comments.userId', 'name email')
      .lean();

    res.status(200).json(populatedPost);
  } catch (error) {
    console.error('Toggle like error:', error);
    res.status(500).json({ message: 'Failed to toggle like' });
  }
};

/**
 * POST /api/forum/posts/:id/comment
 * Body: { text }
 * Adds a comment to a post. Only students can comment.
 */
const addComment = async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      return res.status(403).json({ message: 'Admins cannot comment' });
    }

    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Comment text is required' });
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    post.comments.push({
      userId: req.user.id,
      text: text.trim(),
    });

    await post.save();

    const populatedPost = await Post.findById(post._id)
      .populate('userId', 'name email')
      .populate('likes', 'name')
      .populate('comments.userId', 'name email')
      .lean();

    res.status(200).json(populatedPost);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: Object.values(error.errors).map((e) => e.message).join('. ') });
    }
    console.error('Add comment error:', error);
    res.status(500).json({ message: 'Failed to add comment' });
  }
};

/**
 * DELETE /api/forum/posts/:id
 * Deletes a post. Only the post owner can delete.
 */
const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Only post owner or admin can delete
    if (post.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this post' });
    }

    await Post.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Post deleted' });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ message: 'Failed to delete post' });
  }
};

/**
 * DELETE /api/forum/comments/:postId/:commentId
 * Deletes a comment. Only the comment owner can delete.
 */
const deleteComment = async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const comment = post.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Only comment owner can delete
    if (comment.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this comment' });
    }

    post.comments.pull(commentId);
    await post.save();

    const populatedPost = await Post.findById(post._id)
      .populate('userId', 'name email')
      .populate('likes', 'name')
      .populate('comments.userId', 'name email')
      .lean();

    res.status(200).json(populatedPost);
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ message: 'Failed to delete comment' });
  }
};

module.exports = {
  getPosts,
  createPost,
  toggleLike,
  addComment,
  deletePost,
  deleteComment,
};
