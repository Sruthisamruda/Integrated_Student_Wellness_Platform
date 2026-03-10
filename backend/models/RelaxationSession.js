/**
 * RelaxationSession model: tracks when students use relaxation features.
 * Stores user, activity type, duration, and timestamp.
 */

const mongoose = require('mongoose');

const relaxationSessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    activityType: {
      type: String,
      enum: ['breathing', 'meditation', 'music', 'walk', 'stretch', 'journaling', 'other'],
      default: 'breathing',
    },
    duration: {
      type: Number, // Duration in seconds
      default: 0,
    },
    moodBefore: { type: Number, min: 1, max: 5 }, // 1=very stressed, 5=very calm
    moodAfter: { type: Number, min: 1, max: 5 },
  },
  {
    timestamps: true,
  }
);

relaxationSessionSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('RelaxationSession', relaxationSessionSchema);
