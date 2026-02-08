/**
 * ActivitySuggestions component: displays personalized activity suggestions based on mood.
 */

import { useState, useEffect } from 'react';
import { apiRequest } from '../api';

export default function ActivitySuggestions({ mood }) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!mood) return;
    setLoading(true);
    setError('');
    apiRequest(`/activities?mood=${encodeURIComponent(mood)}`)
      .then((data) => {
        setSuggestions(data.suggestions || []);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load suggestions');
      })
      .finally(() => setLoading(false));
  }, [mood]);

  if (!mood) return null;

  if (loading) {
    return (
      <div className="card activity-suggestions" style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '0.75rem' }}>Activity suggestions</h3>
        <div className="loading-wrap">
          <div className="loading-spinner" aria-hidden />
          <p>Loading suggestions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card activity-suggestions" style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '0.75rem' }}>Activity suggestions</h3>
        <p style={{ color: 'var(--color-text-muted)' }}>{error}</p>
      </div>
    );
  }

  if (suggestions.length === 0) return null;

  return (
    <div
      className="card activity-suggestions"
      style={{
        marginBottom: '2rem',
        background: 'linear-gradient(135deg, var(--color-surface) 0%, var(--color-primary-soft) 50%, var(--color-accent-soft) 100%)',
        border: '1px solid var(--color-border)',
      }}
    >
      <h3 style={{ marginBottom: '0.5rem', color: 'var(--color-primary)' }}>
        💡 Activity suggestions for your mood
      </h3>
      <p style={{ fontSize: '0.9375rem', color: 'var(--color-text-muted)', marginBottom: '1.25rem' }}>
        Based on how you&apos;re feeling, here are some activities that might help:
      </p>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
          gap: '1rem',
        }}
      >
        {suggestions.map((activity, idx) => (
          <div
            key={idx}
            className="activity-card"
            style={{
              padding: '1.25rem',
              background: 'var(--color-surface)',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--color-border)',
              transition: 'all var(--transition)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{activity.icon}</div>
            <h4 style={{ margin: '0 0 0.4rem', fontSize: '1rem', color: 'var(--color-primary)' }}>
              {activity.title}
            </h4>
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text-muted)', lineHeight: 1.55 }}>
              {activity.description}
            </p>
            {activity.category && (
              <span
                style={{
                  display: 'inline-block',
                  marginTop: '0.75rem',
                  padding: '0.25rem 0.6rem',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  background: 'var(--color-primary-soft)',
                  color: 'var(--color-primary)',
                  borderRadius: '6px',
                  textTransform: 'capitalize',
                }}
              >
                {activity.category}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
