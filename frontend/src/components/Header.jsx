/**
 * Top navigation: app title and user menu (profile, logout).
 * Mobile: hamburger toggles sidebar (handled by Sidebar).
 */

import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';

export default function Header() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header
      style={{
        height: 'var(--header-height)',
        background: 'var(--color-surface)',
        boxShadow: 'var(--shadow)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 1rem',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      <Link to="/dashboard" style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 600, fontSize: '1.1rem' }}>
        Student Wellness
      </Link>

      {user && (
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => setMenuOpen((o) => !o)}
            aria-expanded={menuOpen}
            aria-haspopup="true"
          >
            {user.name || user.email}
          </button>
          {menuOpen && (
            <>
              <div
                role="presentation"
                style={{ position: 'fixed', inset: 0, zIndex: 99 }}
                onClick={() => setMenuOpen(false)}
              />
              <nav
                role="menu"
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '100%',
                  marginTop: '0.25rem',
                  background: 'var(--color-surface)',
                  borderRadius: 'var(--radius)',
                  boxShadow: 'var(--shadow)',
                  padding: '0.5rem',
                  minWidth: '160px',
                  zIndex: 100,
                }}
              >
                <Link
                  to="/profile"
                  role="menuitem"
                  style={{ display: 'block', padding: '0.5rem 0.75rem', color: 'var(--color-text)', textDecoration: 'none', borderRadius: 'var(--radius)' }}
                  onClick={() => setMenuOpen(false)}
                >
                  Profile
                </Link>
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ width: '100%', justifyContent: 'flex-start', marginTop: '0.25rem' }}
                  onClick={() => { logout(); setMenuOpen(false); }}
                >
                  Log out
                </button>
              </nav>
            </>
          )}
        </div>
      )}
    </header>
  );
}
