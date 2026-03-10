const mongoose = require('mongoose');
const Question = require('../models/Question');
const MoodHistory = require('../models/MoodHistory');
const Assignment = require('../models/Assignment');
const RelaxationSession = require('../models/RelaxationSession');

const BASE_OPTIONS = [
  { text: 'Never', score: 1 },
  { text: 'Rarely', score: 2 },
  { text: 'Sometimes', score: 3 },
  { text: 'Often', score: 4 },
  { text: 'Always', score: 5 },
];

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const mapMoodLevel = (score) => {
  if (score >= 5 && score <= 9) return 'Happy / Balanced';
  if (score >= 10 && score <= 14) return 'Calm';
  if (score >= 15 && score <= 18) return 'Mild Stress';
  if (score >= 19 && score <= 21) return 'Anxious';
  return 'Highly Stressed';
};

// Hybrid mood mapping (0–9, 10–14, 15–18, 19–21, 22+)
const mapHybridMood = (score) => {
  if (score <= 9) return 'Happy / Balanced';
  if (score <= 14) return 'Calm';
  if (score <= 18) return 'Mild Stress';
  if (score <= 21) return 'Anxious';
  return 'Highly Stressed';
};

// Academic-stress-only mood mapping (0+ stress score)
const mapAcademicStressMood = (stressScore) => {
  if (stressScore <= 2) return 'Calm';
  if (stressScore <= 4) return 'Mild Stress';
  if (stressScore <= 6) return 'Stressed';
  return 'Highly Stressed';
};

const suggestionsForLevel = (level) => {
  if (level === 'Happy / Balanced') {
    return [
      'Continue your study schedule',
      'Try a creative activity',
      'Listen to your favorite music',
    ];
  }
  if (level === 'Calm') {
    return ['Light stretching', 'Listen to relaxing music', 'Short walk outside'];
  }
  if (level === 'Mild Stress') {
    return [
      'Play a short game',
      'Take a 10 minute break',
      'Listen to music',
      'Talk with a friend',
    ];
  }
  if (level === 'Anxious') {
    return [
      'Guided breathing exercise',
      'Go for a walk',
      'Listen to calming music',
      "Reduce today's study load",
    ];
  }
  return [
    'Take a longer break',
    'Go outside for a walk',
    'Play a relaxing game',
    'Listen to calming songs',
    'Try a short meditation session',
  ];
};

// Suggestions for academic stress prediction categories
const suggestionsForAcademicStress = (mood) => {
  if (mood === 'Calm') {
    return [
      'Light stretching',
      'Listen to relaxing music',
      'Take a short walk',
      'Review and tidy your study planner',
    ];
  }
  if (mood === 'Mild Stress') {
    return [
      'Take a 10 minute break',
      'Listen to your favourite music',
      'Play a short mini game',
      'Organize today’s tasks into a simple list',
    ];
  }
  if (mood === 'Stressed') {
    return [
      'Guided breathing exercise for a few minutes',
      'Go for a short walk',
      'Stretch your neck, shoulders, and back',
      'Write down and prioritize your tasks',
      'Capture your thoughts in a short journal entry',
    ];
  }
  // Highly Stressed
  return [
    'Take a longer break away from your desk',
    'Go outside for a walk and fresh air',
    'Try slow breathing exercises',
    'Listen to calm, low-tempo music',
    'Write your worries and next small steps in a journal',
  ];
};

const motivationalMessage = (level) => {
  if (level === 'Happy / Balanced') {
    return 'You are doing well. Keep a steady pace and make time for things you enjoy.';
  }
  if (level === 'Calm') {
    return 'Nice balance. Small breaks will help you stay focused and refreshed.';
  }
  if (level === 'Mild Stress') {
    return 'A little stress is normal. A short reset can help you regain control.';
  }
  if (level === 'Anxious') {
    return 'You are not alone. Slow down, breathe, and focus on one small step at a time.';
  }
  return 'Your wellbeing matters. Consider taking a longer break and reaching out for support if needed.';
};

const getStudyPlannerStats = async (userId) => {
  const now = new Date();
  const [pendingTasks, overdueTasks, completedTasks] = await Promise.all([
    Assignment.countDocuments({ user: userId, completed: false }),
    Assignment.countDocuments({ user: userId, completed: false, dueDate: { $lt: now } }),
    Assignment.countDocuments({ user: userId, completed: true }),
  ]);
  return { pendingTasks, overdueTasks, completedTasks };
};

