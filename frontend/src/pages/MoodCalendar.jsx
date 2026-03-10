/**
 * Mood Calendar: view emotional history with color-coded days.
 * Click a date to see mood score, workload, relaxation activities.
 */

import { useState, useEffect } from 'react';
import { apiRequest } from '../api';

const MOOD_COLORS = {
  'Happy / Balanced': '#22c55e',
  Calm: '#3b82f6',
  'Mild Stress': '#eab308',
  Anxious: '#f97316',
  'Highly Stressed': '#ef4444',
  Stressed: '#f97316',
};

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function MoodCalendar() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [data, setData] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiRequest(`/mood/calendar?year=${year}&month=${month}`)
      .then((d) => setData(d || null))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [year, month]);

  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const dayMap = (data?.calendarDays || []).reduce((acc, d) => {
    acc[d.date] = d;
    return acc;
  }, {});

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push({ empty: true });
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    cells.push({ date: dateStr, day: d, ...(dayMap[dateStr] || {}) });
  }
  while (cells.length % 7 !== 0) cells.push({ empty: true });

  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }

  const prevMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
    setSelectedDay(null);
  };

  const nextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
    setSelectedDay(null);
  };

  if (loading) {
    return (
      <div className="loading-wrap">
        <div className="loading-spinner" aria-hidden />
        <p>Loading calendar...</p>
      </div>
    );
  }

  return (
    <div>
      <h1>Mood Calendar</h1>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.75rem', fontSize: '1.05rem' }}>
        View your emotional history. Click a date to see details.
      </p>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h2 style={{ margin: 0 }}>{MONTHS[month - 1]} {year}</h2>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="button" className="btn btn-outline" onClick={prevMonth}>Prev</button>
            <button type="button" className="btn btn-outline" onClick={nextMonth}>Next</button>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 280 }}>
            <thead>
              <tr>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                  <th key={d} style={{ padding: '0.5rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{d}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {weeks.map((row, wi) => (
                <tr key={wi}>
                  {row.map((cell, ci) => (
                    <td key={ci} style={{ padding: '0.25rem', verticalAlign: 'top' }}>
                      {cell?.empty ? (
                        <div style={{ width: 36, height: 36 }} />
                      ) : cell?.date ? (
                        <button
                          type="button"
                          onClick={() => setSelectedDay(cell)}
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: '50%',
                            border: selectedDay?.date === cell.date ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                            background: cell.color || 'var(--color-surface)',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            fontWeight: 500,
                            color: cell.color ? '#fff' : 'var(--color-text)',
                          }}
                        >
                          {cell.day}
                        </button>
                      ) : null}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '1rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
          {Object.entries(MOOD_COLORS).map(([label, color]) => (
            <span key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ width: 12, height: 12, borderRadius: 2, background: color }} />
              {label}
            </span>
          ))}
        </div>
      </div>

      {selectedDay && selectedDay.date && (
        <div className="card">
          <h3 style={{ marginBottom: '0.75rem' }}>{selectedDay.date}</h3>
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            {selectedDay.moodCategory ? (
              <>
                <p style={{ margin: 0 }}>
                  <strong>Mood:</strong> {selectedDay.moodCategory}
                  {selectedDay.moodScore != null && ` (Score: ${selectedDay.moodScore})`}
                </p>
                <p style={{ margin: 0 }}>
                  <strong>Tasks due:</strong> {selectedDay.dueTasks ?? 0} · Pending: {selectedDay.pendingTasks ?? 0}
                </p>
                <p style={{ margin: 0 }}>
                  <strong>Relaxation activities:</strong> {selectedDay.relaxationCount ?? 0}
                </p>
              </>
            ) : (
              <p style={{ margin: 0, color: 'var(--color-text-muted)' }}>No mood entry for this day.</p>
            )}
          </div>
        </div>
      )}

      {data?.insights && data.insights.length > 0 && (
        <div className="card" style={{ marginTop: '1rem' }}>
          <h3 style={{ marginBottom: '0.5rem' }}>Insights</h3>
          <ul style={{ margin: 0, paddingLeft: '1.25rem', lineHeight: 1.7 }}>
            {data.insights.map((insight, i) => (
              <li key={i}>{insight}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
