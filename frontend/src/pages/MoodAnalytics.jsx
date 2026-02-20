/**
 * Mood Analytics: Mood distribution, trends, and percentage charts for admins.
 */

import { useState, useEffect } from 'react';
import { apiRequest } from '../api';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const COLORS = ['#1e4d6b', '#2d8b6a', '#4a7fa3', '#5ba88a', '#64748b', '#c53030', '#276749'];

export default function MoodAnalytics() {
  const [moodStats, setMoodStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError('');
      try {
        const moodData = await apiRequest('/admin/mood-stats').catch(() => ({
          distribution: [],
          trends: [],
          total: 0,
        }));
        setMoodStats(moodData);
      } catch (err) {
        setError(err.message || 'Failed to load mood statistics');
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
        <p>Loading mood analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h1>Mood Analytics</h1>
        <div className="message-error" role="alert">{error}</div>
      </div>
    );
  }

  return (
    <div>
      <h1>Mood Analytics</h1>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem', fontSize: '1.05rem' }}>
        Comprehensive mood tracking statistics and trends across all students.
      </p>

      <div className="card" style={{ marginBottom: '2rem', padding: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {/* Mood Distribution Bar Chart */}
          <div>
            <h3 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: 500, color: 'var(--color-text-muted)' }}>
              Mood Distribution
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={moodStats?.distribution || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mood" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#1e4d6b" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Mood Trends Line Chart */}
          <div>
            <h3 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: 500, color: 'var(--color-text-muted)' }}>
              Mood Trends (Last 7 Days)
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={moodStats?.trends || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#2d8b6a" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Mood Pie Chart */}
          <div>
            <h3 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: 500, color: 'var(--color-text-muted)' }}>
              Mood Percentage
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={moodStats?.distribution || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ mood, percent }) => `${mood}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {(moodStats?.distribution || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div style={{ marginTop: '1.5rem', fontSize: '0.9375rem', color: 'var(--color-text-muted)' }}>
          Total Mood Entries: <strong style={{ color: 'var(--color-primary)' }}>{moodStats?.total ?? 0}</strong>
        </div>
      </div>
    </div>
  );
}
