const DoodleEntry = require('../models/DoodleEntry');

const ALLOWED_EMOTION_TAGS = ['Calm', 'Happy', 'Stressed', 'Angry', 'Tired'];
const ALLOWED_INFERRED_MOODS = ['Calm', 'Happy', 'Stressed', 'Angry', 'Tired', 'Highly Stressed', 'Neutral'];
const MAX_STROKES = 5000;

// As requested: average segment speed = distance / time (per consecutive point pair).
function calculateAverageSpeed(points) {
  let totalSpeed = 0;
  let count = 0;

  for (let i = 1; i < points.length; i += 1) {
    const dx = points[i].x - points[i - 1].x;
    const dy = points[i].y - points[i - 1].y;
    const dt = points[i].timestamp - points[i - 1].timestamp;

    if (dt > 0) {
      const distance = Math.sqrt(dx * dx + dy * dy);
      const speed = distance / dt;
      totalSpeed += speed;
      count += 1;
    }
  }

  return count ? totalSpeed / count : 0;
}

function inferMood({ speed, density }) {
  if (speed > 0.8 && density > 0.7) return 'Highly Stressed';
  if (speed > 0.6) return 'Stressed';
  if (speed < 0.3 && density < 0.4) return 'Tired';
  if (speed < 0.4) return 'Calm';
  return 'Neutral';
}

function reasonForMood(mood) {
  if (mood === 'Stressed' || mood === 'Highly Stressed') {
    return 'High drawing speed detected → possible stress';
  }
  if (mood === 'Tired') return 'Low activity pace detected → possible fatigue';
  if (mood === 'Calm') return 'Steady drawing pace detected → possible calm';
  if (mood === 'Neutral') return 'Drawing pace appears mixed → neutral state';
  return 'Thanks for sharing. Consider a short reset and notice your breathing.';
}

const submitDoodleEntry = async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      return res.status(403).json({ message: 'Admins cannot submit doodle moods' });
    }

    const { strokes, emotionTag, inferredMood, metrics, createdAt } = req.body || {};

    if (!Array.isArray(strokes) || strokes.length < 2) {
      return res.status(400).json({ message: 'strokes must be an array with at least 2 points' });
    }

    const emotionTagSafe = typeof emotionTag === 'string' && emotionTag.trim() ? emotionTag.trim() : null;
    if (emotionTagSafe && !ALLOWED_EMOTION_TAGS.includes(emotionTagSafe)) {
      return res.status(400).json({ message: `emotionTag must be one of: ${ALLOWED_EMOTION_TAGS.join(', ')}` });
    }

    if (typeof metrics !== 'object' || metrics === null) {
      return res.status(400).json({ message: 'metrics must be an object { speed, density }' });
    }

    const cleanedStrokes = strokes
      .filter((p) => p && Number.isFinite(p.x) && Number.isFinite(p.y) && Number.isFinite(p.timestamp))
      .map((p) => ({ x: Number(p.x), y: Number(p.y), timestamp: Number(p.timestamp) }));

    if (cleanedStrokes.length < 2) {
      return res.status(400).json({ message: 'strokes must contain valid points with x, y, timestamp' });
    }

    if (cleanedStrokes.length > MAX_STROKES) {
      return res.status(400).json({ message: `strokes is too large; max allowed is ${MAX_STROKES} points` });
    }

    cleanedStrokes.sort((a, b) => a.timestamp - b.timestamp);

    const avgSpeed = calculateAverageSpeed(cleanedStrokes);
    const normalizedSpeed = Math.min(avgSpeed / 1.5, 1);
    const density = Math.min(cleanedStrokes.length / 500, 1);

    const computedInferredMood = inferMood({ speed: normalizedSpeed, density });

    // Combine with user-selected emotion (if exists).
    const finalInferredMood = emotionTagSafe || computedInferredMood;
    const inferredMoodSafe = ALLOWED_INFERRED_MOODS.includes(finalInferredMood) ? finalInferredMood : computedInferredMood;

    // Reason should be driven by speed-based inference (not the emotionTag override),
    // so the UI can always explain what the canvas signals.
    const message = reasonForMood(computedInferredMood);

    // Always save computed metrics for consistency.
    const doc = await DoodleEntry.create({
      userId: req.user.id,
      strokes: cleanedStrokes,
      emotionTag: emotionTagSafe || undefined,
      inferredMood: inferredMoodSafe,
      metrics: {
        speed: Number.isFinite(normalizedSpeed) ? normalizedSpeed : 0,
        density: Number.isFinite(density) ? density : 0,
        strokeSpeed: Number.isFinite(normalizedSpeed) ? normalizedSpeed : 0,
      },
      createdAt: createdAt ? new Date(createdAt) : new Date(),
    });

    return res.status(201).json({
      id: doc._id,
      emotionTag: doc.emotionTag,
      inferredMood: doc.inferredMood,
      metrics: {
        speed: doc.metrics.speed,
        density: doc.metrics.density,
      },
      createdAt: doc.createdAt,
      message,
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('submitDoodleEntry error:', err);
    return res.status(500).json({ message: 'Failed to save doodle entry' });
  }
};

module.exports = { submitDoodleEntry };

