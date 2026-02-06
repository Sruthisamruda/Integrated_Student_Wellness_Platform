/**
 * Assignment routes: all require authentication.
 */

const express = require('express');
const router = express.Router();
const {
  getAssignments,
  createAssignment,
  updateAssignment,
  deleteAssignment,
} = require('../controllers/assignmentController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getAssignments);
router.post('/', createAssignment);
router.put('/:id', updateAssignment);
router.delete('/:id', deleteAssignment);

module.exports = router;
