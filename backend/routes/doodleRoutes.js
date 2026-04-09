const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/authMiddleware');
const { submitDoodleEntry } = require('../controllers/doodleEntryController');

// POST /api/doodle
router.post('/', protect, submitDoodleEntry);

module.exports = router;

