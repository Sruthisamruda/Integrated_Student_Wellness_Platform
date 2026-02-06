/**
 * Relaxation page: static meditation and breathing resources (no API).
 * Calming content and simple instructions.
 */

import { useState, useRef, useEffect } from 'react';

const BREATHING_STEPS = [
  { label: 'Breathe in', duration: 4 },
  { label: 'Hold', duration: 4 },
  { label: 'Breathe out', duration: 6 },
];

export default function Relaxation() {
  const [breathStep, setBreathStep] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const intervalRef = useRef(null);

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

  const stopBreathing = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    setIsActive(false);
    setBreathStep(0);
  };

  return (
    <div>
      <h1>Relaxation</h1>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
        Take a short break. Try the breathing exercise below or use the meditation tips.
      </p>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <h2>4-4-6 Breathing</h2>
        <p style={{ marginBottom: '1rem' }}>
          Breathe in for 4 seconds, hold for 4, breathe out for 6. Repeat for a few cycles to calm your nervous system.
        </p>
        <div
          style={{
            textAlign: 'center',
            padding: '1.5rem',
            background: 'rgba(45, 90, 123, 0.06)',
            borderRadius: 'var(--radius)',
            marginBottom: '1rem',
          }}
        >
          <p style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-primary)', margin: '0 0 0.5rem' }}>
            {step?.label}
          </p>
          <p style={{ margin: 0, color: 'var(--color-text-muted)' }}>{step?.duration} seconds</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-accent"
            onClick={() => setIsActive(true)}
            disabled={isActive}
          >
            Start breathing
          </button>
          {isActive && (
            <button type="button" className="btn btn-outline" onClick={stopBreathing}>
              Stop
            </button>
          )}
        </div>
      </div>

      <div className="card">
        <h2>Quick meditation tips</h2>
        <ul style={{ paddingLeft: '1.25rem', color: 'var(--color-text)', lineHeight: 1.7 }}>
          <li>Find a quiet spot and sit comfortably.</li>
          <li>Close your eyes and focus on your breath for 2–5 minutes.</li>
          <li>When your mind wanders, gently return to the breath.</li>
          <li>Use apps like Headspace or Calm for guided sessions if you like.</li>
        </ul>
      </div>
    </div>
  );
}
