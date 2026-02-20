/**
 * Relaxation routes: log sessions for analytics.
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { logSession } = require('../controllers/relaxationController');

router.use(protect);

router.post('/session', logSession);

module.exports = router;
