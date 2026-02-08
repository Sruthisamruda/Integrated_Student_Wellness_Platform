/**
 * Top navigation: app title and user menu (profile, logout).
 * Clean header with subtle gradient and refined styling.
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
        background: 'linear-gradient(135deg, var(--color-surface) 0%, #fafcfd 100%)',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 1.5rem',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        borderBottom: '1px solid var(--color-border)',
      }}
    >
      <Link
        to="/dashboard"
        className="header-logo"
        style={{
          color: 'var(--color-primary)',
          textDecoration: 'none',
          fontWeight: 700,
          fontSize: '1.25rem',
          letterSpacing: '-0.02em',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}
      >
        <span style={{ fontSize: '1.5rem' }}>🌱</span>
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
            style={{
              padding: '0.5rem 1rem',
              fontSize: '0.9375rem',
              maxWidth: '180px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
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
                  marginTop: '0.5rem',
                  background: 'var(--color-surface)',
                  borderRadius: 'var(--radius)',
                  boxShadow: 'var(--shadow-md)',
                  padding: '0.5rem',
                  minWidth: '180px',
                  zIndex: 100,
                  border: '1px solid var(--color-border)',
                }}
              >
                <Link
                  to="/profile"
                  role="menuitem"
                  style={{
                    display: 'block',
                    padding: '0.6rem 1rem',
                    color: 'var(--color-text)',
                    textDecoration: 'none',
                    borderRadius: 'var(--radius)',
                    fontSize: '0.9375rem',
                    transition: 'background var(--transition)',
                  }}
                  className="dropdown-link"
                  onClick={() => setMenuOpen(false)}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-primary-soft)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  Profile
                </Link>
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ width: '100%', justifyContent: 'flex-start', marginTop: '0.25rem', padding: '0.6rem 1rem' }}
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
