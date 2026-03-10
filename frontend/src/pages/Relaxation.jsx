import { useState, useRef, useEffect } from 'react';
import { apiRequest } from '../api';

const BREATHING_STEPS = [
  { label: 'Breathe in', duration: 4 },
  { label: 'Hold', duration: 4 },
  { label: 'Breathe out', duration: 6 },
];

const MOOD_SCALE = [
  { value: 1, label: '1 - Very stressed' },
  { value: 2, label: '2 - Stressed' },
  { value: 3, label: '3 - Neutral' },
  { value: 4, label: '4 - Calm' },
  { value: 5, label: '5 - Very calm' },
];

const ACTIVITY_TYPES = [
  { value: 'breathing', label: 'Breathing' },
  { value: 'music', label: 'Music' },
  { value: 'walk', label: 'Walk' },
  { value: 'stretch', label: 'Stretch' },
  { value: 'journaling', label: 'Journaling' },
  { value: 'meditation', label: 'Meditation' },
  { value: 'other', label: 'Other' },
];

function MoodPrompt({ question, onSelect }) {
  return (
    <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--color-primary-soft)', borderRadius: 'var(--radius)' }}>
      <p style={{ margin: '0 0 0.75rem', fontWeight: 500 }}>{question}</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
        {MOOD_SCALE.map((opt) => (
          <button
            key={opt.value}
            type="button"
            className="btn btn-outline"
            onClick={() => onSelect(opt.value)}
            style={{ fontSize: '0.875rem' }}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function Relaxation() {
  const [breathStep, setBreathStep] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [moodBefore, setMoodBefore] = useState(null);
  const [showBeforePrompt, setShowBeforePrompt] = useState(false);
  const [showAfterPrompt, setShowAfterPrompt] = useState(false);
  const [logActivityOpen, setLogActivityOpen] = useState(false);
  const [logActivityType, setLogActivityType] = useState('music');
  const [logMoodBefore, setLogMoodBefore] = useState(null);
  const [logMoodAfter, setLogMoodAfter] = useState(null);
  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);

  const step = BREATHING_STEPS[breathStep];

  useEffect(() => {
    if (!isActive) return;
    let elapsed = 0;
    intervalRef.current = setInterval(() => {
      elapsed += 1;
      let sum = 0;
      for (let i = 0; i < BREATHING_STEPS.length; i++) {
        sum += BREATHING_STEPS[i].duration;
        if (elapsed <= sum) {
          setBreathStep(i);
          return;
        }
      }
      elapsed = 0;
      setBreathStep(0);
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive]);

  const startBreathing = () => {
    setShowBeforePrompt(true);
  };

  const onMoodBeforeSelect = (val) => {
    setMoodBefore(val);
    setShowBeforePrompt(false);
    setIsActive(true);
    startTimeRef.current = Date.now();
  };

  const stopBreathing = () => {
    setShowAfterPrompt(true);
  };

  const onMoodAfterSelect = async (val) => {
    setShowAfterPrompt(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    setIsActive(false);
    setBreathStep(0);
    const duration = startTimeRef.current ? Math.floor((Date.now() - startTimeRef.current) / 1000) : 0;
    try {
      await apiRequest('/relaxation/session', {
        method: 'POST',
        body: JSON.stringify({
          activityType: 'breathing',
          duration,
          moodBefore,
          moodAfter: val,
        }),
      });
    } catch (err) {
      // Silently fail
    }
    setMoodBefore(null);
  };

  const openLogActivity = (activityType) => {
    setLogActivityType(activityType);
    setLogMoodBefore(null);
    setLogMoodAfter(null);
    setLogActivityOpen(true);
  };

  const submitLogActivity = async () => {
    if (logMoodBefore == null || logMoodAfter == null) return;
    try {
      await apiRequest('/relaxation/session', {
        method: 'POST',
        body: JSON.stringify({
          activityType: logActivityType,
          duration: 0,
          moodBefore: logMoodBefore,
          moodAfter: logMoodAfter,
        }),
      });
      setLogActivityOpen(false);
    } catch (err) {
      // Silently fail
    }
  };

  return (
    <div>
      <h1>Relaxation</h1>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.75rem', fontSize: '1.05rem' }}>
        Choose a quick activity to reset your mind and body. Mix breathing, movement, music, and journaling.
      </p>

      {/* Breathing exercises */}
      <div
        className="card"
        style={{
          marginBottom: '2rem',
          background: 'linear-gradient(135deg, var(--color-surface) 0%, var(--color-primary-soft) 100%)',
        }}
      >
        <h2 style={{ marginBottom: '0.75rem' }}>Breathing Exercises</h2>
        <p style={{ marginBottom: '1rem', color: 'var(--color-text-muted)' }}>
          Use your breath to quickly reduce anxiety and calm your nervous system.
        </p>
        <ul style={{ paddingLeft: '1.5rem', marginBottom: '1.25rem', lineHeight: 1.7 }}>
          <li><strong>4-7-8 breathing</strong>: Inhale 4s, hold 7s, exhale 8s.</li>
          <li><strong>Box breathing</strong>: Inhale 4s, hold 4s, exhale 4s, hold 4s.</li>
          <li><strong>Deep belly breathing</strong>: Slow, deep breaths into your abdomen.</li>
        </ul>
        <div
          style={{
            textAlign: 'center',
            padding: '2rem',
            background: 'var(--color-surface)',
            borderRadius: 'var(--radius)',
            marginBottom: '1.25rem',
            border: '1px solid var(--color-border)',
          }}
        >
          <p style={{ fontSize: '1.35rem', fontWeight: 600, color: 'var(--color-primary)', margin: '0 0 0.5rem' }}>
            {step?.label}
          </p>
          <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.9375rem' }}>
            {step?.duration} seconds
          </p>
        </div>
        {showBeforePrompt && (
          <MoodPrompt
            question="Before you start: How do you feel right now? (1 = very stressed, 5 = very calm)"
            onSelect={onMoodBeforeSelect}
          />
        )}
        {showAfterPrompt && (
          <MoodPrompt
            question="After breathing: How do you feel now?"
            onSelect={onMoodAfterSelect}
          />
        )}
        {!showBeforePrompt && !showAfterPrompt && (
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-accent"
              onClick={startBreathing}
              disabled={isActive}
            >
              Start guided breathing
            </button>
            {isActive && (
              <button type="button" className="btn btn-outline" onClick={stopBreathing}>
                Stop
              </button>
            )}
          </div>
        )}
      </div>

      {/* Log other activities */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h2 style={{ marginBottom: '0.75rem' }}>Log relaxation activity</h2>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: '1rem', fontSize: '0.95rem' }}>
          Rate your mood before and after an activity to help us personalize your suggestions.
        </p>
        {logActivityOpen ? (
          <div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 500 }}>Activity</label>
              <select
                value={logActivityType}
                onChange={(e) => setLogActivityType(e.target.value)}
                style={{ padding: '0.5rem', borderRadius: 'var(--radius)', minWidth: '160px' }}
              >
                {ACTIVITY_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            {logMoodBefore == null ? (
              <MoodPrompt question="How do you feel before the activity?" onSelect={setLogMoodBefore} />
            ) : logMoodAfter == null ? (
              <MoodPrompt question="Do the activity, then rate how you feel now." onSelect={setLogMoodAfter} />
            ) : (
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <button type="button" className="btn btn-accent" onClick={submitLogActivity}>Save</button>
                <button type="button" className="btn btn-outline" onClick={() => setLogActivityOpen(false)}>Cancel</button>
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            <button type="button" className="btn btn-outline" onClick={() => openLogActivity('music')}>I listened to music</button>
            <button type="button" className="btn btn-outline" onClick={() => openLogActivity('walk')}>I took a walk</button>
            <button type="button" className="btn btn-outline" onClick={() => openLogActivity('stretch')}>I stretched</button>
            <button type="button" className="btn btn-outline" onClick={() => openLogActivity('journaling')}>I journaled</button>
          </div>
        )}
      </div>

      {/* Music Therapy */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ marginBottom: '0.75rem' }}>Music Therapy</h2>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>
          Put on headphones and try one of these ideas while you relax or study:
        </p>
        <ul style={{ paddingLeft: '1.5rem', lineHeight: 1.7 }}>
          <li>Lo-fi study music playlist.</li>
          <li>Nature sounds (rain, forest, ocean).</li>
          <li>Soft instrumental piano or guitar.</li>
          <li>Focus music to stay in deep work mode.</li>
        </ul>
      </div>

      {/* Walk and Refresh + Quick Stretch */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ marginBottom: '0.75rem' }}>Walk & Quick Stretch</h2>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>
          Move your body for 5–10 minutes to release tension and reset your focus.
        </p>
        <ul style={{ paddingLeft: '1.5rem', lineHeight: 1.7, marginBottom: '0.75rem' }}>
          <li>Take a short walk around your room, home, or campus.</li>
          <li>Step outside for fresh air and look at something far away.</li>
        </ul>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
          Quick stretch routine (2–3 minutes):
        </p>
        <ul style={{ paddingLeft: '1.5rem', lineHeight: 1.7 }}>
          <li>Neck stretch: gently tilt your head left and right.</li>
          <li>Shoulder rolls: roll shoulders forward and backward 10 times.</li>
          <li>Hand stretch: stretch fingers and wrists softly.</li>
          <li>Back stretch: stand up, reach arms overhead, and gently bend side to side.</li>
        </ul>
      </div>

      {/* Brain Refresh Mini Games */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ marginBottom: '0.75rem' }}>Brain Refresh Mini Games</h2>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>
          Use a short 5–10 minute game to reset your mind (set a timer so it doesn&apos;t become a distraction).
        </p>
        <ul style={{ paddingLeft: '1.5rem', lineHeight: 1.7 }}>
          <li>Simple puzzle or logic game.</li>
          <li>Memory matching game.</li>
          <li>Short word challenge (find as many words as you can from a long word).</li>
        </ul>
      </div>

      {/* Micro Journaling */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ marginBottom: '0.75rem' }}>Micro Journaling</h2>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>
          Take 2–3 minutes to write a few short sentences. You don&apos;t need full paragraphs.
        </p>
        <ul style={{ paddingLeft: '1.5rem', lineHeight: 1.7, marginBottom: '0.75rem' }}>
          <li>One thing that made me smile today.</li>
          <li>Something I am proud of today.</li>
          <li>What stressed me today (and one small thing I can do about it).</li>
        </ul>
        <textarea
          placeholder="Type a few lines here just for yourself..."
          rows={3}
          style={{
            width: '100%',
            resize: 'vertical',
            padding: '0.75rem',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--color-border)',
            fontSize: '0.95rem',
          }}
        />
      </div>

      {/* Positive affirmations + Mindfulness */}
      <div className="card">
        <h2 style={{ marginBottom: '0.75rem' }}>Positive Affirmations & Mindfulness</h2>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
          Read a line slowly, then take one deep breath.
        </p>
        <ul style={{ paddingLeft: '1.5rem', lineHeight: 1.7, marginBottom: '0.75rem' }}>
          <li>&quot;You are doing better than you think.&quot;</li>
          <li>&quot;Small progress is still progress.&quot;</li>
          <li>&quot;Take it one step at a time.&quot;</li>
        </ul>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
          One-minute mindfulness ideas:
        </p>
        <ul style={{ paddingLeft: '1.5rem', lineHeight: 1.7 }}>
          <li>Notice 5 things you can see around you.</li>
          <li>Focus on 3 different sounds you can hear.</li>
          <li>Place one hand on your chest, one on your stomach, and follow your breath for 60 seconds.</li>
        </ul>
      </div>
    </div>
  );
}
