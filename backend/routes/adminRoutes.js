/**
 * Admin routes: protected by auth + admin role.
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');
const {
  getStats,
  getMoodStats,
  getStudyStats,
  getRelaxationStats,
  getUserStats,
  getUsers,
  getForumStats,
} = require('../controllers/adminController');

router.use(protect);
router.use(adminOnly);

router.get('/stats', getStats);
router.get('/mood-stats', getMoodStats);
router.get('/study-stats', getStudyStats);
router.get('/relaxation-stats', getRelaxationStats);
router.get('/user-stats', getUserStats);
router.get('/forum-stats', getForumStats);
router.get('/users', getUsers);

module.exports = router;
