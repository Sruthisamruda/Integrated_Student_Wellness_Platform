/**
 * Mood controller: CRUD for mood entries.
 * All operations are scoped to the authenticated user (req.user).
 */

const Mood = require('../models/Mood');

/**
 * GET /api/mood
 * Query: from?, to? (ISO dates) – optional date range
 * Returns current user's moods, newest first.
 */
const getMoods = async (req, res) => {
  try {
    const filter = { user: req.user.id };
    const { from, to } = req.query;
    if (from && to) {
      filter.date = { $gte: new Date(from), $lte: new Date(to) };
    } else if (from) {
      filter.date = { $gte: new Date(from) };
    } else if (to) {
      filter.date = { $lte: new Date(to) };
    }

    const moods = await Mood.find(filter).sort({ date: -1 }).lean();
    res.status(200).json(moods);
  } catch (error) {
    console.error('Get moods error:', error);
    res.status(500).json({ message: 'Failed to fetch moods' });
  }
};

/**
 * POST /api/mood
 * Body: { mood, note?, date? }
 * Creates a new mood entry for the current user.
 */
const createMood = async (req, res) => {
  try {
    const { mood, note, date } = req.body;
    if (!mood || typeof mood !== 'string' || !mood.trim()) {
      return res.status(400).json({ message: 'Mood value is required' });
    }
    const entry = await Mood.create({
      user: req.user.id,
      mood: mood.trim(),
      note: (note || '').trim().slice(0, 500),
      date: date ? new Date(date) : new Date(),
    });
    res.status(201).json(entry);
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ message: messages.join('. ') });
    }
    console.error('Create mood error:', error);
    res.status(500).json({ message: 'Failed to save mood' });
  }
};

/**
 * PUT /api/mood/:id
 * Body: { mood?, note?, date? }
 * Updates only the current user's mood entry.
 */
const updateMood = async (req, res) => {
  try {
    const entry = await Mood.findOne({ _id: req.params.id, user: req.user.id });
    if (!entry) {
      return res.status(404).json({ message: 'Mood entry not found' });
    }
    if (req.body.mood !== undefined) entry.mood = String(req.body.mood).trim();
    if (req.body.note !== undefined) entry.note = String(req.body.note).trim().slice(0, 500);
    if (req.body.date !== undefined) entry.date = new Date(req.body.date);
    await entry.save();
    res.status(200).json(entry);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: Object.values(error.errors).map((e) => e.message).join('. ') });
    }
    console.error('Update mood error:', error);
    res.status(500).json({ message: 'Failed to update mood' });
  }
};

/**
 * DELETE /api/mood/:id
 * Deletes the mood entry if it belongs to the current user.
 */
const deleteMood = async (req, res) => {
  try {
    const entry = await Mood.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!entry) {
      return res.status(404).json({ message: 'Mood entry not found' });
    }
    res.status(200).json({ message: 'Mood entry deleted' });
  } catch (error) {
    console.error('Delete mood error:', error);
    res.status(500).json({ message: 'Failed to delete mood' });
  }
};

module.exports = {
  getMoods,
  createMood,
  updateMood,
  deleteMood,
};
