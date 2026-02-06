/**
 * Mood tracking model.
 * Each entry belongs to a user and stores mood value (emoji/key),
 * optional note, and date. Used for mood history and trends.
 */

const mongoose = require('mongoose');

const moodSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    mood: {
      type: String,
      required: [true, 'Mood value is required'],
      trim: true,
      // e.g. "happy", "calm", "anxious", "sad", "neutral", "tired", "energetic"
    },
    note: {
      type: String,
      trim: true,
      maxlength: [500, 'Note cannot exceed 500 characters'],
      default: '',
    },
    date: {
      type: Date,
      default: Date.now,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries: get user's moods by date
moodSchema.index({ user: 1, date: -1 });

module.exports = mongoose.model('Mood', moodSchema);
