/**
 * Forum Analytics: Engagement statistics and trends for admins.
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

const COLORS = ['#1e4d6b', '#2d8b6a'];

export default function ForumAnalytics() {
  const [forumStats, setForumStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError('');
      try {
        const statsData = await apiRequest('/admin/forum-stats').catch(() => ({
          totalPosts: 0,
          totalComments: 0,
          totalLikes: 0,
          mostActiveStudent: null,
          engagementTrend: [],
          topPosts: [],
        }));
        setForumStats(statsData);
      } catch (err) {
        setError(err.message || 'Failed to load forum statistics');
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
        <p>Loading forum analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h1>Forum Analytics</h1>
        <div className="message-error" role="alert">{error}</div>
      </div>
    );
  }

  const pieData = [
    { name: 'Likes', value: forumStats?.totalLikes || 0 },
    { name: 'Comments', value: forumStats?.totalComments || 0 },
  ];

  return (
    <div>
      <h1>Forum Analytics</h1>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem', fontSize: '1.05rem' }}>
        Community engagement statistics and trends.
      </p>

      {/* Summary Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem',
        }}
      >
        <div className="card" style={{ textAlign: 'center', padding: '1.5rem' }}>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '0.5rem' }}>
            {forumStats?.totalPosts ?? 0}
          </div>
          <div style={{ fontSize: '0.9375rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>Total Posts</div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '1.5rem' }}>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '0.5rem' }}>
            {forumStats?.totalComments ?? 0}
          </div>
          <div style={{ fontSize: '0.9375rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>Total Comments</div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '1.5rem' }}>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '0.5rem' }}>
            {forumStats?.totalLikes ?? 0}
          </div>
          <div style={{ fontSize: '0.9375rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>Total Likes</div>
        </div>
        {forumStats?.mostActiveStudent && (
          <div className="card" style={{ textAlign: 'center', padding: '1.5rem' }}>
            <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-primary)', marginBottom: '0.5rem' }}>
              {forumStats.mostActiveStudent.name || forumStats.mostActiveStudent.email}
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
              Most Active ({forumStats.mostActiveStudent.postCount} posts)
            </div>
          </div>
        )}
      </div>

      {/* Charts */}
      <div className="card" style={{ marginBottom: '2rem', padding: '1.5rem' }}>
        <h2 style={{ marginBottom: '1.5rem', fontSize: '1.35rem', fontWeight: 600 }}>Engagement Trends</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {/* Posts per Day Bar Chart */}
          <div>
            <h3 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: 500, color: 'var(--color-text-muted)' }}>
              Posts per Day (Last 7 Days)
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={forumStats?.engagementTrend || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#1e4d6b" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Engagement Trend Line Chart */}
          <div>
            <h3 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: 500, color: 'var(--color-text-muted)' }}>
              Engagement Trend
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={forumStats?.engagementTrend || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#2d8b6a" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Like vs Comment Pie Chart */}
          <div>
            <h3 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: 500, color: 'var(--color-text-muted)' }}>
              Like vs Comment Distribution
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Posts */}
      {forumStats?.topPosts && forumStats.topPosts.length > 0 && (
        <div className="card" style={{ padding: '1.5rem' }}>
          <h2 style={{ marginBottom: '1rem', fontSize: '1.35rem', fontWeight: 600 }}>Top 5 Most Liked Posts</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {forumStats.topPosts.map((post, idx) => (
              <div
                key={post._id}
                style={{
                  padding: '0.75rem',
                  background: 'var(--color-bg)',
                  borderRadius: 'var(--radius)',
                  border: '1px solid var(--color-border)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <strong style={{ color: 'var(--color-primary)' }}>#{idx + 1} {post.author}</strong>
                  <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                    {post.likes} likes • {post.comments} comments
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '0.9375rem', color: 'var(--color-text)' }}>{post.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
