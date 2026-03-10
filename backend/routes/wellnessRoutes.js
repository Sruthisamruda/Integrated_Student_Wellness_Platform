/**
 * Wellness routes: daily plan.
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getDailyPlan } = require('../controllers/wellnessController');

router.use(protect);
router.get('/daily-plan', getDailyPlan);

module.exports = router;
