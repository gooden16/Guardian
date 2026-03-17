import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Shield, CalendarDays, MessageSquare, User, Settings, LogOut, SlidersHorizontal } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface SideNavProps {
  isAdmin: boolean;
}

export function SideNav({ isAdmin }: SideNavProps) {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? 'bg-indigo-50 text-indigo-700'
        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
    }`;

  return (
    <aside className="hidden md:flex flex-col w-56 shrink-0 border-r border-gray-200 bg-white min-h-screen sticky top-0 h-screen">
      {/* Logo */}
      <div className="flex items-center gap-2 px-5 py-5 border-b border-gray-100">
        <Shield className="h-6 w-6 text-indigo-600" />
        <span className="font-bold text-gray-900 text-lg">Guardian</span>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        <NavLink to="/schedule" className={linkClass}>
          <CalendarDays className="h-4 w-4" />
          Schedule
        </NavLink>

        <NavLink to="/preferences" className={linkClass}>
          <SlidersHorizontal className="h-4 w-4" />
          Preferences
        </NavLink>

        <NavLink to="/messages" className={linkClass}>
          <MessageSquare className="h-4 w-4" />
          Messages
        </NavLink>

        <NavLink to="/profile" className={linkClass}>
          <User className="h-4 w-4" />
          Profile
        </NavLink>

        {isAdmin && (
          <NavLink to="/admin" className={linkClass}>
            <Settings className="h-4 w-4" />
            Admin
          </NavLink>
        )}
      </nav>

      {/* Sign out */}
      <div className="px-3 py-4 border-t border-gray-100">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
