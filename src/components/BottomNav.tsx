import React from 'react';
import { NavLink } from 'react-router-dom';
import { CalendarDays, MessageSquare, User, Settings, SlidersHorizontal } from 'lucide-react';

interface BottomNavProps {
  isAdmin: boolean;
}

export function BottomNav({ isAdmin }: BottomNavProps) {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex flex-col items-center gap-0.5 px-3 py-2 text-xs font-medium transition-colors ${
      isActive ? 'text-indigo-600' : 'text-gray-500'
    }`;

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 bg-white border-t border-gray-200 safe-area-pb md:hidden">
      <div className="flex justify-around">
        <NavLink to="/schedule" className={linkClass}>
          <CalendarDays className="h-5 w-5" />
          Schedule
        </NavLink>

        <NavLink to="/preferences" className={linkClass}>
          <SlidersHorizontal className="h-5 w-5" />
          Prefs
        </NavLink>

        <NavLink to="/messages" className={linkClass}>
          <MessageSquare className="h-5 w-5" />
          Messages
        </NavLink>

        <NavLink to="/profile" className={linkClass}>
          <User className="h-5 w-5" />
          Profile
        </NavLink>

        {isAdmin && (
          <NavLink to="/admin" className={linkClass}>
            <Settings className="h-5 w-5" />
            Admin
          </NavLink>
        )}
      </div>
    </nav>
  );
}