const computeStressModifier = ({ pendingTasks, overdueTasks, completedTasks }) => {
  let modifier = 0;
  if (pendingTasks > 5) modifier += 2;
  if (overdueTasks > 3) modifier += 3;
  if (completedTasks > pendingTasks) modifier -= 1;
  return modifier;
};

// Planner stress score (0–7+) for hybrid mood
const computePlannerStressScore = async (userId) => {
  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const in3d = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const [pendingTasks, overdueTasks, completedTasks, within24, within3] = await Promise.all([
    Assignment.countDocuments({ user: userId, completed: false }),
    Assignment.countDocuments({ user: userId, completed: false, dueDate: { $lt: now } }),
    Assignment.countDocuments({ user: userId, completed: true }),
    Assignment.countDocuments({ user: userId, completed: false, dueDate: { $gte: now, $lte: in24h } }),
    Assignment.countDocuments({ user: userId, completed: false, dueDate: { $gt: in24h, $lte: in3d } }),
  ]);
  let score = 0;
  if (pendingTasks >= 5) score += 2;
  if (overdueTasks >= 2) score += 3;
  if (within24 >= 2) score += 3;
  if (within3 >= 3) score += 2;
  if (completedTasks > pendingTasks) score -= 1;
  return Math.max(0, score);
};

// GET /api/mood/questions?limit=5
const getQuestions = async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      return res.status(403).json({ message: 'Admins cannot take mood assessments' });
    }

    const raw = Number(req.query.limit ?? 5);
    const limit = Number.isFinite(raw) ? clamp(Math.floor(raw), 1, 10) : 5;

    const total = await Question.countDocuments();
    if (!total) {
      return res.status(200).json([]);
    }

    const questions =
      total <= limit
        ? await Question.find().lean()
        : await Question.aggregate([{ $sample: { size: limit } }]);

    const normalized = questions.map((q) => ({
      ...q,
      options: Array.isArray(q.options) && q.options.length === 5 ? q.options : BASE_OPTIONS,
    }));

    res.status(200).json(normalized);
  } catch (err) {
    console.error('Get assessment questions error:', err);
    res.status(500).json({ message: 'Failed to fetch questions' });
  }
};

const normalizeAnswers = (answers) => {
  if (Array.isArray(answers)) return answers;
  if (answers && typeof answers === 'object') {
    return Object.entries(answers).map(([questionId, score]) => ({ questionId, score }));
  }
  return [];
};

// POST /api/mood/submit
const submitAssessment = async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      return res.status(403).json({ message: 'Admins cannot take mood assessments' });
    }

    const answers = normalizeAnswers(req.body.answers);
    if (!Array.isArray(answers) || answers.length !== 5) {
      return res.status(400).json({ message: 'Please answer exactly 5 questions' });
    }

    const ids = [...new Set(answers.map((a) => a.questionId).filter(Boolean))];
    if (ids.length !== 5) {
      return res.status(400).json({ message: 'Answers must contain 5 unique questions' });
    }

    const objectIds = [];
    for (const id of ids) {
      if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({ message: 'Invalid question id in answers' });
      }
      objectIds.push(new mongoose.Types.ObjectId(id));
    }
    const questions = await Question.find({ _id: { $in: objectIds } }).lean();
    if (questions.length !== 5) {
      return res.status(400).json({ message: 'One or more questions were not found' });
    }

    let questionnaireScore = 0;
    for (const ans of answers) {
      const scoreNum = Number(ans.score);
      if (!Number.isFinite(scoreNum) || scoreNum < 1 || scoreNum > 5) {
        return res.status(400).json({ message: 'Each answer score must be between 1 and 5' });
      }
      questionnaireScore += scoreNum;
    }

    const studyStats = await getStudyPlannerStats(req.user.id);
    const stressModifier = computeStressModifier(studyStats);
    const finalScore = questionnaireScore + stressModifier;
    const finalScoreClamped = clamp(finalScore, 5, 25);
    const moodLevel = mapMoodLevel(finalScoreClamped);

    // Hybrid mood: (Questionnaire × 0.6) + (PlannerStress × 0.4)
    const plannerRaw = await computePlannerStressScore(req.user.id);
    const plannerScaled = Math.min(plannerRaw, 7) * (25 / 7);
    const hybridScore = Math.round((questionnaireScore * 0.6) + (plannerScaled * 0.4) * 10) / 10;
    const hybridMoodCategory = mapHybridMood(hybridScore);
    const activities = suggestionsForLevel(hybridMoodCategory);

    await MoodHistory.create({
      user: req.user.id,
      moodScore: finalScoreClamped,
      moodCategory: moodLevel,
      suggestedActivities: activities,
      questionnaireScore,
      pendingTasks: studyStats.pendingTasks,
      overdueTasks: studyStats.overdueTasks,
      completedTasks: studyStats.completedTasks,
      stressModifier,
      finalScore,
      finalScoreClamped,
      plannerStressScore: plannerRaw,
      hybridScore,
      hybridMoodCategory,
    });

    res.status(200).json({
      moodLevel: hybridMoodCategory,
      hybridScore,
      hybridMoodCategory,
      questionnaireScore,
      stressModifier,
      finalScore,
      finalScoreClamped,
      studyPlanner: studyStats,
      suggestedActivities: activities,
      motivationalMessage: motivationalMessage(hybridMoodCategory),
    });
  } catch (err) {
    console.error('Submit assessment error:', err);
    res.status(500).json({ message: 'Failed to submit assessment' });
  }
};

