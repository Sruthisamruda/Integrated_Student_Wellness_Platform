/**
 * Sidebar — professional icon-based navigation using lucide-react + Tailwind.
 */

import { NavLink } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  ClipboardList,
  CalendarDays,
  BookOpen,
  HeartPulse,
  MessageSquare,
  User,
  Stethoscope,
  Menu,
  X,
} from 'lucide-react';

const NAV_ITEMS = [
  { to: '/dashboard',      label: 'Dashboard',       icon: LayoutDashboard },
  { to: '/mood-assessment', label: 'Mood Assessment', icon: ClipboardList },
  { to: '/mood-calendar',  label: 'Mood Calendar',   icon: CalendarDays },
  { to: '/study',          label: 'Study Planner',   icon: BookOpen },
  { to: '/relax',          label: 'Relaxation',      icon: HeartPulse },
  { to: '/forum',          label: 'Forum',            icon: MessageSquare },
  { to: '/profile',        label: 'Profile',          icon: User },
  { to: '/admin/counselling', label: 'Counselling',  icon: Stethoscope, adminOnly: true },
];

export default function Sidebar() {
  const [open, setOpen] = useState(false);
  const { isAdmin } = useAuth();

  const items = NAV_ITEMS.filter((item) => {
    if (item.adminOnly && !isAdmin) return false;
    if (isAdmin && item.to === '/mood-calendar') return false;
    return true;
  });

  const navContent = (
    <nav className="flex flex-col gap-1 p-4">
      {items.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          onClick={() => setOpen(false)}
          className={({ isActive }) =>
            [
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150',
              isActive
                ? 'bg-blue-50 text-blue-600'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800',
            ].join(' ')
          }
        >
          <Icon size={18} strokeWidth={1.75} className="flex-shrink-0" />
          {label}
        </NavLink>
      ))}
    </nav>
  );

  return (
    <>
      {/* Mobile toggle button */}
      <button
        type="button"
        aria-label="Toggle menu"
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-5 left-5 z-[101] md:hidden w-12 h-12 rounded-full bg-blue-600 text-white shadow-lg flex items-center justify-center"
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile overlay */}
      {open && (
        <div
          role="presentation"
          className="fixed inset-0 z-[99] bg-black/20 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={[
          'bg-white border-r border-gray-100 overflow-y-auto flex-shrink-0',
          'fixed left-0 bottom-0 top-[64px] z-[100] w-[240px]',
          'transition-transform duration-200',
          open ? 'translate-x-0' : '-translate-x-full',
          'md:translate-x-0 md:static md:top-auto md:bottom-auto md:z-auto',
        ].join(' ')}
      >
        {navContent}
      </aside>

      <style>{`
        @media (min-width: 768px) {
          .sidebar { display: block !important; position: static !important; box-shadow: none; }
          button[aria-label="Toggle menu"] { display: none !important; }
        }
      `}</style>
    </>
  );
}
