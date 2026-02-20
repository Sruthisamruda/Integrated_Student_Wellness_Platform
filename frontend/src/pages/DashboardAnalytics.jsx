/**
 * Dashboard Analytics: Overall platform statistics for admins.
 * Shows total students, active users, new users, and summary cards.
 */

import { useState, useEffect } from 'react';
import { apiRequest } from '../api';

export default function DashboardAnalytics() {
  const [userStats, setUserStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError('');
      try {
        const userData = await apiRequest('/admin/user-stats').catch(() => ({
          total: 0,
          activeThisWeek: 0,
          newThisMonth: 0,
        }));
        setUserStats(userData);
      } catch (err) {
        setError(err.message || 'Failed to load dashboard statistics');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="loading-wrap">
        <div className="loading-spinner" aria-hidden />
        <p>Loading dashboard statistics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h1>Dashboard Analytics</h1>
        <div className="message-error" role="alert">{error}</div>
      </div>
    );
  }

  return (
    <div>
      <h1>Dashboard Analytics</h1>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem', fontSize: '1.05rem' }}>
        Overall platform statistics and user engagement metrics.
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1.25rem',
        }}
      >
        <div className="card" style={{ textAlign: 'center', padding: '1.5rem' }}>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '0.5rem' }}>
            {userStats?.total ?? 0}
          </div>
          <div style={{ fontSize: '0.9375rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
            Total Students
          </div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '1.5rem' }}>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '0.5rem' }}>
            {userStats?.activeThisWeek ?? 0}
          </div>
          <div style={{ fontSize: '0.9375rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
            Active This Week
          </div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '1.5rem' }}>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '0.5rem' }}>
            {userStats?.newThisMonth ?? 0}
          </div>
          <div style={{ fontSize: '0.9375rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
            New This Month
          </div>
        </div>
      </div>
    </div>
  );
}