// GET /api/mood/history?limit=30
const getHistory = async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      return res.status(403).json({ message: 'Admins cannot take mood assessments' });
    }

    const raw = Number(req.query.limit ?? 30);
    const limit = Number.isFinite(raw) ? clamp(Math.floor(raw), 1, 365) : 30;

    const entries = await MoodHistory.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const data = entries
      .reverse()
      .map((e) => ({
        id: e._id,
        date: new Date(e.createdAt).toISOString().slice(0, 10),
        moodLevel: e.moodCategory,
        finalScore: e.finalScore,
        finalScoreClamped: e.finalScoreClamped,
        questionnaireScore: e.questionnaireScore,
        stressModifier: e.stressModifier,
      }));

    res.status(200).json(data);
  } catch (err) {
    console.error('Get assessment history error:', err);
    res.status(500).json({ message: 'Failed to fetch assessment history' });
  }
};

// GET /api/mood/academic-stress
// Computes a deadline-based academic stress score and predicted mood.
const getAcademicStress = async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      return res.status(403).json({ message: 'Admins cannot use academic stress prediction' });
    }

    const now = new Date();
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const in3d = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    const [totalTasks, pendingTasks, completedTasks, overdueTasks, within24, within3] =
      await Promise.all([
        Assignment.countDocuments({ user: req.user.id }),
        Assignment.countDocuments({ user: req.user.id, completed: false }),
        Assignment.countDocuments({ user: req.user.id, completed: true }),
        Assignment.countDocuments({ user: req.user.id, completed: false, dueDate: { $lt: now } }),
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
      ]);

    let stressScore = 0;
    if (pendingTasks >= 5) stressScore += 2;
    if (overdueTasks >= 2) stressScore += 3;
    if (within24 >= 2) stressScore += 3;
    if (within3 >= 3) stressScore += 2;
    if (completedTasks > pendingTasks) stressScore -= 1;
    if (stressScore < 0) stressScore = 0;

    const predictedMood = mapAcademicStressMood(stressScore);

    // Check if there is a mood assessment for today
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const todayAssessment = await MoodHistory.findOne({
      user: req.user.id,
      createdAt: { $gte: startOfToday, $lte: endOfToday },
    })
      .sort({ createdAt: -1 })
      .lean();

    let combinedStressScore = null;
    let combinedPredictedMood = predictedMood;
    let hasQuestionnaireToday = false;

    if (todayAssessment) {
      hasQuestionnaireToday = true;
      // Map questionnaire mood category to a small stress offset
      const moodToOffset = {
        'Happy / Balanced': 0,
        Calm: 0,
        'Mild Stress': 1,
        Anxious: 2,
        'Highly Stressed': 3,
      };
      const baseOffset = moodToOffset[todayAssessment.moodCategory] ?? 0;
      combinedStressScore = Math.max(0, stressScore + baseOffset);
      combinedPredictedMood = mapAcademicStressMood(combinedStressScore);
    }

    const upcomingDeadlines = within24 + within3;
    const suggestions = suggestionsForAcademicStress(combinedPredictedMood || predictedMood);

    // Smart stress alerts
    const alertActions = [
      'Start breathing exercise',
      'Take a short walk',
      'Organize study tasks',
      'Listen to relaxing music',
    ];
    const alerts = [];
    if (within24 >= 2) {
      alerts.push({
        type: 'deadlines_24h',
        message: 'You have several deadlines approaching in the next 24 hours. Consider prioritizing urgent tasks.',
        recommendedActions: alertActions,
      });
    }
    if (overdueTasks >= 2) {
      alerts.push({
        type: 'overdue',
        message: 'You have multiple overdue tasks. Try organizing your planner and taking short breaks.',
        recommendedActions: alertActions,
      });
    }
    if (pendingTasks >= 5) {
      alerts.push({
        type: 'pending',
        message: 'You have many pending tasks. Consider organizing your planner and taking short breaks.',
        recommendedActions: alertActions,
      });
    }
    if (stressScore >= 5 && alerts.length === 0) {
      alerts.push({
        type: 'high_stress',
        message: 'High academic stress detected. Take a moment to breathe and prioritize your tasks.',
        recommendedActions: alertActions,
      });
    }

    res.status(200).json({
      totalTasks,
      pendingTasks,
      completedTasks,
      overdueTasks,
      deadlinesWithin24h: within24,
      deadlinesWithin3days: within3,
      upcomingDeadlines,
      stressScore,
      predictedMood,
      combinedStressScore,
      combinedPredictedMood,
      hasQuestionnaireToday,
      suggestions,
      alerts,
    });
  } catch (err) {
    console.error('Get academic stress error:', err);
    res.status(500).json({ message: 'Failed to compute academic stress prediction' });
  }
};

