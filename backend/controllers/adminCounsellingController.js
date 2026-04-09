/**
 * Admin counselling features:
 * - POST /api/admin/counselling
 * - GET  /api/admin/students-stress
 */

const User = require('../models/User');
const MoodHistory = require('../models/MoodHistory');
const Assignment = require('../models/Assignment');
const RelaxationSession = require('../models/RelaxationSession');
const CounsellingSession = require('../models/CounsellingSession');
const { predictScenario } = require('../services/futureWellnessPredictionService');

const mapMoodCategoryForAdminDisplay = (moodCategory) => {
  // Admin UI requirement doesn't mention "Happy / Balanced".
  if (moodCategory === 'Happy / Balanced') return 'Calm';
  return moodCategory || 'Calm';
};

const getBaseMetricsForUser = async (userId) => {
  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const in3d = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  // Match the "next 2–3 days" prediction window with a 3-day "recent" lookback.
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

  const [latestMood, pendingTasks, overdueTasks, completedTasksRecent, deadlinesWithin24h, deadlinesWithin3days, relaxationRecentCount] =
    await Promise.all([
      MoodHistory.findOne({ user: userId }).sort({ createdAt: -1 }).lean(),
      Assignment.countDocuments({ user: userId, completed: false }),
      Assignment.countDocuments({ user: userId, completed: false, dueDate: { $lt: now } }),
      Assignment.countDocuments({ user: userId, completed: true, updatedAt: { $gte: threeDaysAgo } }),
      Assignment.countDocuments({
        user: userId,
        completed: false,
        dueDate: { $gte: now, $lte: in24h },
      }),
      Assignment.countDocuments({
        user: userId,
        completed: false,
        dueDate: { $gt: in24h, $lte: in3d },
      }),
      RelaxationSession.countDocuments({ user: userId, createdAt: { $gte: threeDaysAgo } }),
    ]);

  const currentMoodScore = latestMood?.hybridScore ?? latestMood?.moodScore ?? latestMood?.finalScoreClamped ?? 12;
  const currentMoodCategory = latestMood?.hybridMoodCategory ?? latestMood?.moodCategory ?? null;

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

const createCounsellingSession = async (req, res) => {
  try {
    const { userId, date, time, mode, notes } = req.body || {};

    if (!userId) return res.status(400).json({ message: 'userId is required' });
    if (!date) return res.status(400).json({ message: 'date is required' });
    if (!time) return res.status(400).json({ message: 'time is required' });
    if (!mode) return res.status(400).json({ message: 'mode is required' });

    const allowedModes = ['Online', 'Offline'];
    const modeSafe = allowedModes.includes(mode) ? mode : null;
    if (!modeSafe) return res.status(400).json({ message: 'mode must be Online or Offline' });

    const user = await User.findById(userId).select('id name role email').lean();
    if (!user) return res.status(404).json({ message: 'Student not found' });
    if (user.role !== 'user') return res.status(400).json({ message: 'Only students can be scheduled' });

    // Parse date in local time to avoid UTC day-shift issues.
    const scheduledDate = new Date(`${date}T00:00:00`);
    if (Number.isNaN(scheduledDate.getTime())) return res.status(400).json({ message: 'Invalid date' });

    const timeSafe = String(time).trim().slice(0, 20);
    const notesSafe = (notes || '').toString().trim().slice(0, 2000);

    const session = await CounsellingSession.create({
      userId,
      scheduledBy: req.user.id,
      date: scheduledDate,
      time: timeSafe,
      mode: modeSafe,
      notes: notesSafe,
      status: 'upcoming',
    });

    res.status(201).json({
      id: session._id,
      userId: session.userId,
      scheduledBy: session.scheduledBy,
      date: session.date,
      time: session.time,
      mode: session.mode,
      notes: session.notes,
      status: session.status,
      createdAt: session.createdAt,
    });
  } catch (err) {
    console.error('Create counselling error:', err);
    res.status(500).json({ message: 'Failed to create counselling session' });
  }
};

const getStudentsStressOverview = async (req, res) => {
  try {
    const students = await User.find({ role: 'user' }).select('name email').lean();

    const now = new Date();
    const list = await Promise.all(
      students.map(async (s) => {
        const baseMetrics = await getBaseMetricsForUser(s._id);
        const prediction = predictScenario({
          scenario: 'current',
          baseMetrics,
          adjustments: { completeTasksToday: 0, relaxationAdded: 0 },
        });

        const moodCategory = mapMoodCategoryForAdminDisplay(baseMetrics.currentMoodCategory);

        return {
          userId: s._id,
          name: s.name || s.email?.split('@')?.[0] || 'Student',
          moodCategory,
          stressLevel: prediction.predictedStressLevel,
          pendingTasks: baseMetrics.pendingTasks,
          overdueTasks: baseMetrics.overdueTasks,
          recentMood: moodCategory,
          predictedStressScore: prediction.futureStressScore,
          // Keep original category for UI conditions if needed.
          rawMoodCategory: baseMetrics.currentMoodCategory,
          // Useful for client-side ordering.
          computedAt: now,
        };
      }),
    );

    res.status(200).json({ students: list });
  } catch (err) {
    console.error('Students stress overview error:', err);
    res.status(500).json({ message: 'Failed to fetch students stress overview' });
  }
};

module.exports = {
  createCounsellingSession,
  getStudentsStressOverview,
};

