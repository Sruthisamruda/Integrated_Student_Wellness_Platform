/**
 * Profile page: show current user email/name.
 */

import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div>
      <h1>Profile</h1>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem', fontSize: '1.05rem' }}>
        Your account details.
      </p>
      <div className="card" style={{ maxWidth: '420px' }}>
        <div className="form-group">
          <label>Email</label>
          <p style={{ margin: 0, padding: '0.5rem 0', color: 'var(--color-text)', fontSize: '1rem' }}>
            {user.email}
          </p>
        </div>
        <div className="form-group">
          <label>Name</label>
          <p style={{ margin: 0, padding: '0.5rem 0', color: 'var(--color-text)', fontSize: '1rem' }}>
            {user.name || '—'}
          </p>
        </div>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginTop: '0.5rem', marginBottom: 0 }}>
          Account details are managed here. Password change can be added in a future update.
        </p>
      </div>
    </div>
  );
}
