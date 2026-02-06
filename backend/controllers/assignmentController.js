/**
 * Assignment controller: CRUD for assignments (study planner).
 * All operations are scoped to the authenticated user.
 */

const Assignment = require('../models/Assignment');

/**
 * GET /api/assignments
 * Query: completed? (true/false) – optional filter
 * Returns current user's assignments, by due date ascending.
 */
const getAssignments = async (req, res) => {
  try {
    const filter = { user: req.user.id };
    if (req.query.completed !== undefined) {
      filter.completed = req.query.completed === 'true';
    }
    const assignments = await Assignment.find(filter).sort({ dueDate: 1 }).lean();
    res.status(200).json(assignments);
  } catch (error) {
    console.error('Get assignments error:', error);
    res.status(500).json({ message: 'Failed to fetch assignments' });
  }
};

/**
 * POST /api/assignments
 * Body: { title, description?, dueDate, priority? }
 * Creates a new assignment for the current user.
 */
const createAssignment = async (req, res) => {
  try {
    const { title, description, dueDate, priority } = req.body;
    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ message: 'Title is required' });
    }
    if (!dueDate) {
      return res.status(400).json({ message: 'Due date is required' });
    }
    const validPriorities = ['low', 'medium', 'high'];
    const pri = (priority || 'medium').toLowerCase();
    const assignment = await Assignment.create({
      user: req.user.id,
      title: title.trim().slice(0, 200),
      description: (description || '').trim().slice(0, 1000),
      dueDate: new Date(dueDate),
      priority: validPriorities.includes(pri) ? pri : 'medium',
    });
    res.status(201).json(assignment);
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ message: messages.join('. ') });
    }
    console.error('Create assignment error:', error);
    res.status(500).json({ message: 'Failed to create assignment' });
  }
};

/**
 * PUT /api/assignments/:id
 * Body: { title?, description?, dueDate?, priority?, completed? }
 * Updates only the current user's assignment.
 */
const updateAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findOne({ _id: req.params.id, user: req.user.id });
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }
    if (req.body.title !== undefined) assignment.title = String(req.body.title).trim().slice(0, 200);
    if (req.body.description !== undefined) assignment.description = String(req.body.description).trim().slice(0, 1000);
    if (req.body.dueDate !== undefined) assignment.dueDate = new Date(req.body.dueDate);
    if (req.body.priority !== undefined) {
      const p = String(req.body.priority).toLowerCase();
      if (['low', 'medium', 'high'].includes(p)) assignment.priority = p;
    }
    if (typeof req.body.completed === 'boolean') assignment.completed = req.body.completed;
    await assignment.save();
    res.status(200).json(assignment);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: Object.values(error.errors).map((e) => e.message).join('. ') });
    }
    console.error('Update assignment error:', error);
    res.status(500).json({ message: 'Failed to update assignment' });
  }
};

/**
 * DELETE /api/assignments/:id
 * Deletes the assignment if it belongs to the current user.
 */
const deleteAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }
    res.status(200).json({ message: 'Assignment deleted' });
  } catch (error) {
    console.error('Delete assignment error:', error);
    res.status(500).json({ message: 'Failed to delete assignment' });
  }
};

module.exports = {
  getAssignments,
  createAssignment,
  updateAssignment,
  deleteAssignment,
};
