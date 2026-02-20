/**
 * Relaxation controller: log relaxation sessions for analytics.
 */

const RelaxationSession = require('../models/RelaxationSession');

/**
 * POST /api/relaxation/session
 * Body: { activityType?, duration? }
 * Logs a relaxation session for the current user.
 */
const logSession = async (req, res) => {
  try {
    const { activityType = 'breathing', duration = 0 } = req.body;
    const session = await RelaxationSession.create({
      user: req.user.id,
      activityType,
      duration,
    });
    res.status(201).json(session);
  } catch (error) {
    console.error('Log relaxation session error:', error);
    res.status(500).json({ message: 'Failed to log session' });
  }
};

module.exports = {
  logSession,
};
