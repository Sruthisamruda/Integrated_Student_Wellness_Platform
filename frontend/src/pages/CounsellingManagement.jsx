import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiRequest } from '../api';

const modeOptions = ['Online', 'Offline'];

export default function CounsellingManagement() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const initialStudentId = useMemo(() => searchParams.get('studentId') || '', [searchParams]);
  const [selectedStudentId, setSelectedStudentId] = useState(initialStudentId);

  const selectedStudent = useMemo(
    () => students.find((s) => String(s.userId) === String(selectedStudentId)) || null,
    [students, selectedStudentId],
  );

  // Form
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [mode, setMode] = useState('Online');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

  useEffect(() => {
    const fetchStudents = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await apiRequest('/admin/students-stress').catch(() => ({ students: [] }));
        setStudents(data?.students || []);
      } catch (err) {
        setError(err.message || 'Failed to load students stress overview');
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, []);

  // If query param studentId exists, keep it selected; otherwise select first student.
  useEffect(() => {
    if (!students || students.length === 0) return;
    if (selectedStudentId) return;
    setSelectedStudentId(String(students[0].userId));
  }, [students, selectedStudentId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitMessage('');

    if (!selectedStudentId) {
      setSubmitMessage('Please select a student.');
      return;
    }
    if (!date) {
      setSubmitMessage('Please select a date.');
      return;
    }
    if (!time) {
      setSubmitMessage('Please select a time.');
      return;
    }
    if (!modeOptions.includes(mode)) {
      setSubmitMessage('Please choose a valid mode.');
      return;
    }

    setSubmitting(true);
    try {
      await apiRequest('/admin/counselling', {
        method: 'POST',
        body: JSON.stringify({
          userId: selectedStudentId,
          date,
          time,
          mode,
          notes,
        }),
      });

      setSubmitMessage('Counselling session scheduled successfully.');
      setNotes('');

      // Optional: redirect to dashboard analytics after booking.
      // navigate('/dashboard');
    } catch (err) {
      setSubmitMessage(err.message || 'Failed to schedule counselling session');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="card">
        <div className="loading-spinner" aria-hidden />
        <p style={{ margin: '0.75rem 0 0', color: 'var(--color-text-muted)' }}>Loading counselling management...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <h2 style={{ marginBottom: '0.5rem' }}>Counselling Management</h2>
        <div className="message-error" role="alert">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard" style={{ display: 'grid', gap: '1rem' }}>
      <div>
        <h1 style={{ marginBottom: '0.5rem' }}>Counselling Management</h1>
        <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>
          Select a student and schedule a counselling session.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
        <div className="card" style={{ padding: '1rem' }}>
          <h3 style={{ marginBottom: '0.75rem' }}>Student Selection</h3>
          <div style={{ marginBottom: '0.75rem' }}>
            <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '0.4rem' }}>
              Choose student
            </label>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                style={{ width: '100%' }}
              >
                {students.map((s) => (
                  <option key={s.userId} value={s.userId}>
                    {s.name} ({s.stressLevel})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedStudent ? (
            <div style={{ display: 'grid', gap: '0.5rem', fontSize: '0.95rem' }}>
              <div>
                <strong>Name:</strong> {selectedStudent.name}
              </div>
              <div>
                <strong>Current stress:</strong> {selectedStudent.stressLevel}
              </div>
              <div>
                <strong>Recent mood:</strong> {selectedStudent.recentMood}
              </div>
              <div>
                <strong>Pending tasks:</strong> {selectedStudent.pendingTasks}
              </div>
              <div>
                <strong>Overdue tasks:</strong> {selectedStudent.overdueTasks}
              </div>
            </div>
          ) : (
            <p style={{ margin: 0, color: 'var(--color-text-muted)' }}>Select a student to view details.</p>
          )}
        </div>

        <div className="card" style={{ padding: '1rem' }}>
          <h3 style={{ marginBottom: '0.75rem' }}>Schedule Session</h3>

          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '0.75rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Time</label>
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Mode</label>
              <select value={mode} onChange={(e) => setMode(e.target.value)} style={{ width: '100%' }}>
                {modeOptions.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Notes (optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder="Add any relevant details..."
              />
            </div>

            {submitMessage ? (
              <div className="message-success" style={{ color: 'var(--color-text-muted)' }}>
                {submitMessage}
              </div>
            ) : null}

            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Scheduling...' : 'Submit Booking'}
            </button>
            <button type="button" className="btn btn-outline" onClick={() => navigate('/dashboard')}>
              Back to Dashboard
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

