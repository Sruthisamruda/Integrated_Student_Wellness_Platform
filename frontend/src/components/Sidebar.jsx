/**
 * Side navigation: links to Dashboard, Mood, Study, Relaxation.
 * On mobile, can be toggled open/closed via a hamburger (optional; here we show always for simplicity).
 * Uses NavLink for active styling.
 */

import { NavLink } from 'react-router-dom';
import { useState } from 'react';

const navItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/mood', label: 'Mood Tracker' },
  { to: '/study', label: 'Study Planner' },
  { to: '/relax', label: 'Relaxation' },
  { to: '/profile', label: 'Profile' },
];

export default function Sidebar() {
  const [open, setOpen] = useState(false);

  const linkStyle = ({ isActive }) => ({
    display: 'block',
    padding: '0.6rem 1rem',
    color: isActive ? 'var(--color-primary)' : 'var(--color-text)',
    textDecoration: 'none',
    fontWeight: isActive ? 600 : 400,
    background: isActive ? 'rgba(45, 90, 123, 0.08)' : 'transparent',
    borderRadius: 'var(--radius)',
    marginBottom: '0.25rem',
  });

  return (
    <>
      {/* Mobile toggle */}
      <button
        type="button"
        className="btn btn-outline"
        aria-label="Toggle menu"
        onClick={() => setOpen((o) => !o)}
        style={{
          position: 'fixed',
          bottom: '1rem',
          left: '1rem',
          zIndex: 101,
          display: 'block',
        }}
      >
        {open ? '✕' : '☰'}
      </button>

      <aside
        className="sidebar"
        style={{
          width: 'var(--sidebar-width)',
          minWidth: 'var(--sidebar-width)',
          background: 'var(--color-surface)',
          borderRight: '1px solid var(--color-border)',
          padding: '1rem 0.75rem',
          display: open ? 'block' : 'none',
          position: 'fixed',
          left: 0,
          top: 'var(--header-height)',
          bottom: 0,
          zIndex: 100,
          overflowY: 'auto',
        }}
      >
        <nav>
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} style={linkStyle} onClick={() => setOpen(false)}>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Desktop: sidebar in flow; mobile: toggle visibility */}
      <style>{`
        @media (min-width: 768px) {
          .sidebar { display: block !important; position: static !important; }
          button[aria-label="Toggle menu"] { display: none !important; }
        }
        @media (max-width: 767px) {
          .main-content { margin-left: 0 !important; }
        }
      `}</style>
    </>
  );
}
