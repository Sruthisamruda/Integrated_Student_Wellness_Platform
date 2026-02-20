/**
 * Admin controller: comprehensive analytics endpoints for dashboard.
 * All routes require admin role.
 */

const User = require('../models/User');
const Mood = require('../models/Mood');
const Assignment = require('../models/Assignment');
const RelaxationSession = require('../models/RelaxationSession');
const Post = require('../models/Post');

/**
 * GET /api/admin/stats
 * Returns basic counts: users, moods, assignments.
 */
const getStats = async (req, res) => {
  try {
    const [userCount, moodCount, assignmentCount] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      Mood.countDocuments(),
      Assignment.countDocuments(),
    ]);
    res.status(200).json({
      users: userCount,
      moods: moodCount,
      assignments: assignmentCount,
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ message: 'Failed to fetch stats' });
  }
};

/**
 * GET /api/admin/mood-stats
 * Returns mood analytics: distribution, trends over time.
 */
const getMoodStats = async (req, res) => {
  try {
    // Mood distribution (count by mood type)
    const moodDistribution = await Mood.aggregate([
      { $group: { _id: '$mood', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Mood trends over last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const moodTrends = await Mood.aggregate([
      { $match: { date: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Format distribution
    const distribution = moodDistribution.map((item) => ({
      mood: item._id,
      count: item.count,
    }));

    // Format trends
    const trends = moodTrends.map((item) => ({
      date: item._id,
      count: item.count,
    }));

    res.status(200).json({
      distribution,
      trends,
      total: await Mood.countDocuments(),
    });
  } catch (error) {
    console.error('Admin mood stats error:', error);
    res.status(500).json({ message: 'Failed to fetch mood stats' });
  }
};

/**
 * GET /api/admin/study-stats
 * Returns study planner analytics: completed vs pending, trends.
 */
const getStudyStats = async (req, res) => {
  try {
    const [completed, pending, total] = await Promise.all([
      Assignment.countDocuments({ completed: true }),
      Assignment.countDocuments({ completed: false }),
      Assignment.countDocuments(),
    ]);

    // Tasks completed per day over last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const completionTrends = await Assignment.aggregate([
      {
        $match: {
          completed: true,
          updatedAt: { $gte: sevenDaysAgo },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$updatedAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const trends = completionTrends.map((item) => ({
      date: item._id,
      count: item.count,
    }));

    res.status(200).json({
      completed,
      pending,
      total,
      trends,
    });
  } catch (error) {
    console.error('Admin study stats error:', error);
    res.status(500).json({ message: 'Failed to fetch study stats' });
  }
};

/**
 * GET /api/admin/relaxation-stats
 * Returns relaxation usage analytics.
 */
const getRelaxationStats = async (req, res) => {
  try {
    const totalSessions = await RelaxationSession.countDocuments();

    // Activity type distribution
    const activityDistribution = await RelaxationSession.aggregate([
      { $group: { _id: '$activityType', count: { $sum: 1 } } },
    ]);

    // Weekly usage trend (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const weeklyTrends = await RelaxationSession.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Most used activity
    const mostUsed = activityDistribution.sort((a, b) => b.count - a.count)[0];

    const distribution = activityDistribution.map((item) => ({
      activity: item._id,
      count: item.count,
    }));

    const trends = weeklyTrends.map((item) => ({
      date: item._id,
      count: item.count,
    }));

    res.status(200).json({
      totalSessions,
      mostUsedActivity: mostUsed?._id || 'breathing',
      distribution,
      trends,
    });
  } catch (error) {
    console.error('Admin relaxation stats error:', error);
    // Return dummy data if model doesn't exist yet
    res.status(200).json({
      totalSessions: 0,
      mostUsedActivity: 'breathing',
      distribution: [],
      trends: [],
    });
  }
};

/**
 * GET /api/admin/user-stats
 * Returns user statistics: total, active, new users.
 */
const getUserStats = async (req, res) => {
  try {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const total = await User.countDocuments({ role: 'user' });
    const newThisMonth = await User.countDocuments({
      role: 'user',
      createdAt: { $gte: monthAgo },
    });

    // Active = users who logged mood or assignment in last week
    const activeMoods = await Mood.distinct('user', {
      date: { $gte: weekAgo },
    });
    const activeAssignments = await Assignment.distinct('user', {
      updatedAt: { $gte: weekAgo },
    });
    const activeThisWeek = new Set([...activeMoods, ...activeAssignments]).size;

    res.status(200).json({
      total,
      activeThisWeek,
      newThisMonth,
    });
  } catch (error) {
    console.error('Admin user stats error:', error);
    res.status(500).json({ message: 'Failed to fetch user stats' });
  }
};

/**
 * GET /api/admin/users
 * Returns all users (id, email, name, role, createdAt).
 */
const getUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 })
      .lean();
    res.status(200).json(users);
  } catch (error) {
    console.error('Admin getUsers error:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
};

/**
 * GET /api/admin/forum-stats
 * Returns forum analytics: posts, comments, likes, engagement trends.
 */
const getForumStats = async (req, res) => {
  try {
    const totalPosts = await Post.countDocuments();
    const totalComments = await Post.aggregate([
      { $project: { commentCount: { $size: '$comments' } } },
      { $group: { _id: null, total: { $sum: '$commentCount' } } },
    ]);
    const totalLikes = await Post.aggregate([
      { $project: { likeCount: { $size: '$likes' } } },
      { $group: { _id: null, total: { $sum: '$likeCount' } } },
    ]);

    // Most active student (by post count)
    const mostActive = await Post.aggregate([
      { $group: { _id: '$userId', postCount: { $sum: 1 } } },
      { $sort: { postCount: -1 } },
      { $limit: 1 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      { $project: { userId: '$_id', name: '$user.name', email: '$user.email', postCount: 1 } },
    ]);

    // Engagement trend (posts per day, last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const engagementTrend = await Post.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Top 5 most liked posts
    const topPosts = await Post.find()
      .populate('userId', 'name email')
      .lean()
      .then((posts) => {
        return posts
          .map((p) => ({
            _id: p._id,
            content: p.content.substring(0, 100) + (p.content.length > 100 ? '...' : ''),
            author: p.userId?.name || 'Unknown',
            likes: p.likes?.length || 0,
            comments: p.comments?.length || 0,
          }))
          .sort((a, b) => b.likes - a.likes)
          .slice(0, 5);
      });

    res.status(200).json({
      totalPosts,
      totalComments: totalComments[0]?.total || 0,
      totalLikes: totalLikes[0]?.total || 0,
      mostActiveStudent: mostActive[0] || null,
      engagementTrend: engagementTrend.map((item) => ({ date: item._id, count: item.count })),
      topPosts,
    });
  } catch (error) {
    console.error('Admin forum stats error:', error);
    res.status(500).json({ message: 'Failed to fetch forum stats' });
  }
};

module.exports = {
  getStats,
  getMoodStats,
  getStudyStats,
  getRelaxationStats,
  getUserStats,
  getUsers,
  getForumStats,
};
