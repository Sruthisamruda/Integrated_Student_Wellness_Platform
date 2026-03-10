const mongoose = require('mongoose');

const optionSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true },
    score: { type: Number, required: true, min: 1, max: 5 },
  },
  { _id: false }
);

const questionSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: true,
      trim: true,
      enum: ['Academic Stress', 'Emotional Wellbeing', 'Lifestyle / Personal Balance'],
    },
    question: { type: String, required: true, trim: true, maxlength: 300 },
    options: {
      type: [optionSchema],
      validate: [
        (arr) => Array.isArray(arr) && arr.length === 5,
        'Each question must have exactly 5 options',
      ],
      required: true,
    },
    scoreMapping: {
      type: Object,
      default: {},
    },
  },
  { timestamps: true }
);

questionSchema.index({ category: 1, createdAt: -1 });

module.exports = mongoose.model('Question', questionSchema);

