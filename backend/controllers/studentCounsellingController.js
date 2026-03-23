/**
 * Student counselling endpoints:
 * - GET /api/student/counselling
 */

const CounsellingSession = require('../models/CounsellingSession');

const parseScheduledAt = (date, time) => {
  // Build a sortable Date: YYYY-MM-DD + HH:mm
  try {
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return null;
    const t = String(time || '').trim();
    if (!t) return d;
    // If time format is "HH:mm", append to ISO date.
    return new Date(`${d.toISOString().slice(0, 10)}T${t}:00`);
  } catch {
    return null;
  }
};

const getStudentCounsellingSessions = async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      return res.status(403).json({ message: 'Admins cannot access student counselling sessions' });
    }

    const sessions = await CounsellingSession.find({ userId: req.user.id })
      .select('date time mode notes status scheduledBy createdAt')
      .sort({ createdAt: -1 })
      .lean();

    // Sort upcoming sessions first (Scheduled > others), then by date/time.
    const normalized = sessions
      .map((s) => ({
        ...s,
        scheduledAt: parseScheduledAt(s.date, s.time),
      }))
      .sort((a, b) => {
        const aRank = a.status === 'Scheduled' ? 0 : a.status === 'Completed' ? 1 : 2;
        const bRank = b.status === 'Scheduled' ? 0 : b.status === 'Completed' ? 1 : 2;
        if (aRank !== bRank) return aRank - bRank;
        if (a.scheduledAt && b.scheduledAt) return a.scheduledAt - b.scheduledAt;
        return 0;
      });

    res.status(200).json({ sessions: normalized });
  } catch (err) {
    console.error('Get student counselling sessions error:', err);
    res.status(500).json({ message: 'Failed to fetch counselling sessions' });
  }
};

module.exports = {
  getStudentCounsellingSessions,
};

