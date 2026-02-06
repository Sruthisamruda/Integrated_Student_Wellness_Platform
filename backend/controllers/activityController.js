/**
 * Activity suggestions controller: returns personalized activity suggestions based on mood.
 * Helps users find appropriate wellness activities when they log their mood.
 */

// Mood-to-activities mapping: each mood has 3-4 activity suggestions
const ACTIVITY_SUGGESTIONS = {
  happy: [
    {
      title: 'Continue the momentum',
      description: 'Use this positive energy to tackle a challenging assignment or project.',
      category: 'productivity',
      icon: '📚',
    },
    {
      title: 'Share your joy',
      description: 'Connect with friends or family. Positive social interactions boost well-being.',
      category: 'social',
      icon: '👥',
    },
    {
      title: 'Practice gratitude',
      description: 'Write down 3 things you\'re grateful for today. This reinforces positive feelings.',
      category: 'mindfulness',
      icon: '🙏',
    },
    {
      title: 'Try something new',
      description: 'Channel your energy into learning a new skill or hobby.',
      category: 'growth',
      icon: '✨',
    },
  ],
  calm: [
    {
      title: 'Maintain this state',
      description: 'This is a great time for focused study or deep work. Set a timer and dive in.',
      category: 'productivity',
      icon: '🎯',
    },
    {
      title: 'Gentle movement',
      description: 'Take a peaceful walk or do some light stretching to keep your body balanced.',
      category: 'movement',
      icon: '🚶',
    },
    {
      title: 'Mindful breathing',
      description: 'Continue with breathing exercises to sustain this calm feeling.',
      category: 'mindfulness',
      icon: '🧘',
    },
    {
      title: 'Read or listen',
      description: 'Enjoy a book, podcast, or music that matches your peaceful mood.',
      category: 'relaxation',
      icon: '📖',
    },
  ],
  anxious: [
    {
      title: '4-7-8 breathing',
      description: 'Breathe in for 4, hold for 7, exhale for 8. Repeat 4 times to calm your nervous system.',
      category: 'mindfulness',
      icon: '🌬️',
    },
    {
      title: 'Grounding exercise',
      description: 'Name 5 things you see, 4 you can touch, 3 you hear, 2 you smell, 1 you taste.',
      category: 'mindfulness',
      icon: '🌍',
    },
    {
      title: 'Break tasks into steps',
      description: 'Write down what\'s worrying you and break it into small, manageable steps.',
      category: 'productivity',
      icon: '📝',
    },
    {
      title: 'Gentle movement',
      description: 'A short walk or light exercise can help release tension and reduce anxiety.',
      category: 'movement',
      icon: '🚶',
    },
  ],
  sad: [
    {
      title: 'Self-compassion',
      description: 'Be kind to yourself. It\'s okay to feel sad. Allow yourself to process these emotions.',
      category: 'mindfulness',
      icon: '💙',
    },
    {
      title: 'Reach out',
      description: 'Talk to a friend, family member, or counselor. You don\'t have to go through this alone.',
      category: 'social',
      icon: '💬',
    },
    {
      title: 'Gentle activities',
      description: 'Do something soothing: listen to calming music, take a warm bath, or watch something comforting.',
      category: 'relaxation',
      icon: '🛁',
    },
    {
      title: 'Small wins',
      description: 'Complete one small task to build momentum. Even tiny accomplishments can help.',
      category: 'productivity',
      icon: '✅',
    },
  ],
  tired: [
    {
      title: 'Rest is productive',
      description: 'Take a short nap (20-30 minutes) or rest. Your body needs recovery time.',
      category: 'rest',
      icon: '😴',
    },
    {
      title: 'Hydrate and snack',
      description: 'Drink water and have a healthy snack. Sometimes fatigue is due to dehydration or low blood sugar.',
      category: 'health',
      icon: '💧',
    },
    {
      title: 'Light movement',
      description: 'A 5-minute walk or gentle stretch can boost energy without being draining.',
      category: 'movement',
      icon: '🚶',
    },
    {
      title: 'Prioritize tasks',
      description: 'Focus on only the most important tasks today. It\'s okay to defer less urgent items.',
      category: 'productivity',
      icon: '📋',
    },
  ],
  energetic: [
    {
      title: 'Channel the energy',
      description: 'Tackle your most challenging assignments or projects while you have this boost.',
      category: 'productivity',
      icon: '⚡',
    },
    {
      title: 'Physical activity',
      description: 'Go for a run, workout, or dance. Use this energy for movement and exercise.',
      category: 'movement',
      icon: '🏃',
    },
    {
      title: 'Creative projects',
      description: 'Start or work on a creative project. High energy is great for innovation.',
      category: 'creativity',
      icon: '🎨',
    },
    {
      title: 'Social activities',
      description: 'Plan something fun with friends. Your positive energy is contagious!',
      category: 'social',
      icon: '🎉',
    },
  ],
  neutral: [
    {
      title: 'Steady progress',
      description: 'This is a good state for routine tasks and steady study. Make a plan and stick to it.',
      category: 'productivity',
      icon: '📊',
    },
    {
      title: 'Explore something',
      description: 'Try a new activity or topic. Neutral moods are great for learning without emotional interference.',
      category: 'growth',
      icon: '🔍',
    },
    {
      title: 'Maintain balance',
      description: 'Keep a balanced routine: work, rest, and play. Consistency builds well-being.',
      category: 'balance',
      icon: '⚖️',
    },
    {
      title: 'Check in later',
      description: 'Your mood might shift. Log again later to see how you\'re feeling.',
      category: 'mindfulness',
      icon: '🔄',
    },
  ],
};

/**
 * GET /api/activities?mood=<mood>
 * Returns activity suggestions for the given mood.
 * If no mood provided, returns suggestions for "neutral".
 */
const getActivitySuggestions = async (req, res) => {
  try {
    const { mood } = req.query;
    const moodKey = (mood || 'neutral').toLowerCase().trim();
    const suggestions = ACTIVITY_SUGGESTIONS[moodKey] || ACTIVITY_SUGGESTIONS.neutral;
    res.status(200).json({ mood: moodKey, suggestions });
  } catch (error) {
    console.error('Get activity suggestions error:', error);
    res.status(500).json({ message: 'Failed to fetch activity suggestions' });
  }
};

module.exports = {
  getActivitySuggestions,
};
