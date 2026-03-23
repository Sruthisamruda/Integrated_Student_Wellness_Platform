/**
 * Wellness routes: daily plan.
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getDailyPlan } = require('../controllers/wellnessController');
const {
  getFutureWellnessPrediction,
  simulateFutureWellnessPrediction,
} = require('../controllers/futureWellnessPredictionController');

router.use(protect);
router.get('/daily-plan', getDailyPlan);
router.get('/future-prediction', getFutureWellnessPrediction);
router.post('/future-prediction/simulate', simulateFutureWellnessPrediction);

module.exports = router;
