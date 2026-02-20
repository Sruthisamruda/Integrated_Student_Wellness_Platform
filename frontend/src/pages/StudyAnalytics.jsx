/**
 * Study Planner Analytics: Completed vs pending tasks, completion trends for admins.
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

export default function StudyAnalytics() {
  const [studyStats, setStudyStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError('');
      try {
        const studyData = await apiRequest('/admin/study-stats').catch(() => ({
          completed: 0,
          pending: 0,
          total: 0,
          trends: [],
        }));
        setStudyStats(studyData);
      } catch (err) {
        setError(err.message || 'Failed to load study statistics');
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
        <p>Loading study planner analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h1>Study Planner Analytics</h1>
        <div className="message-error" role="alert">{error}</div>
      </div>
    );
  }

  return (
    <div>
      <h1>Study Planner Analytics</h1>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem', fontSize: '1.05rem' }}>
        Assignment completion statistics and productivity trends across all students.
      </p>

      <div className="card" style={{ marginBottom: '2rem', padding: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {/* Completed vs Pending Bar Chart */}
          <div>
            <h3 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: 500, color: 'var(--color-text-muted)' }}>
              Completed vs Pending Tasks
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart
                data={[
                  { name: 'Completed', count: studyStats?.completed ?? 0 },
                  { name: 'Pending', count: studyStats?.pending ?? 0 },
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#1e4d6b" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Completion Trends Line Chart */}
          <div>
            <h3 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: 500, color: 'var(--color-text-muted)' }}>
              Tasks Completion Trend (Last 7 Days)
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={studyStats?.trends || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#2d8b6a" strokeWidth={2} />
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
            Total Assignments: <strong style={{ color: 'var(--color-primary)' }}>{studyStats?.total ?? 0}</strong>
          </div>
          <div>
            Completed: <strong style={{ color: 'var(--color-primary)' }}>{studyStats?.completed ?? 0}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
