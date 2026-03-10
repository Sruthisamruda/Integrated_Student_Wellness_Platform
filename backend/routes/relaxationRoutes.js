/**
 * Relaxation routes: log sessions for analytics.
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { logSession, getEffectiveness } = require('../controllers/relaxationController');

router.use(protect);

router.post('/session', logSession);
router.get('/effectiveness', getEffectiveness);

module.exports = router;
