/**
 * Side navigation: links to Dashboard, Mood, Study, Relaxation, Profile.
 * Clean nav with icons and refined active/hover states.
 */

import { NavLink } from 'react-router-dom';
import { useState } from 'react';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/mood', label: 'Mood Tracker', icon: '😊' },
  { to: '/mood-assessment', label: 'Mood Assessment', icon: '📝' },
  { to: '/mood-calendar', label: 'Mood Calendar', icon: '📅' },
  { to: '/study', label: 'Study Planner', icon: '📚' },
  { to: '/relax', label: 'Relaxation', icon: '🧘' },
  { to: '/forum', label: 'Forum', icon: '💬' },
  { to: '/profile', label: 'Profile', icon: '👤' },
];

export default function Sidebar() {
  const [open, setOpen] = useState(false);

  const linkStyle = ({ isActive }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem 1rem',
    color: isActive ? 'var(--color-primary)' : 'var(--color-text)',
    textDecoration: 'none',
    fontWeight: isActive ? 600 : 500,
    background: isActive ? 'var(--color-primary-soft)' : 'transparent',
    borderRadius: 'var(--radius)',
    marginBottom: '0.25rem',
    fontSize: '0.9375rem',
    transition: 'all var(--transition)',
  });

  return (
    <>
      {/* Mobile toggle */}
      <button
        type="button"
        className="btn btn-primary"
        aria-label="Toggle menu"
        onClick={() => setOpen((o) => !o)}
        style={{
          position: 'fixed',
          bottom: '1.25rem',
          left: '1.25rem',
          zIndex: 101,
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          padding: 0,
          boxShadow: 'var(--shadow)',
        }}
      >
        {open ? '✕' : '☰'}
      </button>

      <aside
        className="sidebar"
        style={{
          width: 'var(--sidebar-width)',
          minWidth: 'var(--sidebar-width)',
          background: 'linear-gradient(180deg, var(--color-surface) 0%, #fafcfd 100%)',
          borderRight: '1px solid var(--color-border)',
          padding: '1.25rem 1rem',
          display: open ? 'block' : 'none',
          position: 'fixed',
          left: 0,
          top: 'var(--header-height)',
          bottom: 0,
          zIndex: 100,
          overflowY: 'auto',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <nav>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              style={linkStyle}
              onClick={() => setOpen(false)}
            >
              <span style={{ fontSize: '1.25rem' }}>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <style>{`
        @media (min-width: 768px) {
          .sidebar { display: block !important; position: static !important; box-shadow: none; }
          button[aria-label="Toggle menu"] { display: none !important; }
        }
        @media (max-width: 767px) {
          .main-content { margin-left: 0 !important; }
        }
      `}</style>
    </>
  );
}
