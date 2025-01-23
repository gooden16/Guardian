import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { Calendar, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function Layout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/auth');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <Link
                to="/shifts"
                className="flex items-center px-2 py-2 text-gray-900 hover:text-indigo-600"
              >
                <Calendar className="h-6 w-6 mr-2" />
                <span className="font-semibold">Shift Scheduler</span>
              </Link>
            </div>
            {user && (
              <div className="flex items-center">
                <span className="mr-4 text-gray-600">{user.email}</span>
                <button
                  onClick={handleSignOut}
                  className="p-2 text-gray-500 hover:text-gray-700"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}