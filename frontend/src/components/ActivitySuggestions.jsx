/**
 * ActivitySuggestions component: displays personalized activity suggestions based on mood.
 * Shows 3-4 suggestions with icons, titles, descriptions, and categories.
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
      <div className="card" style={{ marginTop: '1.5rem' }}>
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
      <div className="card" style={{ marginTop: '1.5rem' }}>
        <h3 style={{ marginBottom: '0.75rem' }}>Activity suggestions</h3>
        <p style={{ color: 'var(--color-text-muted)' }}>{error}</p>
      </div>
    );
  }

  if (suggestions.length === 0) return null;

  return (
    <div className="card" style={{ marginTop: '1.5rem', background: 'linear-gradient(135deg, rgba(45, 90, 123, 0.05) 0%, rgba(61, 139, 111, 0.05) 100%)' }}>
      <h3 style={{ marginBottom: '0.75rem', color: 'var(--color-primary)' }}>
        💡 Activity suggestions for your mood
      </h3>
      <p style={{ fontSize: '0.9375rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
        Based on how you&apos;re feeling, here are some activities that might help:
      </p>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: '1rem',
        }}
      >
        {suggestions.map((activity, idx) => (
          <div
            key={idx}
            style={{
              padding: '1rem',
              background: 'var(--color-surface)',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--color-border)',
              transition: 'box-shadow 0.2s',
            }}
          >
            <div style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>{activity.icon}</div>
            <h4 style={{ margin: '0 0 0.35rem', fontSize: '1rem', color: 'var(--color-primary)' }}>
              {activity.title}
            </h4>
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
              {activity.description}
            </p>
            {activity.category && (
              <span
                style={{
                  display: 'inline-block',
                  marginTop: '0.5rem',
                  padding: '0.2rem 0.5rem',
                  fontSize: '0.75rem',
                  background: 'rgba(45, 90, 123, 0.1)',
                  color: 'var(--color-primary)',
                  borderRadius: '4px',
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
