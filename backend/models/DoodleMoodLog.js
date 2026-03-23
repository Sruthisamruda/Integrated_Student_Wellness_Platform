/**
 * Standalone doodle mood logs from the Mood Tracker page (/mood).
 * Stores image + detected category for dashboard and history.
 */

const mongoose = require('mongoose');

const doodleMoodLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    doodleImage: {
      type: String,
      required: true,
      maxlength: 900000,
    },
    moodCategory: {
      type: String,
      required: true,
      enum: ['Calm', 'Mild Stress', 'Anxious', 'Highly Stressed'],
    },
    suggestedActivities: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

doodleMoodLogSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('DoodleMoodLog', doodleMoodLogSchema);
