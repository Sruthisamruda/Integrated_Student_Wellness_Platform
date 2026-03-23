const mongoose = require('mongoose');

const moodHistorySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    // Core fields for dashboard + history
    moodScore: { type: Number, required: true, min: 5, max: 25 },
    moodCategory: {
      type: String,
      required: true,
      enum: ['Happy / Balanced', 'Calm', 'Mild Stress', 'Anxious', 'Highly Stressed'],
    },
    suggestedActivities: [{ type: String, trim: true }],

    // Indicates how this mood entry was created.
    // - questionnaire: primary mood detection system (Mood Assessment)
    // - doodle: secondary journaling/quick expression (does not override questionnaire)
    moodSource: { type: String, enum: ['questionnaire', 'doodle'], default: 'questionnaire' },

    // Hybrid mood (questionnaire + planner)
    plannerStressScore: { type: Number, default: 0 },
    hybridScore: { type: Number },
    hybridMoodCategory: { type: String, enum: ['Happy / Balanced', 'Calm', 'Mild Stress', 'Anxious', 'Highly Stressed'] },

    // Doodle extension (optional journaling)
    doodleMoodTag: { type: String, enum: ['Calm', 'Mild Stress', 'Anxious', 'Highly Stressed'], default: null },
    doodleStressScore: { type: Number, default: 0, min: 0, max: 100 },
    doodleMetrics: { type: Object, default: {} },
    doodleImage: { type: String, default: '' }, // optional base64 data URL (keep small)

    // Extra diagnostic fields (from questionnaire + study planner)
    questionnaireScore: { type: Number, required: true, min: 5, max: 25 },
    pendingTasks: { type: Number, required: true, min: 0 },
    overdueTasks: { type: Number, required: true, min: 0 },
    completedTasks: { type: Number, required: true, min: 0 },
    stressModifier: { type: Number, required: true },
    finalScore: { type: Number, required: true },
    finalScoreClamped: { type: Number, required: true, min: 5, max: 25 },
  },
  { timestamps: true }
);

moodHistorySchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('MoodHistory', moodHistorySchema);

