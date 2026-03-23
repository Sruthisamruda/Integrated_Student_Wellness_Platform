import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiRequest } from '../api';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import DoodleMoodLogging from '../components/DoodleMoodLogging';

const SCORE_LABELS = [
  { score: 1, text: 'Never' },
  { score: 2, text: 'Rarely' },
  { score: 3, text: 'Sometimes' },
  { score: 4, text: 'Often' },
  { score: 5, text: 'Always' },
];

export default function MoodAssessment() {
  const [activeTab, setActiveTab] = useState('assessment'); // assessment | doodle
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  const answeredCount = useMemo(() => Object.keys(answers).length, [answers]);

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiRequest('/mood/questions?limit=5');
      setQuestions(Array.isArray(data) ? data : []);
      setAnswers({});
      setResult(null);
    } catch (err) {
      setError(err.message || 'Failed to load questions');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const data = await apiRequest('/mood/history?limit=30');
      setHistory(Array.isArray(data) ? data : []);
    } catch {
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQuestions();
    fetchHistory();
  }, [fetchQuestions, fetchHistory]);

  const setAnswer = (questionId, score) => {
    setAnswers((prev) => ({ ...prev, [questionId]: score }));
  };

  const handleSubmit = useCallback(async () => {
    setSubmitting(true);
    setError('');
    try {
      const payload = {
        answers: questions.map((q) => ({
          questionId: q._id,
          score: Number(answers[q._id]),
        })),
      };
      const data = await apiRequest('/mood/submit', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setResult(data);
      fetchHistory();
    } catch (err) {
      setError(err.message || 'Failed to submit assessment');
    } finally {
      setSubmitting(false);
    }
  }, [answers, fetchHistory, questions]);

  const showDoodleTab = activeTab === 'doodle';

  if (showDoodleTab) {
    return (
      <div>
        <h1>Mood Tracker</h1>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.75rem', fontSize: '1.05rem' }}>
          Express how you feel with either the questionnaire (primary) or doodling (optional).
        </p>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
          <button type="button" className={activeTab === 'assessment' ? 'btn btn-primary' : 'btn btn-outline'} onClick={() => setActiveTab('assessment')}>
            Take Mood Assessment
          </button>
          <button type="button" className={activeTab === 'doodle' ? 'btn btn-primary' : 'btn btn-outline'} onClick={() => setActiveTab('doodle')}>
            Express Your Mood (Doodle)
          </button>
        </div>

        <DoodleMoodLogging />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="loading-wrap">
        <div className="loading-spinner" aria-hidden />
        <p>Loading mood assessment...</p>
      </div>
    );
  }

  return (
    <div>
      <h1>Mood Tracker</h1>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.75rem', fontSize: '1.05rem' }}>
        Answer 5 short questions (primary). Optionally, use doodling for quick expression.
      </p>

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
        <button type="button" className={activeTab === 'assessment' ? 'btn btn-primary' : 'btn btn-outline'} onClick={() => setActiveTab('assessment')}>
          Take Mood Assessment
        </button>
        <button type="button" className={activeTab === 'doodle' ? 'btn btn-primary' : 'btn btn-outline'} onClick={() => setActiveTab('doodle')}>
          Express Your Mood (Doodle)
        </button>
      </div>

      {error && <div className="message-error" role="alert">{error}</div>}

      {!result ? (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
            {questions.map((q, idx) => (
              <div key={q._id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', marginBottom: '0.5rem' }}>
                  <strong style={{ fontSize: '0.95rem' }}>Question {idx + 1}</strong>
                  <span style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>{q.category}</span>
                </div>
                <p style={{ marginTop: 0, marginBottom: '0.75rem', lineHeight: 1.55 }}>{q.question}</p>

                <div style={{ display: 'grid', gap: '0.5rem' }}>
                  {SCORE_LABELS.map((opt) => (
                    <label
                      key={opt.score}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.6rem',
                        padding: '0.6rem 0.75rem',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius)',
                        background: answers[q._id] === opt.score ? 'var(--color-primary-soft)' : 'white',
                        cursor: 'pointer',
                        transition: 'all var(--transition)',
                      }}
                    >
                      <input
                        type="radio"
                        name={`q-${q._id}`}
                        value={opt.score}
                        checked={answers[q._id] === opt.score}
                        onChange={() => setAnswer(q._id, opt.score)}
                      />
                      <span style={{ fontWeight: 500 }}>{opt.text}</span>
                      <span style={{ marginLeft: 'auto', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                        {opt.score}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '1.25rem' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={submitting || answeredCount !== 5}
            >
              {submitting ? <span className="loading-spinner" aria-hidden /> : null}
              {submitting ? ' Calculating...' : 'Submit assessment'}
            </button>
            <button type="button" className="btn btn-outline" onClick={fetchQuestions} disabled={submitting}>
              Get new questions
            </button>
            <span style={{ color: 'var(--color-text-muted)', alignSelf: 'center' }}>
              Answered: {answeredCount}/5
            </span>
          </div>
        </>
      ) : (
        <>
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ marginTop: 0, marginBottom: '0.75rem' }}>Your result</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              <div>
                <div style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Mood detected</div>
                <div style={{ fontSize: '1.35rem', fontWeight: 700, marginTop: '0.25rem' }}>{result.moodLevel}</div>
                <div style={{ marginTop: '0.5rem', color: 'var(--color-text-muted)' }}>
                  Final score: <strong>{result.finalScoreClamped}</strong>
                </div>
              </div>
              <div>
                <div style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Score breakdown</div>
                <div style={{ marginTop: '0.5rem', display: 'grid', gap: '0.35rem' }}>
                  <div>Questionnaire: <strong>{result.questionnaireScore}</strong></div>
                  <div>Study stress modifier: <strong>{result.stressModifier}</strong></div>
                  <div style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                    Pending: {result.studyPlanner?.pendingTasks ?? 0} · Overdue: {result.studyPlanner?.overdueTasks ?? 0} · Completed: {result.studyPlanner?.completedTasks ?? 0}
                  </div>
                </div>
              </div>
              <div>
                <div style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Motivation</div>
                <p style={{ margin: '0.5rem 0 0', lineHeight: 1.6 }}>{result.motivationalMessage}</p>
              </div>
            </div>
          </div>

          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ marginTop: 0, marginBottom: '0.75rem' }}>Suggested wellness activities</h2>
            <ul style={{ margin: 0, paddingLeft: '1.2rem', display: 'grid', gap: '0.35rem' }}>
              {(result.suggestedActivities || []).map((a) => (
                <li key={a} style={{ lineHeight: 1.5 }}>{a}</li>
              ))}
            </ul>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
            <button type="button" className="btn btn-primary" onClick={fetchQuestions}>
              Take again
            </button>
            <button type="button" className="btn btn-outline" onClick={() => setResult(null)}>
              Back to questions
            </button>
          </div>
        </>
      )}

      <div style={{ marginTop: '2rem' }}>
        <h2 style={{ marginBottom: '0.75rem' }}>Mood trends (assessments)</h2>
        <p style={{ color: 'var(--color-text-muted)', marginTop: 0, marginBottom: '1rem' }}>
          Track your assessment scores over time.
        </p>

        {historyLoading ? (
          <div className="loading-wrap">
            <div className="loading-spinner" aria-hidden />
            <p>Loading trend...</p>
          </div>
        ) : history.length < 2 ? (
          <div className="card">
            <p style={{ margin: 0, color: 'var(--color-text-muted)' }}>
              Take a few assessments to see a trend chart here.
            </p>
          </div>
        ) : (
          <div className="card" style={{ padding: '1rem' }}>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={history}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis domain={[5, 25]} />
                <Tooltip />
                <Line type="monotone" dataKey="finalScoreClamped" stroke="#1e4d6b" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}

