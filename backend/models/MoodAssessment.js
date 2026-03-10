const mongoose = require('mongoose');

const moodAssessmentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    questionnaireScore: { type: Number, required: true, min: 5, max: 25 },
    pendingTasks: { type: Number, required: true, min: 0 },
    overdueTasks: { type: Number, required: true, min: 0 },
    completedTasks: { type: Number, required: true, min: 0 },
    stressModifier: { type: Number, required: true },
    finalScore: { type: Number, required: true },
    finalScoreClamped: { type: Number, required: true, min: 5, max: 25 },
    moodLevel: {
      type: String,
      required: true,
      enum: ['Happy / Balanced', 'Calm', 'Mild Stress', 'Anxious', 'Highly Stressed'],
    },
  },
  { timestamps: true }
);

moodAssessmentSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('MoodAssessment', moodAssessmentSchema);