// GET /api/mood/latest
const getLatest = async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      return res.status(403).json({ message: 'Admins cannot take mood assessments' });
    }

    const latest = await MoodHistory.findOne({ user: req.user.id }).sort({ createdAt: -1 }).lean();
    if (!latest) {
      return res.status(200).json(null);
    }

    const effectiveMood = latest.hybridMoodCategory || latest.moodCategory;
    const effectiveScore = latest.hybridScore ?? latest.moodScore;

    res.status(200).json({
      id: latest._id,
      createdAt: latest.createdAt,
      moodScore: effectiveScore,
      moodCategory: effectiveMood,
      hybridScore: latest.hybridScore,
      hybridMoodCategory: latest.hybridMoodCategory,
      suggestedActivities: latest.suggestedActivities || [],
      questionnaireScore: latest.questionnaireScore,
      stressModifier: latest.stressModifier,
      pendingTasks: latest.pendingTasks,
      overdueTasks: latest.overdueTasks,
      completedTasks: latest.completedTasks,
    });
  } catch (err) {
    console.error('Get latest mood error:', err);
    res.status(500).json({ message: 'Failed to fetch latest mood' });
  }
};

// GET /api/mood/weekly-report
const getWeeklyReport = async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      return res.status(403).json({ message: 'Admins cannot access weekly wellness report' });
    }

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [moodEntries, completedTasks, pendingTasks, relaxationSessions] = await Promise.all([
      MoodHistory.find({ user: req.user.id, createdAt: { $gte: weekAgo } }).lean(),
      Assignment.countDocuments({ user: req.user.id, completed: true }),
      Assignment.countDocuments({ user: req.user.id, completed: false }),
      RelaxationSession.find({ user: req.user.id, createdAt: { $gte: weekAgo } }).lean(),
    ]);

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const byDay = {};
    dayNames.forEach((d) => (byDay[d] = { sum: 0, count: 0 }));

    let totalScore = 0;
    let totalCount = 0;
    for (const e of moodEntries) {
      const score = e.hybridScore ?? e.moodScore ?? e.finalScoreClamped ?? 0;
      const d = new Date(e.createdAt);
      const dayName = dayNames[d.getDay()];
      byDay[dayName].sum += score;
      byDay[dayName].count += 1;
      totalScore += score;
      totalCount += 1;
    }

    const averageMoodScore = totalCount > 0 ? Math.round((totalScore / totalCount) * 10) / 10 : null;

    let mostStressfulDay = null;
    let maxAvg = -1;
    for (const [day, data] of Object.entries(byDay)) {
      if (data.count > 0) {
        const avg = data.sum / data.count;
        if (avg > maxAvg) {
          maxAvg = avg;
          mostStressfulDay = day;
        }
      }
    }

    const moodTrendByDay = dayNames.map((day) => ({
      day,
      avgScore: byDay[day].count > 0 ? Math.round((byDay[day].sum / byDay[day].count) * 10) / 10 : null,
      count: byDay[day].count,
    }));

    const relaxationByType = {};
    for (const s of relaxationSessions) {
      const t = s.activityType || 'other';
      relaxationByType[t] = (relaxationByType[t] || 0) + 1;
    }

    const insights = [];
    if (averageMoodScore !== null) {
      insights.push(`Your average mood this week was ${averageMoodScore.toFixed(1)}.`);
    }
    if (mostStressfulDay) {
      insights.push(`Your stress level was highest on ${mostStressfulDay} due to multiple approaching deadlines.`);
    }
    insights.push(`Productivity: ${completedTasks} tasks completed, ${pendingTasks} pending.`);
    if (relaxationSessions.length > 0) {
      const types = Object.entries(relaxationByType).map(([k, v]) => `${k} (${v})`).join(', ');
      insights.push(`Relaxation activities used: ${types}.`);
    }

    res.status(200).json({
      averageMoodScore,
      mostStressfulDay,
      completedTasks,
      pendingTasks,
      relaxationActivitiesUsed: relaxationSessions.length,
      relaxationByType,
      moodTrendByDay,
      insights,
    });
  } catch (err) {
    console.error('Get weekly report error:', err);
    res.status(500).json({ message: 'Failed to generate weekly wellness report' });
  }
};

