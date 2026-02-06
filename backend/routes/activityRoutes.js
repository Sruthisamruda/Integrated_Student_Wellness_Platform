/**
 * Activity routes: returns mood-based activity suggestions.
 * Public route (no auth required) - suggestions are general wellness tips.
 */

const express = require('express');
const router = express.Router();
const { getActivitySuggestions } = require('../controllers/activityController');

router.get('/', getActivitySuggestions);

module.exports = router;
