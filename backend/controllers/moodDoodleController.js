/**
 * Doodle mood submission (extension).
 *
 * The doodle does NOT replace questionnaire mood scoring.
 * - If the user has already submitted a questionnaire mood today, we attach the doodle tag to that same MoodHistory record.
 * - If no questionnaire mood exists today, we create a MoodHistory entry using planner-based prediction as a fallback (moodScore/moodCategory are planner-based).
 */

const MoodHistory = require('../models/MoodHistory');
const Assignment = require('../models/Assignment');

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const ALLOWED_DOODLE_TAGS = ['Calm', 'Mild Stress', 'Anxious', 'Highly Stressed'];

const mapDoodleStressToTag = (doodleStressScore) => {
  const s = Number.isFinite(doodleStressScore) ? doodleStressScore : 0;
  if (s < 35) return 'Calm';
  if (s < 55) return 'Mild Stress';
  if (s < 75) return 'Anxious';
  return 'Highly Stressed';
};

const interpretDoodleTag = (tag) => {
  if (tag === 'Highly Stressed') return 'Your drawing shows signs of high stress and strong emotional intensity.';
  if (tag === 'Anxious') return 'Your drawing suggests anxious feelings with noticeable emotional pressure.';
  if (tag === 'Mild Stress') return 'Your drawing shows mild stress with some emotional tension.';
  return 'Your drawing looks calm and grounded.';
};

const suggestedRelaxationForTag = (tag) => {
  if (tag === 'Calm') return ['Light stretching', 'Listen to relaxing music', 'Short walk outside'];
  if (tag === 'Mild Stress') return ['Take a 10 minute break', 'Play a short game', 'Listen to music', 'Talk with a friend'];
  if (tag === 'Anxious') return ['Guided breathing exercise', 'Go for a walk', 'Listen to calming music', 'Reduce today’s study load'];
  return ['Take a longer break away from your desk', 'Go outside for fresh air', 'Try slow breathing exercises', 'Write next small steps in a journal'];
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

// Map final score (5–25) to questionnaire-style categories.
const mapMoodLevel = (score) => {
  if (score >= 5 && score <= 9) return 'Happy / Balanced';
  if (score >= 10 && score <= 14) return 'Calm';
  if (score >= 15 && score <= 18) return 'Mild Stress';
  if (score >= 19 && score <= 21) return 'Anxious';
  return 'Highly Stressed';
};

const mapHybridMood = (score) => {
  if (score <= 9) return 'Happy / Balanced';
  if (score <= 14) return 'Calm';
  if (score <= 18) return 'Mild Stress';
  if (score <= 21) return 'Anxious';
  return 'Highly Stressed';
};

const suggestionsForLevel = (level) => {
  if (level === 'Happy / Balanced') return ['Continue your study schedule', 'Try a creative activity', 'Listen to your favorite music'];
  if (level === 'Calm') return ['Light stretching', 'Listen to relaxing music', 'Short walk outside'];
  if (level === 'Mild Stress') return ['Play a short game', 'Take a 10 minute break', 'Listen to music', 'Talk with a friend'];
  if (level === 'Anxious') return ['Guided breathing exercise', 'Go for a walk', 'Listen to calming music', 'Reduce today’s study load'];
  return ['Take a longer break', 'Go outside for a walk', 'Try slow breathing exercises', 'Try a short meditation session'];
};

const submitDoodleMood = async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      return res.status(403).json({ message: 'Admins cannot submit doodle moods' });
    }

    const doodleStressScore = Number(req.body?.doodleStressScore ?? 0);
    const doodleMoodTag = req.body?.doodleMoodTag || mapDoodleStressToTag(doodleStressScore);

    if (!ALLOWED_DOODLE_TAGS.includes(doodleMoodTag)) {
      return res.status(400).json({ message: 'Invalid doodleMoodTag' });
    }

    const doodleMetrics = req.body?.doodleMetrics && typeof req.body.doodleMetrics === 'object' ? req.body.doodleMetrics : {};
    const doodleImageDataUrl = typeof req.body?.doodleImageDataUrl === 'string' ? req.body.doodleImageDataUrl : '';

    if (doodleImageDataUrl && doodleImageDataUrl.length > 250000) {
      return res.status(400).json({ message: 'doodleImageDataUrl is too large' });
    }

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    // Prefer attaching to the latest questionnaire entry for today.
    const todayQuestionnaire = await MoodHistory.findOne({
      user: req.user.id,
      moodSource: 'questionnaire',
      createdAt: { $gte: startOfToday, $lte: endOfToday },
    }).sort({ createdAt: -1 });

    const interpretation = interpretDoodleTag(doodleMoodTag);
    const suggestedActivities = suggestedRelaxationForTag(doodleMoodTag);

    if (todayQuestionnaire) {
      todayQuestionnaire.doodleMoodTag = doodleMoodTag;
      todayQuestionnaire.doodleStressScore = clamp(doodleStressScore, 0, 100);
      todayQuestionnaire.doodleMetrics = doodleMetrics;
      todayQuestionnaire.doodleImage = doodleImageDataUrl || '';
      await todayQuestionnaire.save();

      return res.status(200).json({
        attachedToQuestionnaire: true,
        doodleMoodTag,
        interpretation,
        suggestedActivities,
        moodEntryId: todayQuestionnaire._id,
      });
    }

    // Doodle-only submission: create a planner-based fallback MoodHistory entry.
    const studyPlanner = await getStudyPlannerStats(req.user.id);
    const stressModifier = computeStressModifier(studyPlanner);
    const plannerRaw = await computePlannerStressScore(req.user.id);
    const plannerScaled = Math.min(plannerRaw, 7) * (25 / 7);

    // Convert plannerRaw into the questionnaire-style score space (5–25).
    const questionnaireScore = clamp(Math.round(8 + plannerRaw * 2.2), 5, 25);
    const finalScore = questionnaireScore + stressModifier;
    const finalScoreClamped = clamp(finalScore, 5, 25);
    const moodLevel = mapMoodLevel(finalScoreClamped);

    const hybridScore = Math.round((questionnaireScore * 0.6 + plannerScaled * 0.4) * 10) / 10;
    const hybridMoodCategory = mapHybridMood(hybridScore);
    const activities = suggestionsForLevel(hybridMoodCategory);

    const created = await MoodHistory.create({
      user: req.user.id,
      moodSource: 'doodle',
      moodScore: finalScoreClamped,
      moodCategory: moodLevel,
      suggestedActivities: activities,

      questionnaireScore,
      pendingTasks: studyPlanner.pendingTasks,
      overdueTasks: studyPlanner.overdueTasks,
      completedTasks: studyPlanner.completedTasks,
      stressModifier,
      finalScore,
      finalScoreClamped,

      plannerStressScore: plannerRaw,
      hybridScore,
      hybridMoodCategory,

      doodleMoodTag,
      doodleStressScore: clamp(doodleStressScore, 0, 100),
      doodleMetrics,
      doodleImage: doodleImageDataUrl || '',
    });

    return res.status(200).json({
      attachedToQuestionnaire: false,
      doodleMoodTag,
      interpretation,
      suggestedActivities,
      moodEntryId: created._id,
    });
  } catch (err) {
    console.error('submitDoodleMood error:', err);
    return res.status(500).json({ message: 'Failed to submit doodle mood' });
  }
};

module.exports = { submitDoodleMood };

