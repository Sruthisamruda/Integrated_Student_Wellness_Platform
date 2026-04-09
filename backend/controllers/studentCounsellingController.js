/**
 * Student counselling endpoints:
 * - GET /api/student/counselling
 */

const CounsellingSession = require('../models/CounsellingSession');

const parseScheduledAt = (date, time) => {
  // Parse in *local* timezone: date (yyyy-mm-dd) + time (HH:mm)
  try {
    if (!date) return null;
    const d = date instanceof Date ? date : new Date(date);
    if (Number.isNaN(d.getTime())) return null;

    const y = d.getFullYear();
    const m = d.getMonth();
    const day = d.getDate();

    const t = String(time || '').trim();
    if (!t) return new Date(y, m, day, 0, 0, 0, 0);

    const parts = t.split(':');
    if (parts.length < 2) return null;

    const hh = Number(parts[0]);
    const mm = Number(parts[1]);
    if (!Number.isFinite(hh) || !Number.isFinite(mm)) return null;

    return new Date(y, m, day, hh, mm, 0, 0);
  } catch {
    return null;
  }
};

const normalizeStatus = (status) => {
  // Backward compatibility for older documents.
  if (status === 'Scheduled') return 'upcoming';
  if (status === 'Completed') return 'completed';
  if (status === 'Cancelled') return 'cancelled';
  if (status === 'upcoming' || status === 'completed' || status === 'cancelled') return status;
  return 'upcoming';
};

const updateSessionStatus = (session) => {
  const now = new Date();
  const sessionTime = session.dateTime;

  if (sessionTime && sessionTime < now && session.status !== 'completed') {
    session.status = 'completed';
  }

  return session;
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

    const normalized = sessions
      .map((s) => {
        const dateTime = parseScheduledAt(s.date, s.time);
        return {
          ...s,
          status: normalizeStatus(s.status),
          dateTime,
        };
      })
      .filter((s) => s.dateTime && !Number.isNaN(s.dateTime.getTime()))
      .map(updateSessionStatus);

    const now = new Date();

    // Separate sessions correctly (and disjoint by status).
    const upcomingSessions = normalized.filter(
      (s) => s.dateTime > now && s.status === 'upcoming',
    );

    const completedSessions = normalized.filter(
      (s) => s.dateTime <= now || s.status === 'completed',
    );

    // Prevent duplicate display: upcomingSessions only includes 'upcoming',
    // completedSessions includes past sessions OR explicitly completed.

    res.status(200).json({
      upcomingSessions: upcomingSessions.map((s) => ({
        ...s,
        dateTime: s.dateTime.toISOString(),
      })),
      completedSessions: completedSessions.map((s) => ({
        ...s,
        dateTime: s.dateTime.toISOString(),
      })),
    });
  } catch (err) {
    console.error('Get student counselling sessions error:', err);
    res.status(500).json({ message: 'Failed to fetch counselling sessions' });
  }
};

module.exports = {
  getStudentCounsellingSessions,
};

