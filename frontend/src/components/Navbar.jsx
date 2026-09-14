import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();

  const unreadBadge =
    unreadCount > 0 ? (
      <span className="ml-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-taarof-500 text-white text-[11px] font-bold leading-none">
        {unreadCount > 99 ? '99+' : unreadCount}
      </span>
    ) : null;

  const linkClass = ({ isActive }) =>
    `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
      isActive ? 'bg-taarof-50 text-taarof-600' : 'text-dune-900/70 hover:text-taarof-600'
    }`;

  return (
    <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-16">
        <Link to="/directory" className="flex items-center gap-2">
          <span className="text-2xl">💫</span>
          <span className="font-display font-bold text-xl text-taarof-600">
            Taarof <span className="text-dune-900/50 text-base font-normal">تعارف</span>
          </span>
        </Link>

        {user && (
          <div className="hidden sm:flex items-center gap-1">
            <NavLink to="/directory" className={linkClass}>
              Discover
            </NavLink>
            <NavLink to="/inbox" className={linkClass}>
              Messages
              {unreadBadge}
            </NavLink>
            <NavLink to="/settings" className={linkClass}>
              Settings
            </NavLink>
          </div>
        )}

        {user ? (
          <div className="flex items-center gap-3">
            <img
              src={user.photoURL ? undefined : undefined}
              alt=""
              className="hidden"
            />
            <button
              onClick={() => navigate('/settings')}
              className="w-9 h-9 rounded-full bg-taarof-100 text-taarof-600 flex items-center justify-center font-semibold overflow-hidden"
            >
              {user.name?.[0]?.toUpperCase() || '?'}
            </button>
            <button onClick={() => { logout(); navigate('/'); }} className="text-sm text-dune-900/60 hover:text-taarof-600">
              Log out
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link to="/login" className="text-sm font-medium text-dune-900/70 hover:text-taarof-600">
              Log in
            </Link>
            <Link to="/signup" className="btn-primary !py-2 !px-4 text-sm">
              Sign up free
            </Link>
          </div>
        )}
      </div>

      {/* Mobile bottom nav */}
      {user && (
        <div className="sm:hidden flex items-center justify-around border-t border-gray-100 h-14">
          <NavLink to="/directory" className={linkClass}>Discover</NavLink>
          <NavLink to="/inbox" className={linkClass}>Messages{unreadBadge}</NavLink>
          <NavLink to="/settings" className={linkClass}>Settings</NavLink>
        </div>
      )}
    </nav>
  );
}
