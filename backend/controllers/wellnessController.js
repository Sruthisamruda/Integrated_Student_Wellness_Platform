/**
 * Wellness controller: Daily Wellness Plan generation.
 */

const MoodHistory = require('../models/MoodHistory');
const Assignment = require('../models/Assignment');
const RelaxationSession = require('../models/RelaxationSession');

/**
 * GET /api/wellness/daily-plan
 * Generates a personalized daily plan based on mood, tasks, deadlines, overdue, relaxation.
 */
const getDailyPlan = async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      return res.status(403).json({ message: 'Admins cannot access daily wellness plan' });
    }

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const in3d = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    const [
      latestMood,
      pendingTasks,
      overdueTasks,
      highPriorityPending,
      deadlines24h,
      deadlines3d,
      relaxationToday,
    ] = await Promise.all([
      MoodHistory.findOne({ user: req.user.id }).sort({ createdAt: -1 }).lean(),
      Assignment.countDocuments({ user: req.user.id, completed: false }),
      Assignment.countDocuments({ user: req.user.id, completed: false, dueDate: { $lt: now } }),
      Assignment.find({ user: req.user.id, completed: false, priority: 'high' }).limit(5).lean(),
      Assignment.countDocuments({
        user: req.user.id,
        completed: false,
        dueDate: { $gte: now, $lte: in24h },
      }),
      Assignment.countDocuments({
        user: req.user.id,
        completed: false,
        dueDate: { $gt: in24h, $lte: in3d },
      }),
      RelaxationSession.countDocuments({
        user: req.user.id,
        createdAt: { $gte: startOfToday, $lte: endOfToday },
      }),
    ]);

    const plan = [];
    const moodScore = latestMood?.hybridScore ?? latestMood?.moodScore ?? latestMood?.finalScoreClamped ?? 12;
    const isHighStress = moodScore >= 19 || overdueTasks >= 2 || deadlines24h >= 2;
    const hasManyDeadlines = deadlines24h >= 2 || deadlines3d >= 3;

    if (hasManyDeadlines || pendingTasks >= 3) {
      const taskCount = Math.min(highPriorityPending.length || 2, 3);
      if (taskCount > 0) {
        plan.push(`Complete ${taskCount} high-priority task${taskCount > 1 ? 's' : ''}`);
      } else {
        plan.push('Complete 2 high-priority tasks');
      }
    }

    if (isHighStress) {
      plan.push('Take a 10-minute walk break');
      plan.push('Try a breathing exercise');
      if (relaxationToday < 2) {
        plan.push('Listen to calming music for 5–10 minutes');
      }
    } else {
      plan.push('Take a 10-minute walk break');
      plan.push('Try a breathing exercise');
    }

    plan.push('Review study planner in the evening');

    if (overdueTasks >= 2 && !plan.some((p) => p.includes('organize'))) {
      plan.splice(1, 0, 'Organize overdue tasks by priority');
    }

    res.status(200).json({
      plan,
      context: {
        pendingTasks,
        overdueTasks,
        deadlinesWithin24h: deadlines24h,
        deadlinesWithin3days: deadlines3d,
        relaxationToday,
        moodScore,
      },
    });
  } catch (err) {
    console.error('Get daily plan error:', err);
    res.status(500).json({ message: 'Failed to generate daily wellness plan' });
  }
};

module.exports = {
  getDailyPlan,
};
