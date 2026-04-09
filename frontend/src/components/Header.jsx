/**
 * Header — professional top bar with lucide-react icons + Tailwind.
 */

import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useRef, useEffect } from 'react';
import { Leaf, ChevronDown, LogOut, User as UserIcon } from 'lucide-react';

export default function Header() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const displayName = user?.name || user?.email?.split('@')[0] || 'User';
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 sticky top-0 z-50 shadow-sm">
      {/* Logo */}
      <Link
        to="/dashboard"
        className="flex items-center gap-2 text-blue-600 font-semibold text-lg tracking-tight no-underline hover:opacity-80 transition-opacity"
      >
        <Leaf size={20} strokeWidth={2} className="text-blue-500" />
        <span className="text-gray-800">Student</span>
        <span className="text-blue-600">Wellness</span>
      </Link>

      {/* User menu */}
      {user && (
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-expanded={menuOpen}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
          >
            {/* Avatar circle */}
            <span className="w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-semibold flex items-center justify-center flex-shrink-0">
              {initials}
            </span>
            <span className="hidden sm:block max-w-[140px] truncate">{displayName}</span>
            <ChevronDown
              size={14}
              className={`text-gray-400 transition-transform duration-200 ${menuOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
              <Link
                to="/profile"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors no-underline"
              >
                <UserIcon size={15} className="text-gray-400" />
                Profile
              </Link>
              <div className="my-1 border-t border-gray-100" />
              <button
                type="button"
                onClick={() => { logout(); setMenuOpen(false); }}
                className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
              >
                <LogOut size={15} className="text-red-400" />
                Log out
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
