/**
 * Study Planner: list assignments, add new, edit, delete, toggle completed.
 */

import { useState, useEffect } from 'react';
import { apiRequest } from '../api';
import AssignmentItem from '../components/AssignmentItem';

export default function StudyPlanner() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formDue, setFormDue] = useState('');
  const [formPriority, setFormPriority] = useState('medium');
  const [submitting, setSubmitting] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchAssignments = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiRequest('/assignments');
      setAssignments(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  const resetForm = () => {
    setFormTitle('');
    setFormDesc('');
    setFormDue('');
    setFormPriority('medium');
    setEditing(null);
    setShowForm(false);
  };

  const openEdit = (a) => {
    setEditing(a);
    setFormTitle(a.title);
    setFormDesc(a.description || '');
    setFormDue(a.dueDate ? new Date(a.dueDate).toISOString().slice(0, 16) : '');
    setFormPriority(a.priority || 'medium');
    setShowForm(true);
  };

  const validateForm = () => {
    if (!formTitle.trim()) {
      setError('Title is required');
      return false;
    }
    if (!formDue) {
      setError('Due date is required');
      return false;
    }
    setError('');
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSubmitting(true);
    setError('');
    try {
      const payload = {
        title: formTitle.trim(),
        description: formDesc.trim(),
        dueDate: new Date(formDue).toISOString(),
        priority: formPriority,
      };
      if (editing) {
        await apiRequest(`/assignments/${editing._id}`, { method: 'PUT', body: JSON.stringify(payload) });
      } else {
        await apiRequest('/assignments', { method: 'POST', body: JSON.stringify(payload) });
      }
      resetForm();
      fetchAssignments();
    } catch (err) {
      setError(err.message || 'Failed to save assignment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (id, completed) => {
    setActionLoading(id);
    try {
      await apiRequest(`/assignments/${id}`, { method: 'PUT', body: JSON.stringify({ completed }) });
      setAssignments((prev) => prev.map((a) => (a._id === id ? { ...a, completed } : a)));
    } catch (err) {
      setError(err.message || 'Failed to update');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id) => {
    setActionLoading(id);
    try {
      await apiRequest(`/assignments/${id}`, { method: 'DELETE' });
      setAssignments((prev) => prev.filter((a) => a._id !== id));
    } catch (err) {
      setError(err.message || 'Failed to delete');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div>
      <h1>Study Planner</h1>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem', fontSize: '1.05rem' }}>
        Add assignments and due dates. Mark them complete when done.
      </p>

      {error && <div className="message-error" role="alert">{error}</div>}

      {!showForm ? (
        <button type="button" className="btn btn-primary" onClick={() => setShowForm(true)} style={{ marginBottom: '1.5rem' }}>
          Add assignment
        </button>
      ) : (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ marginBottom: '1.25rem' }}>{editing ? 'Edit assignment' : 'New assignment'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="assign-title">Title *</label>
              <input
                id="assign-title"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="e.g. Math homework Ch.5"
                disabled={submitting}
                maxLength={200}
              />
            </div>
            <div className="form-group">
              <label htmlFor="assign-desc">Description (optional)</label>
              <textarea
                id="assign-desc"
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                placeholder="Details..."
                disabled={submitting}
                maxLength={1000}
              />
            </div>
            <div className="form-group">
              <label htmlFor="assign-due">Due date *</label>
              <input
                id="assign-due"
                type="datetime-local"
                value={formDue}
                onChange={(e) => setFormDue(e.target.value)}
                disabled={submitting}
              />
            </div>
            <div className="form-group">
              <label htmlFor="assign-priority">Priority</label>
              <select id="assign-priority" value={formPriority} onChange={(e) => setFormPriority(e.target.value)} disabled={submitting}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button type="submit" className="btn btn-accent" disabled={submitting}>
                {submitting ? <span className="loading-spinner" aria-hidden /> : null}
                {submitting ? ' Saving...' : editing ? 'Update' : 'Add'}
              </button>
              <button type="button" className="btn btn-outline" onClick={resetForm} disabled={submitting}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <h2 style={{ marginBottom: '1rem' }}>Assignments</h2>
      {loading ? (
        <div className="loading-wrap">
          <div className="loading-spinner" aria-hidden />
          <p>Loading...</p>
        </div>
      ) : assignments.length === 0 ? (
        <p style={{ color: 'var(--color-text-muted)' }}>No assignments yet. Add one above.</p>
      ) : (
        assignments.map((a) => (
          <AssignmentItem
            key={a._id}
            assignment={a}
            onToggle={handleToggle}
            onEdit={openEdit}
            onDelete={handleDelete}
            loading={actionLoading === a._id}
          />
        ))
      )}
    </div>
  );
}
