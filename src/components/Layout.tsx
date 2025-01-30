import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { Shield, Calendar, User, LogOut, Settings } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { getUserProfile } from '../lib/profiles';

export function Layout() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    async function checkAdmin() {
      if (user) {
        const profile = await getUserProfile(user.id);
        setIsAdmin(profile?.is_admin ?? false);
      }
    }
    checkAdmin();
  }, [user]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <Link
                to="/"
                className="flex items-center px-2 py-2 text-gray-900 hover:text-indigo-600"
              >
                <Shield className="h-6 w-6 mr-2" />
                <span className="font-semibold text-lg">Guardian</span>
              </Link>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-4">
                <Link
                  to="/shifts"
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-900 hover:text-indigo-600"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Shifts
                </Link>
                <Link
                  to="/profile"
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-900 hover:text-indigo-600"
                >
                  <User className="h-4 w-4 mr-2" />
                  Profile
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-900 hover:text-indigo-600"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Admin
                  </Link>
                )}
              </div>
            </div>
            <div className="flex items-center">
              <button
                onClick={handleSignOut}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-900 hover:text-indigo-600"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-7xl w-full mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}