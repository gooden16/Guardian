import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { Calendar, LogOut, UserCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ProfileService } from '../services/ProfileService';

export function Layout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = React.useState<{ avatar_url: string | null } | null>(null);

  React.useEffect(() => {
    async function loadProfile() {
      if (user) {
        try {
          const profileData = await ProfileService.getProfile(user.id);
          setProfile(profileData);
        } catch (error) {
          console.error('Error loading profile:', error);
        }
      }
    }
    loadProfile();
  }, [user]);

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
            <div className="flex space-x-8">
              <Link
                to="/shifts"
                className={`flex items-center px-2 py-2 text-gray-900 hover:text-indigo-600 ${
                  location.pathname === '/shifts' ? 'border-b-2 border-indigo-500' : ''
                }`}
              >
                <Calendar className="h-6 w-6 mr-2" />
                <span className="font-semibold">Shift Scheduler</span>
              </Link>
            </div>
            {user && (
              <div className="flex items-center space-x-4">
                <Link
                  to="/profile"
                  className={`flex items-center px-2 py-2 text-gray-900 hover:text-indigo-600 ${
                    location.pathname === '/profile' ? 'border-b-2 border-indigo-500' : ''
                  }`}
                >
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt="Profile"
                      className="h-8 w-8 rounded-full object-cover ring-2 ring-white"
                    />
                  ) : (
                    <UserCircle className="h-8 w-8 text-gray-400" />
                  )}
                </Link>
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