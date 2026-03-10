/**
 * Dashboard: Current Mood (Hybrid), Weekly Wellness Report, Smart Stress Alerts, Suggested Activities.
 */

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const cards = [
  { to: '/mood', title: 'Mood Tracker', desc: 'Log how you feel and track trends over time.', emoji: '😊' },
  { to: '/study', title: 'Study Planner', desc: 'Manage assignments and due dates.', emoji: '📚' },
  { to: '/relax', title: 'Relaxation', desc: 'Breathing exercises and meditation resources.', emoji: '🧘' },
];

export default function Dashboard() {
  const { user } = useAuth();
  const name = user?.name || user?.email?.split('@')[0] || 'Student';
  const navigate = useNavigate();
  const [latestMood, setLatestMood] = useState(null);
  const [academicStress, setAcademicStress] = useState(null);
  const [weeklyReport, setWeeklyReport] = useState(null);
  const [dailyPlan, setDailyPlan] = useState(null);
  const [relaxationInsights, setRelaxationInsights] = useState(null);

  useEffect(() => {
    apiRequest('/mood/latest')
      .then((data) => setLatestMood(data || null))
      .catch(() => setLatestMood(null));
    apiRequest('/mood/academic-stress')
      .then((data) => setAcademicStress(data || null))
      .catch(() => setAcademicStress(null));
    apiRequest('/mood/weekly-report')
      .then((data) => setWeeklyReport(data || null))
      .catch(() => setWeeklyReport(null));
    apiRequest('/wellness/daily-plan')
      .then((data) => setDailyPlan(data || null))
      .catch(() => setDailyPlan(null));
    apiRequest('/relaxation/effectiveness')
      .then((data) => setRelaxationInsights(data || null))
      .catch(() => setRelaxationInsights(null));
  }, []);

  const effectiveMood = latestMood?.moodCategory || academicStress?.combinedPredictedMood || academicStress?.predictedMood;
  const effectiveSuggestions = latestMood?.suggestedActivities || academicStress?.suggestions || [];

  return (
    <div className="dashboard">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ marginBottom: '0.5rem' }}>Welcome, {name}</h1>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: 0, fontSize: '1.05rem' }}>
          Take a moment for your wellness. Track your mood, plan your study, and relax when you need it.
        </p>
      </div>

      {/* 1. Current Mood (Hybrid) */}
      <section style={{ marginBottom: '2rem' }}>
        <div
          className="card"
          style={{
            marginBottom: '1rem',
            background:
              'linear-gradient(135deg, var(--color-surface) 0%, var(--color-primary-soft) 50%, var(--color-accent-soft) 100%)',
          }}
        >
          <h2 style={{ marginBottom: '0.5rem' }}>Current Mood</h2>
          {effectiveMood ? (
            <>
              <p style={{ margin: 0, color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
                {latestMood?.hybridMoodCategory ? (
                  <>Hybrid mood (questionnaire + planner): <strong>{effectiveMood}</strong></>
                ) : (
                  <>Predicted mood: <strong>{effectiveMood}</strong></>
                )}
              </p>
              {latestMood?.hybridScore != null && (
                <p style={{ margin: 0, color: 'var(--color-text-muted)', marginBottom: '0.75rem', fontSize: '0.9rem' }}>
                  Score: {latestMood.hybridScore}
                </p>
              )}
            </>
          ) : (
            <p style={{ margin: 0, color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>
              Take today&apos;s Mood Check to see your hybrid mood (questionnaire + study planner).
            </p>
          )}
        </div>

        {/* 2. Smart Stress Alerts */}
        {academicStress?.alerts && academicStress.alerts.length > 0 && (
          <div className="card" style={{ marginBottom: '1rem', borderLeft: '4px solid var(--color-error)' }}>
            <h3 style={{ marginBottom: '0.75rem', color: 'var(--color-error)' }}>Smart Stress Alerts</h3>
            {academicStress.alerts.map((alert, idx) => (
              <div key={idx} style={{ marginBottom: idx < academicStress.alerts.length - 1 ? '1rem' : 0 }}>
                <p style={{ margin: '0 0 0.5rem', fontWeight: 500 }}>{alert.message}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {(alert.recommendedActions || []).slice(0, 4).map((action) => (
                    <Link key={action} to="/relax" className="btn btn-outline" style={{ fontSize: '0.875rem', padding: '0.35rem 0.6rem' }}>
                      {action}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 3. Suggested Relaxation Activities */}
        <div className="card" style={{ marginBottom: '1rem' }}>
          <h3 style={{ marginBottom: '0.5rem' }}>Suggested Relaxation Activities</h3>
          {effectiveSuggestions.length > 0 ? (
            <ul style={{ margin: 0, paddingLeft: '1.25rem', lineHeight: 1.7 }}>
              {effectiveSuggestions.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          ) : (
            <p style={{ margin: 0, color: 'var(--color-text-muted)' }}>
              Complete a mood assessment to get personalized suggestions.
            </p>
          )}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '1rem' }}>
            <button type="button" className="btn btn-primary" onClick={() => navigate('/mood-assessment')}>
              Start Mood Assessment
            </button>
            <Link to="/relax" className="btn btn-outline">Breathing</Link>
            <Link to="/relax" className="btn btn-outline">Music & Sounds</Link>
            <Link to="/relax" className="btn btn-outline">Walk & Stretch</Link>
            <Link to="/relax" className="btn btn-outline">Journal</Link>
          </div>
        </div>

        {academicStress && (
          <div className="card" style={{ marginTop: '0.5rem' }}>
            <h3 style={{ marginBottom: '0.5rem' }}>Academic Stress Prediction</h3>
            <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
              Upcoming deadlines (next 3 days): <strong>{academicStress.upcomingDeadlines}</strong> · Pending tasks:{' '}
              <strong>{academicStress.pendingTasks}</strong>
            </p>
          </div>
        )}

        {/* 5. Daily Wellness Plan */}
        <div className="card" style={{ marginTop: '1rem' }}>
          <h3 style={{ marginBottom: '0.5rem' }}>Your Wellness Plan Today</h3>
          {dailyPlan?.plan?.length > 0 ? (
            <ul style={{ margin: 0, paddingLeft: '1.25rem', lineHeight: 1.8 }}>
              {dailyPlan.plan.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          ) : (
            <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>
              Your personalized plan will appear here based on your mood and study planner.
            </p>
          )}
        </div>

        {/* 6. Relaxation Insights */}
        <div className="card" style={{ marginTop: '1rem' }}>
          <h3 style={{ marginBottom: '0.5rem' }}>Relaxation Insights</h3>
          {relaxationInsights?.insights?.length > 0 ? (
            <ul style={{ margin: 0, paddingLeft: '1.25rem', lineHeight: 1.7 }}>
              {relaxationInsights.insights.map((insight, i) => (
                <li key={i}>{insight}</li>
              ))}
            </ul>
          ) : (
            <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>
              Log your mood before and after relaxation activities to see personalized insights.
            </p>
          )}
        </div>

        {/* 7. Mood Calendar access */}
        <div className="card" style={{ marginTop: '1rem' }}>
          <h3 style={{ marginBottom: '0.5rem' }}>Mood Calendar</h3>
          <p style={{ margin: 0, color: 'var(--color-text-muted)', marginBottom: '0.75rem', fontSize: '0.95rem' }}>
            View your emotional history and track mood trends over time.
          </p>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => navigate('/mood-calendar')}
          >
            Open Mood Calendar
          </button>
        </div>
      </section>

      {/* 4. Weekly Wellness Report */}
      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ marginBottom: '1rem' }}>Your Weekly Wellness Report</h2>
        {weeklyReport ? (
          <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Average mood this week</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{weeklyReport.averageMoodScore ?? '—'}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Most stressful day</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{weeklyReport.mostStressfulDay ?? '—'}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Productivity</div>
                <div style={{ fontSize: '0.95rem' }}>
                  {weeklyReport.completedTasks} completed · {weeklyReport.pendingTasks} pending
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Relaxation activities</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{weeklyReport.relaxationActivitiesUsed ?? 0}</div>
              </div>
            </div>
            {weeklyReport.insights && weeklyReport.insights.length > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                <h4 style={{ marginBottom: '0.5rem', fontSize: '0.95rem' }}>Insights</h4>
                <ul style={{ margin: 0, paddingLeft: '1.25rem', lineHeight: 1.7, color: 'var(--color-text)' }}>
                  {weeklyReport.insights.map((insight, i) => (
                    <li key={i}>{insight}</li>
                  ))}
                </ul>
              </div>
            )}
            {weeklyReport.moodTrendByDay && weeklyReport.moodTrendByDay.some((d) => d.avgScore != null) && (
              <div>
                <h4 style={{ marginBottom: '0.75rem', fontSize: '0.95rem' }}>Mood trend by day</h4>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={weeklyReport.moodTrendByDay}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 25]} />
                    <Tooltip />
                    <Bar dataKey="avgScore" fill="#1e4d6b" name="Avg mood score" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        ) : (
          <div className="card">
            <p style={{ margin: 0, color: 'var(--color-text-muted)' }}>
              Complete mood assessments and use relaxation activities to see your weekly report.
            </p>
          </div>
        )}
      </section>

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
