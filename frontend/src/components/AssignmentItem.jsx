/**
 * Single assignment row: title, due date, priority, completed toggle, edit/delete actions.
 */

import { useState } from 'react';

const PRIORITY_LABELS = { low: 'Low', medium: 'Medium', high: 'High' };
const PRIORITY_COLOR = { low: 'var(--color-text-muted)', medium: 'var(--color-primary)', high: 'var(--color-error)' };

export default function AssignmentItem({ assignment, onToggle, onEdit, onDelete, loading }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const due = new Date(assignment.dueDate);
  const isOverdue = !assignment.completed && due < new Date();

  const handleDelete = () => {
    if (confirmDelete) {
      onDelete(assignment._id);
      setConfirmDelete(false);
    } else {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
    }
  };

  return (
    <div
      className="card"
      style={{
        display: 'grid',
        gridTemplateColumns: 'auto 1fr auto auto',
        alignItems: 'center',
        gap: '0.75rem',
        opacity: assignment.completed ? 0.85 : 1,
      }}
    >
      <input
        type="checkbox"
        checked={assignment.completed}
        onChange={() => onToggle(assignment._id, !assignment.completed)}
        disabled={loading}
        aria-label="Mark complete"
      />
      <div style={{ minWidth: 0 }}>
        <strong style={{ textDecoration: assignment.completed ? 'line-through' : 'none', color: 'var(--color-text)' }}>
          {assignment.title}
        </strong>
        {assignment.description && (
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
            {assignment.description}
          </p>
        )}
        <div style={{ fontSize: '0.875rem', color: isOverdue ? 'var(--color-error)' : 'var(--color-text-muted)', marginTop: '0.25rem' }}>
          Due: {due.toLocaleDateString()} {isOverdue && '(overdue)'}
          <span style={{ marginLeft: '0.5rem', color: PRIORITY_COLOR[assignment.priority] }}>
            {PRIORITY_LABELS[assignment.priority]}
          </span>
        </div>
      </div>
      {onEdit && (
        <button type="button" className="btn btn-outline" onClick={() => onEdit(assignment)} disabled={loading}>
          Edit
        </button>
      )}
      <button
        type="button"
        className={confirmDelete ? 'btn btn-danger' : 'btn btn-outline'}
        onClick={handleDelete}
        disabled={loading}
      >
        {confirmDelete ? 'Confirm delete?' : 'Delete'}
      </button>
    </div>
  );
}
