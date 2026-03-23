const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getStudentCounsellingSessions } = require('../controllers/studentCounsellingController');

router.use(protect);

router.get('/counselling', getStudentCounsellingSessions);

module.exports = router;

