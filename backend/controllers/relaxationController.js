/**
 * Relaxation controller: log sessions, effectiveness tracking.
 */

const RelaxationSession = require('../models/RelaxationSession');

/**
 * POST /api/relaxation/session
 * Body: { activityType?, duration?, moodBefore?, moodAfter? }
 * Logs a relaxation session for the current user.
 */
const logSession = async (req, res) => {
  try {
    const { activityType = 'breathing', duration = 0, moodBefore, moodAfter } = req.body;
    const session = await RelaxationSession.create({
      user: req.user.id,
      activityType,
      duration,
      moodBefore: moodBefore != null ? Number(moodBefore) : undefined,
      moodAfter: moodAfter != null ? Number(moodAfter) : undefined,
    });
    res.status(201).json(session);
  } catch (error) {
    console.error('Log relaxation session error:', error);
    res.status(500).json({ message: 'Failed to log session' });
  }
};

/**
 * GET /api/relaxation/effectiveness
 * Returns effectiveness insights per activity type (mood improvement).
 */
const getEffectiveness = async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      return res.status(403).json({ message: 'Admins cannot access relaxation effectiveness' });
    }

    const sessions = await RelaxationSession.find({
      user: req.user.id,
      moodBefore: { $exists: true, $ne: null },
      moodAfter: { $exists: true, $ne: null },
    }).lean();

    const byType = {};
    const activityLabels = {
      breathing: 'Breathing exercises',
      meditation: 'Meditation',
      music: 'Listening to music',
      walk: 'Short walks',
      stretch: 'Stretching',
      journaling: 'Journaling',
      other: 'Other activities',
    };

    for (const s of sessions) {
      const t = s.activityType || 'other';
      if (!byType[t]) byType[t] = { count: 0, totalImprovement: 0, improvements: [] };
      const improvement = s.moodAfter - s.moodBefore;
      byType[t].count += 1;
      byType[t].totalImprovement += improvement;
      byType[t].improvements.push(improvement);
    }

    const insights = [];
    const effectiveness = [];
    let bestActivity = null;
    let bestAvgImprovement = -999;

    for (const [type, data] of Object.entries(byType)) {
      if (data.count < 2) continue;
      const avgImprovement = data.totalImprovement / data.count;
      const avgBefore = 0; // we'd need to compute from raw data
      effectiveness.push({
        activityType: type,
        label: activityLabels[type] || type,
        count: data.count,
        avgImprovement: Math.round(avgImprovement * 100) / 100,
        moodImprovementPercent: Math.round(avgImprovement * 20), // 1 point ≈ 20% on 1-5 scale
      });
      if (avgImprovement > bestAvgImprovement) {
        bestAvgImprovement = avgImprovement;
        bestActivity = activityLabels[type] || type;
      }
    }

    if (bestActivity) {
      insights.push(`${bestActivity} reduce your stress the most.`);
    }
    effectiveness.forEach((e) => {
      if (e.avgImprovement > 0 && e.moodImprovementPercent > 0) {
        insights.push(`${e.label} improve your mood by ~${e.moodImprovementPercent}%.`);
      }
    });
    const walkData = byType.walk;
    if (walkData && walkData.count >= 2 && walkData.totalImprovement / walkData.count > 0.3) {
      insights.push('Short walks help you recover faster from academic stress.');
    }

    res.status(200).json({
      insights: [...new Set(insights)],
      effectiveness,
      totalSessionsWithMood: sessions.length,
    });
  } catch (err) {
    console.error('Get relaxation effectiveness error:', err);
    res.status(500).json({ message: 'Failed to fetch effectiveness data' });
  }
};

module.exports = {
  logSession,
  getEffectiveness,
};
