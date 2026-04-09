/**
 * Mood Tracker page (/mood).
 * The doodle canvas has been moved to the Mood Assessment page.
 * This page now guides users to the correct location.
 */

import { useNavigate } from 'react-router-dom';

export default function MoodTracker() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        minHeight: '100%',
        background: 'linear-gradient(180deg, #f4f7fb 0%, #eef3f8 45%, #f8fafc 100%)',
        margin: '-0.5rem',
        padding: '1.5rem 1rem 2.5rem',
        borderRadius: 'var(--radius-lg)',
      }}
    >
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        <h1 style={{ marginBottom: '0.35rem', fontWeight: 800 }}>Mood Tracker</h1>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem', fontSize: '1.05rem' }}>
          Express how you feel using the doodle canvas or the mood questionnaire.
        </p>

        <div
          className="card"
          style={{
            textAlign: 'center',
            padding: '2.5rem 2rem',
            boxShadow: 'var(--shadow)',
            border: '1px solid rgba(30, 77, 107, 0.08)',
          }}
        >
          <span style={{ fontSize: '3.5rem', display: 'block', marginBottom: '1rem' }}>🎨</span>
          <h2 style={{ marginBottom: '0.5rem' }}>Doodle Mood Logging</h2>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.75rem', lineHeight: 1.65 }}>
            The doodle canvas is now part of the <strong>Mood Assessment</strong> page.
            Head over there to draw how you feel, pick an emotion tag, replay your
            doodle, and save an instant mood insight — alongside the questionnaire.
          </p>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-primary"
              style={{ minWidth: 220 }}
              onClick={() => navigate('/mood-assessment', { state: { tab: 'doodle' } })}
            >
              Open Doodle Canvas →
            </button>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => navigate('/mood-assessment')}
            >
              Take Mood Assessment
            </button>
          </div>
        </div>

        <div
          className="card"
          style={{
            marginTop: '1.25rem',
            display: 'flex',
            gap: '1rem',
            alignItems: 'flex-start',
            padding: '1rem 1.25rem',
            background: 'var(--color-primary-soft)',
            border: '1px solid var(--color-border)',
          }}
        >
          <span style={{ fontSize: '1.4rem', lineHeight: 1 }}>💡</span>
          <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.95rem', lineHeight: 1.6 }}>
            After saving a doodle mood, your <strong>Dashboard</strong> will automatically
            update to reflect your latest mood and suggest personalised wellness activities.
          </p>
        </div>
      </div>
    </div>
  );
}
