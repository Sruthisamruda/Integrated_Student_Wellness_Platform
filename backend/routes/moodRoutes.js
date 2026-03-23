/**
 * Mood routes: all require authentication (protect middleware).
 */

const express = require('express');
const router = express.Router();
const { getMoods, createMood, updateMood, deleteMood } = require('../controllers/moodController');
const {
  getQuestions,
  submitAssessment,
  getHistory,
  getLatest,
  getAcademicStress,
  getWeeklyReport,
  getCalendar,
} = require('../controllers/moodAssessmentController');
const { submitDoodleMood } = require('../controllers/moodDoodleController');
const { submitDoodleLog } = require('../controllers/doodleMoodLogController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/questions', getQuestions);
router.post('/submit', submitAssessment);
router.post('/doodle-submit', submitDoodleMood);
router.post('/doodle-log', submitDoodleLog);
router.get('/history', getHistory);
router.get('/latest', getLatest);
router.get('/academic-stress', getAcademicStress);
router.get('/weekly-report', getWeeklyReport);
router.get('/calendar', getCalendar);

router.get('/', getMoods);
router.post('/', createMood);
router.put('/:id', updateMood);
router.delete('/:id', deleteMood);

module.exports = router;
