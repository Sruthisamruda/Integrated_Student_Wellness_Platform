/**
 * Dashboard: welcome message and quick links to Mood, Study, Relaxation.
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../api';
import ActivitySuggestions from '../components/ActivitySuggestions';

const cards = [
  { to: '/mood', title: 'Mood Tracker', desc: 'Log how you feel and track trends over time.', emoji: '😊' },
  { to: '/study', title: 'Study Planner', desc: 'Manage assignments and due dates.', emoji: '📚' },
  { to: '/relax', title: 'Relaxation', desc: 'Breathing exercises and meditation resources.', emoji: '🧘' },
];

export default function Dashboard() {
  const { user } = useAuth();
  const name = user?.name || user?.email?.split('@')[0] || 'Student';
  const [latestMood, setLatestMood] = useState(null);

  useEffect(() => {
    apiRequest('/mood')
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setLatestMood(data[0].mood);
        }
      })
      .catch(() => {
        // Silently fail - suggestions are optional
      });
  }, []);

  return (
    <div>
      <h1>Welcome, {name}</h1>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
        Take a moment for your wellness. Track your mood, plan your study, and relax when you need it.
      </p>

      <ActivitySuggestions mood={latestMood} />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: '1rem',
        }}
      >
        {cards.map((card) => (
          <Link
            key={card.to}
            to={card.to}
            style={{
              display: 'block',
              padding: '1.25rem',
              background: 'var(--color-surface)',
              borderRadius: 'var(--radius)',
              boxShadow: 'var(--shadow)',
              textDecoration: 'none',
              color: 'var(--color-text)',
              border: '1px solid var(--color-border)',
              transition: 'border-color 0.2s, box-shadow 0.2s',
            }}
          >
            <span style={{ fontSize: '2rem' }}>{card.emoji}</span>
            <h3 style={{ margin: '0.5rem 0 0.25rem' }}>{card.title}</h3>
            <p style={{ margin: 0, fontSize: '0.9375rem', color: 'var(--color-text-muted)' }}>{card.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