const MOOD_COLORS = {
  'Happy / Balanced': '#22c55e',
  Calm: '#3b82f6',
  'Mild Stress': '#eab308',
  Anxious: '#f97316',
  'Highly Stressed': '#ef4444',
  Stressed: '#f97316',
};

// GET /api/mood/calendar?year=2025&month=1
const getCalendar = async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      return res.status(403).json({ message: 'Admins cannot access mood calendar' });
    }

    const year = parseInt(req.query.year, 10) || new Date().getFullYear();
    const month = parseInt(req.query.month, 10) - 1;
    if (isNaN(month) || month < 0 || month > 11) {
      return res.status(400).json({ message: 'Invalid month' });
    }

    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0, 23, 59, 59, 999);

    const [moodEntries, assignments, relaxationSessions] = await Promise.all([
      MoodHistory.find({ user: req.user.id, createdAt: { $gte: start, $lte: end } }).lean(),
      Assignment.find({ user: req.user.id, dueDate: { $gte: start, $lte: end } }).lean(),
      RelaxationSession.find({ user: req.user.id, createdAt: { $gte: start, $lte: end } }).lean(),
    ]);

    const byDate = {};
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) {
      const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      byDate[key] = {
        date: key,
        moodScore: null,
        moodCategory: null,
        color: null,
        pendingTasks: 0,
        dueTasks: 0,
        relaxationCount: 0,
      };
    }

    for (const e of moodEntries) {
      const d = new Date(e.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (!byDate[key]) continue;
      const category = e.hybridMoodCategory || e.moodCategory;
      byDate[key].moodScore = e.hybridScore ?? e.moodScore ?? e.finalScoreClamped;
      byDate[key].moodCategory = category;
      byDate[key].color = MOOD_COLORS[category] || '#94a3b8';
    }

    for (const a of assignments) {
      const key = `${a.dueDate.getFullYear()}-${String(a.dueDate.getMonth() + 1).padStart(2, '0')}-${String(a.dueDate.getDate()).padStart(2, '0')}`;
      if (byDate[key]) {
        byDate[key].dueTasks += 1;
        if (!a.completed) byDate[key].pendingTasks += 1;
      }
    }

    for (const s of relaxationSessions) {
      const d = new Date(s.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (byDate[key]) byDate[key].relaxationCount += 1;
    }

    const calendarDays = Object.keys(byDate)
      .sort()
      .map((k) => byDate[k]);

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const scoresByDay = {};
    dayNames.forEach((d) => (scoresByDay[d] = []));
    for (const entry of moodEntries) {
      const d = new Date(entry.createdAt);
      const score = entry.hybridScore ?? entry.moodScore ?? entry.finalScoreClamped ?? 0;
      scoresByDay[dayNames[d.getDay()]].push(score);
    }
    let midWeekInsight = null;
    const wed = scoresByDay.Wednesday;
    const mon = scoresByDay.Monday;
    if (wed && wed.length > 0 && mon && mon.length > 0) {
      const wedAvg = wed.reduce((a, b) => a + b, 0) / wed.length;
      const monAvg = mon.reduce((a, b) => a + b, 0) / mon.length;
      if (wedAvg > monAvg + 2) {
        midWeekInsight = 'Your stress level tends to increase during mid-week due to assignment deadlines.';
      }
    }

    res.status(200).json({
      year,
      month: month + 1,
      calendarDays,
      colorMap: MOOD_COLORS,
      insights: midWeekInsight ? [midWeekInsight] : [],
    });
  } catch (err) {
    console.error('Get mood calendar error:', err);
    res.status(500).json({ message: 'Failed to fetch mood calendar' });
  }
};

module.exports = {
  getQuestions,
  submitAssessment,
  getHistory,
  getLatest,
  getAcademicStress,
  getWeeklyReport,
  getCalendar,
};

