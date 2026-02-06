/**
 * Assignment model for study planner.
 * Stores title, optional description, due date, priority, and completion status.
 * Each assignment belongs to a user.
 */

const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
      default: '',
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    completed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

assignmentSchema.index({ user: 1, dueDate: 1 });

module.exports = mongoose.model('Assignment', assignmentSchema);
