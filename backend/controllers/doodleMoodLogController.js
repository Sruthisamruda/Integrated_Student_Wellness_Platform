/**
 * POST /api/mood/doodle-log
 * Saves doodle image + mood category from Mood Tracker (doodle-only flow).
 */

const DoodleMoodLog = require('../models/DoodleMoodLog');

const ALLOWED = ['Calm', 'Mild Stress', 'Anxious', 'Highly Stressed'];

const suggestionsForCategory = (cat) => {
  if (cat === 'Calm') return ['Light stretching', 'Listen to relaxing music', 'Short walk outside'];
  if (cat === 'Mild Stress') return ['Take a 10 minute break', 'Play a short game', 'Listen to music', 'Talk with a friend'];
  if (cat === 'Anxious') return ['Guided breathing exercise', 'Go for a walk', 'Listen to calming music', 'Reduce today’s study load'];
  return ['Take a longer break away from your desk', 'Go outside for fresh air', 'Try slow breathing exercises', 'Write next small steps in a journal'];
};

const submitDoodleLog = async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      return res.status(403).json({ message: 'Admins cannot submit doodle moods' });
    }

    const { doodleImage, moodCategory } = req.body || {};

    if (!doodleImage || typeof doodleImage !== 'string') {
      return res.status(400).json({ message: 'doodleImage is required (base64 data URL)' });
    }
    if (!moodCategory || !ALLOWED.includes(moodCategory)) {
      return res.status(400).json({ message: 'moodCategory must be one of: Calm, Mild Stress, Anxious, Highly Stressed' });
    }
    if (doodleImage.length > 850000) {
      return res.status(400).json({ message: 'doodleImage is too large; try a smaller export' });
    }

    const suggestedActivities = suggestionsForCategory(moodCategory);

    const doc = await DoodleMoodLog.create({
      user: req.user.id,
      doodleImage,
      moodCategory,
      suggestedActivities,
    });

    res.status(201).json({
      id: doc._id,
      moodCategory: doc.moodCategory,
      suggestedActivities: doc.suggestedActivities,
      createdAt: doc.createdAt,
      message: `Your drawing indicates: ${doc.moodCategory}`,
    });
  } catch (err) {
    console.error('submitDoodleLog error:', err);
    res.status(500).json({ message: 'Failed to save doodle mood' });
  }
};

module.exports = { submitDoodleLog };
