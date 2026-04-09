const mongoose = require('mongoose');

const pointSchema = new mongoose.Schema(
  {
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    timestamp: { type: Number, required: true }, // performance.now() relative timestamp (ms)
  },
  { _id: false }
);

const doodleEntrySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    // Freehand stroke points (ordered as captured)
    strokes: { type: [pointSchema], required: true, validate: [(v) => Array.isArray(v) && v.length >= 2, 'At least 2 points are required'] },

    // Mood chosen by user
    emotionTag: {
      type: String,
      required: false,
      enum: ['Calm', 'Happy', 'Stressed', 'Angry', 'Tired'],
      default: null,
    },

    // Mood inferred via lightweight heuristics
    inferredMood: {
      type: String,
      required: true,
      enum: [
        'Calm',
        'Happy',
        'Stressed',
        'Angry',
        'Tired',
        'Highly Stressed',
        'Neutral',
      ],
    },

    metrics: {
      speed: { type: Number, required: true }, // normalizedSpeed (0..1)
      // Optional alias for backward compatibility with older frontend payloads.
      strokeSpeed: { type: Number, required: false },
      density: { type: Number, required: true },
    },

    createdAt: { type: Date, required: true, default: () => new Date() },
  },
  { _id: true }
);

doodleEntrySchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('DoodleEntry', doodleEntrySchema);

