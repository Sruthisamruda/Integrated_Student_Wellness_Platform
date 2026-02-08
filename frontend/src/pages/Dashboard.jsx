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
      .catch(() => {});
  }, []);

  return (
    <div className="dashboard">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ marginBottom: '0.5rem' }}>Welcome, {name}</h1>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: 0, fontSize: '1.05rem' }}>
          Take a moment for your wellness. Track your mood, plan your study, and relax when you need it.
        </p>
      </div>

      <ActivitySuggestions mood={latestMood} />

      <h2 style={{ marginBottom: '1rem' }}>Quick access</h2>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '1.25rem',
        }}
      >
        {cards.map((card) => (
          <Link key={card.to} to={card.to} className="feature-card">
            <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.75rem' }}>{card.emoji}</span>
            <h3 style={{ margin: '0 0 0.35rem', color: 'var(--color-primary)' }}>{card.title}</h3>
            <p style={{ margin: 0, fontSize: '0.9375rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
              {card.desc}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
