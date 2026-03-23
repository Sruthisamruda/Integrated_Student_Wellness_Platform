const mongoose = require('mongoose');

const counsellingSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    scheduledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      // Date portion (stored as Date for easier comparisons)
      type: Date,
      required: true,
    },
    time: {
      // Store time as string (e.g. "14:30")
      type: String,
      required: true,
      trim: true,
      maxlength: [20, 'Time value is too long'],
    },
    mode: {
      type: String,
      enum: ['Online', 'Offline'],
      required: true,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [2000, 'Notes are too long'],
      default: '',
    },
    status: {
      type: String,
      enum: ['Scheduled', 'Completed', 'Cancelled'],
      default: 'Scheduled',
    },
  },
  {
    timestamps: true, // adds createdAt
  },
);

// Quick lookup for student dashboards
counsellingSessionSchema.index({ userId: 1, status: 1, date: 1, time: 1 });

module.exports = mongoose.model('CounsellingSession', counsellingSessionSchema);

