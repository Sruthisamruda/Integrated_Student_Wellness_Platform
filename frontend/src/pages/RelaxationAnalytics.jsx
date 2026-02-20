/**
 * Relaxation Analytics: Session usage statistics and trends for admins.
 */

import { useState, useEffect } from 'react';
import { apiRequest } from '../api';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export default function RelaxationAnalytics() {
  const [relaxationStats, setRelaxationStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError('');
      try {
        const relaxationData = await apiRequest('/admin/relaxation-stats').catch(() => ({
          totalSessions: 0,
          mostUsedActivity: 'breathing',
          distribution: [],
          trends: [],
        }));
        setRelaxationStats(relaxationData);
      } catch (err) {
        setError(err.message || 'Failed to load relaxation statistics');
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
        <p>Loading relaxation analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h1>Relaxation Analytics</h1>
        <div className="message-error" role="alert">{error}</div>
      </div>
    );
  }

  return (
    <div>
      <h1>Relaxation Analytics</h1>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem', fontSize: '1.05rem' }}>
        Relaxation feature usage statistics and engagement trends.
      </p>

      <div className="card" style={{ marginBottom: '2rem', padding: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {/* Weekly Usage Trend */}
          <div>
            <h3 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: 500, color: 'var(--color-text-muted)' }}>
              Weekly Usage Trend
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={relaxationStats?.trends || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#5ba88a" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div
          style={{
            marginTop: '1.5rem',
            display: 'flex',
            gap: '2rem',
            fontSize: '0.9375rem',
            color: 'var(--color-text-muted)',
          }}
        >
          <div>
            Total Sessions Used: <strong style={{ color: 'var(--color-primary)' }}>{relaxationStats?.totalSessions ?? 0}</strong>
          </div>
          <div>
            Most Used Activity: <strong style={{ color: 'var(--color-primary)' }}>{relaxationStats?.mostUsedActivity || 'breathing'}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
