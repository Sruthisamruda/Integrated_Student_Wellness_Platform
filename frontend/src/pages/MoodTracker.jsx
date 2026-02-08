/**
 * Mood Tracker: MoodPicker to log today's mood, list of recent mood entries with optional note/date.
 */

import { useState, useEffect } from 'react';
import { apiRequest } from '../api';
import MoodPicker from '../components/MoodPicker';
import ActivitySuggestions from '../components/ActivitySuggestions';

const MOOD_EMOJI = { happy: '😊', calm: '😌', neutral: '😐', tired: '😴', anxious: '😟', sad: '😢', energetic: '⚡' };

export default function MoodTracker() {
  const [moods, setMoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedMood, setSelectedMood] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showSuggestionsFor, setShowSuggestionsFor] = useState(null);

  const fetchMoods = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiRequest('/mood');
      setMoods(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load moods');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMoods();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMood) {
      setError('Please select a mood');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await apiRequest('/mood', {
        method: 'POST',
        body: JSON.stringify({ mood: selectedMood, note: note.trim() }),
      });
      setShowSuggestionsFor(selectedMood);
      setSelectedMood('');
      setNote('');
      fetchMoods();
    } catch (err) {
      setError(err.message || 'Failed to save mood');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await apiRequest(`/mood/${id}`, { method: 'DELETE' });
      setMoods((prev) => prev.filter((m) => m._id !== id));
    } catch (err) {
      setError(err.message || 'Failed to delete');
    }
  };

  return (
    <div>
      <h1>Mood Tracker</h1>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.75rem', fontSize: '1.05rem' }}>
        How are you feeling today? Select a mood and add an optional note.
      </p>

      {error && <div className="message-error" role="alert">{error}</div>}

      <div className="card" style={{ marginBottom: '2rem' }}>
        <h2 style={{ marginBottom: '1.25rem' }}>Log your mood</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Mood</label>
            <MoodPicker value={selectedMood} onChange={setSelectedMood} />
          </div>
          <div className="form-group">
            <label htmlFor="mood-note">Note (optional)</label>
            <textarea
              id="mood-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What's on your mind?"
              maxLength={500}
              disabled={submitting}
            />
          </div>
          <button type="submit" className="btn btn-accent" disabled={submitting || !selectedMood}>
            {submitting ? <span className="loading-spinner" aria-hidden /> : null}
            {submitting ? ' Saving...' : 'Save mood'}
          </button>
        </form>
      </div>

      <ActivitySuggestions mood={showSuggestionsFor} />

      <h2 style={{ marginBottom: '1rem' }}>Recent moods</h2>
      {loading ? (
        <div className="loading-wrap">
          <div className="loading-spinner" aria-hidden />
          <p>Loading...</p>
        </div>
      ) : moods.length === 0 ? (
        <p style={{ color: 'var(--color-text-muted)' }}>No mood entries yet. Log one above.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {moods.slice(0, 14).map((m) => (
            <li
              key={m._id}
              className="card"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.75rem',
              }}
            >
              <span style={{ fontSize: '1.5rem' }}>{MOOD_EMOJI[m.mood] || '•'}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <strong style={{ textTransform: 'capitalize' }}>{m.mood}</strong>
                {m.note && (
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.9375rem', color: 'var(--color-text-muted)' }}>
                    {m.note}
                  </p>
                )}
                <small style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                  {new Date(m.date).toLocaleDateString()}
                </small>
              </div>
              <button type="button" className="btn btn-outline" onClick={() => handleDelete(m._id)}>
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
