/**
 * Dashboard Analytics: Overall platform statistics for admins.
 * Shows total students, active users, new users, and summary cards.
 */

import { useState, useEffect } from 'react';
import { apiRequest } from '../api';
import { useNavigate } from 'react-router-dom';

export default function DashboardAnalytics() {
  const [userStats, setUserStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const [studentsStress, setStudentsStress] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [studentsError, setStudentsError] = useState('');
  const [onlyHighStress, setOnlyHighStress] = useState(false);

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

  useEffect(() => {
    const fetchStudentsStress = async () => {
      setStudentsLoading(true);
      setStudentsError('');
      try {
        const data = await apiRequest('/admin/students-stress').catch(() => ({ students: [] }));
        setStudentsStress(data?.students || []);
      } catch (err) {
        setStudentsError(err.message || 'Failed to load student stress overview');
      } finally {
        setStudentsLoading(false);
      }
    };
    fetchStudentsStress();
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

      {/* 2. Student stress overview */}
      <section style={{ marginTop: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <h2 style={{ margin: 0 }}>Student Stress Overview</h2>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
              <input type="checkbox" checked={onlyHighStress} onChange={(e) => setOnlyHighStress(e.target.checked)} />
              Show only high stress students
            </label>
            <button type="button" className="btn btn-outline" onClick={() => setOnlyHighStress(false)}>
              Show all
            </button>
          </div>
        </div>

        {studentsLoading ? (
          <div className="card">
            <div className="loading-spinner" aria-hidden />
            <p style={{ margin: '0.75rem 0 0', color: 'var(--color-text-muted)' }}>Loading students stress overview...</p>
          </div>
        ) : studentsError ? (
          <div className="card">
            <div className="message-error" role="alert">
              {studentsError}
            </div>
          </div>
        ) : (
          <div className="card" style={{ padding: '1rem' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 760 }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '0.75rem 0.5rem', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Student</th>
                    <th style={{ textAlign: 'left', padding: '0.75rem 0.5rem', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Stress</th>
                    <th style={{ textAlign: 'left', padding: '0.75rem 0.5rem', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Mood category</th>
                    <th style={{ textAlign: 'left', padding: '0.75rem 0.5rem', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Pending</th>
                    <th style={{ textAlign: 'left', padding: '0.75rem 0.5rem', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Overdue</th>
                    <th style={{ textAlign: 'left', padding: '0.75rem 0.5rem', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(onlyHighStress ? studentsStress.filter((s) => s.stressLevel === 'High') : studentsStress).map((s) => {
                    const isHigh = s.stressLevel === 'High';
                    const shouldRecommend = s.rawMoodCategory === 'Highly Stressed' || s.moodCategory === 'Highly Stressed';
                    const stressColor = isHigh ? 'var(--color-error)' : s.stressLevel === 'Medium' ? '#d97706' : '#16a34a';

                    return (
                      <tr key={s.userId} style={{ borderLeft: isHigh ? `4px solid ${stressColor}` : '4px solid transparent' }}>
                        <td style={{ padding: '0.75rem 0.5rem' }}>
                          <div style={{ fontWeight: 700 }}>{s.name}</div>
                        </td>
                        <td style={{ padding: '0.75rem 0.5rem' }}>
                          <span style={{ color: stressColor, fontWeight: 800 }}>{s.stressLevel}</span>
                        </td>
                        <td style={{ padding: '0.75rem 0.5rem', color: 'var(--color-text)' }}>{s.moodCategory}</td>
                        <td style={{ padding: '0.75rem 0.5rem' }}>
                          <strong>{s.pendingTasks}</strong>
                        </td>
                        <td style={{ padding: '0.75rem 0.5rem' }}>
                          <strong style={{ color: s.overdueTasks > 0 ? 'var(--color-error)' : 'var(--color-text)' }}>{s.overdueTasks}</strong>
                        </td>
                        <td style={{ padding: '0.75rem 0.5rem' }}>
                          {shouldRecommend ? (
                            <button
                              type="button"
                              className="btn btn-danger"
                              onClick={() => navigate(`/admin/counselling?studentId=${s.userId}`)}
                            >
                              Recommend Counselling
                            </button>
                          ) : (
                            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
