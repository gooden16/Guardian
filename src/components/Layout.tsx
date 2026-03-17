import React from 'react';
import { Outlet } from 'react-router-dom';
import { SideNav } from './SideNav';
import { BottomNav } from './BottomNav';
import { useAuth } from '../context/AuthContext';

export function Layout() {
  const { isAdmin } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Desktop sidebar */}
      <SideNav isAdmin={isAdmin} />

      {/* Page content */}
      <main className="flex-1 min-w-0 pb-20 md:pb-0">
        <div className="max-w-3xl mx-auto px-4 py-6 sm:px-6">
          <Outlet />
        </div>
      </main>

      {/* Mobile bottom nav */}
      <BottomNav isAdmin={isAdmin} />
    </div>
  );
}
