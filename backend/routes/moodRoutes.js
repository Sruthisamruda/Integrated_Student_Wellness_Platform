/**
 * Mood routes: all require authentication (protect middleware).
 */

const express = require('express');
const router = express.Router();
const { getMoods, createMood, updateMood, deleteMood } = require('../controllers/moodController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getMoods);
router.post('/', createMood);
router.put('/:id', updateMood);
router.delete('/:id', deleteMood);

module.exports = router;
