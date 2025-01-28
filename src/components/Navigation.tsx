import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Calendar, User, Settings, LogIn, LogOut } from 'lucide-react';
import { useAuth } from '../lib/auth';
import AuthModal from './AuthModal';

const Navigation = () => {
  const { user, signOut } = useAuth();
  const [showAuthModal, setShowAuthModal] = React.useState(false);
  const [isSigningOut, setIsSigningOut] = React.useState(false);

  const navItems = [
    { to: '/', icon: Home, label: 'Dashboard' },
    { to: '/shifts', icon: Calendar, label: 'Shifts' },
    ...(user ? [
      { to: '/profile', icon: User, label: 'Profile' },
      { to: '/admin', icon: Settings, label: 'Admin' },
    ] : []),
  ];

  return (
    <>
      <nav className="flex items-center space-x-4">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium ${
                isActive
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`
            }
          >
            <Icon className="h-4 w-4" />
            <span>{label}</span>
          </NavLink>
        ))}
        
        {user ? (
          <button
            onClick={async () => {
              try {
                setIsSigningOut(true);
                await signOut();
              } catch (error) {
                console.error('Failed to sign out:', error);
              } finally {
                setIsSigningOut(false);
              }
            }}
            disabled={isSigningOut}
            className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-50"
          >
            {isSigningOut ? (
              <>
                <div className="h-4 w-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" />
                <span>Signing Out...</span>
              </>
            ) : (
              <>
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </>
            )}
          </button>
        ) : (
          <button
            onClick={() => setShowAuthModal(true)}
            className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100"
          >
            <LogIn className="h-4 w-4" />
            <span>Sign In</span>
          </button>
        )}
      </nav>

      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
    </>
  );
};

export default Navigation;