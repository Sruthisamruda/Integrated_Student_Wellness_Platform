/**
 * Future Wellness Prediction (Digital Twin) controller.
 *
 * Provides:
 * - GET  /api/wellness/future-prediction
 * - POST /api/wellness/future-prediction/simulate
 */

const MoodHistory = require('../models/MoodHistory');
const Assignment = require('../models/Assignment');
const RelaxationSession = require('../models/RelaxationSession');
const { predictScenario } = require('../services/futureWellnessPredictionService');

const clampInt = (value, min, max) => {
  const n = Number.isFinite(value) ? Math.floor(value) : min;
  return Math.max(min, Math.min(max, n));
};

const getBaseMetrics = async (userId) => {
  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const in3d = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  // We treat "recent" as last 3 days, matching the 2–3 day prediction window.
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

  const [latestMood, pendingTasks, overdueTasks, completedTasksRecent, deadlinesWithin24h, deadlinesWithin3days, relaxationRecentCount] =
    await Promise.all([
      MoodHistory.findOne({ user: userId }).sort({ createdAt: -1 }).lean(),
      Assignment.countDocuments({ user: userId, completed: false }),
      Assignment.countDocuments({ user: userId, completed: false, dueDate: { $lt: now } }),
      // Recent completion progress affects stress reduction.
      Assignment.countDocuments({ user: userId, completed: true, updatedAt: { $gte: threeDaysAgo } }),
      Assignment.countDocuments({ user: userId, completed: false, dueDate: { $gte: now, $lte: in24h } }),
      Assignment.countDocuments({ user: userId, completed: false, dueDate: { $gt: in24h, $lte: in3d } }),
      RelaxationSession.countDocuments({ user: userId, createdAt: { $gte: threeDaysAgo } }),
    ]);

  const currentMoodScore =
    latestMood?.hybridScore ??
    latestMood?.moodScore ??
    latestMood?.finalScoreClamped ??
    12;

  const currentMoodCategory =
    latestMood?.hybridMoodCategory ??
    latestMood?.moodCategory ??
    null;

  return {
    currentMoodScore,
    currentMoodCategory,
    pendingTasks,
    completedTasks: completedTasksRecent,
    overdueTasks,
    deadlinesWithin24h,
    deadlinesWithin3days,
    relaxationRecentCount,
  };
};

const getFutureWellnessPrediction = async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      return res.status(403).json({ message: 'Admins cannot access future wellness prediction' });
    }

    const baseMetrics = await getBaseMetrics(req.user.id);

    // Current path: no changes
    const currentScenario = predictScenario({
      scenario: 'current',
      baseMetrics,
      adjustments: { completeTasksToday: 0, relaxationAdded: 0 },
    });

    // Improved path: complete 1–2 tasks today + add a couple of short relaxation sessions.
    const completeTasksToday = baseMetrics.pendingTasks > 0 ? Math.min(2, baseMetrics.pendingTasks) : 0;
    const relaxationAdded = 2;

    const improvedScenario = predictScenario({
      scenario: 'improved',
      baseMetrics,
      adjustments: { completeTasksToday, relaxationAdded },
    });

    res.status(200).json({
      baseMetrics,
      currentScenario,
      improvedScenario,
    });
  } catch (err) {
    console.error('Future wellness prediction error:', err);
    res.status(500).json({ message: 'Failed to generate future wellness prediction' });
  }
};

const simulateFutureWellnessPrediction = async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      return res.status(403).json({ message: 'Admins cannot access future wellness prediction simulation' });
    }

    const {
      baseMetrics: providedBaseMetrics,
      completeTasksToday,
      relaxationAdded,
    } = req.body || {};

    const baseMetrics = providedBaseMetrics ? { ...providedBaseMetrics } : await getBaseMetrics(req.user.id);

    const safeComplete = clampInt(completeTasksToday, 0, 10);
    const safeRelax = clampInt(relaxationAdded, 0, 10);

    const simulatedScenario = predictScenario({
      scenario: 'improved',
      baseMetrics,
      adjustments: { completeTasksToday: safeComplete, relaxationAdded: safeRelax },
    });

    res.status(200).json({
      baseMetrics,
      simulatedScenario,
    });
  } catch (err) {
    console.error('Future wellness prediction simulation error:', err);
    res.status(500).json({ message: 'Failed to simulate future wellness prediction' });
  }
};

module.exports = {
  getFutureWellnessPrediction,
  simulateFutureWellnessPrediction,
};

