import React, { useState, useEffect } from 'react';
import { Header } from './components/ui/Header';
import Sidebar from './components/Sidebar';
import { Dashboard } from './components/Dashboard.jsx';
import { VolunteersPage } from './components/volunteers/VolunteersPage.jsx';
import { ShiftSignupPage } from './components/volunteers/ShiftSignupPage.jsx';
import { ShiftDetailPage } from './components/volunteers/ShiftDetailPage.jsx';
import { ConversationsPage } from './components/conversations/ConversationsPage.jsx';
import { ProfilePage } from './components/profile/ProfilePage.jsx';
import { SettingsPage } from './components/settings/SettingsPage.jsx';
import { AuthPage } from './components/auth/AuthPage.jsx';
import { MobileMenu } from './components/ui/MobileMenu';
import { useAuthContext } from './contexts/AuthContext';
import { supabase } from './lib/supabase';
import { logger } from './utils/logger';
import { AuthError, ErrorCodes, getErrorMessage } from './utils/errors';

export default function App() {
  const { user, loading, initialized, error } = useAuthContext();
  const [profile, setProfile] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [selectedShift, setSelectedShift] = useState(null);
  const [showLoading, setShowLoading] = useState(true);

  // Handle navigation from sidebar
  const handleMenuItemClick = (page) => {
    setCurrentPage(page);
    setIsSidebarOpen(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLoading(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadProfile = async () => {
      if (!user) {
        setProfile(null);
        return;
      }
      try {
        logger.debug('Loading profile', { userId: user.id });
        
        const { data, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) {
          throw new AuthError(
            'Failed to fetch profile',
            ErrorCodes.PROFILE_NOT_FOUND,
            profileError
          );
        }

        if (mounted) {
          setProfile(data);
          logger.debug('Profile loaded successfully', { profile: data });
        }
      } catch (error) {
        logger.error('Error loading profile', error);
        setProfile(null);
      }
    };

    if (user) {
      loadProfile();
    }

    return () => {
      mounted = false;
    };
  }, [user]);

  // Debug log to help identify where we're getting stuck
  console.log('Auth State:', { loading, initialized, user, profile, showLoading, error });

  // Only show loading state if auth is not initialized and loading is true
  if (!initialized && loading && showLoading) {
    return (
      <div className="fixed inset-0 bg-gray-50 dark:bg-dark-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  // Show auth page if not authenticated or no profile
  if (!user || !profile) {
    return <AuthPage />;
  }

  const handleViewShift = (shift) => {
    setSelectedShift(shift);
    setCurrentPage('shift-detail');
  };

  const handleBackToShifts = () => {
    setSelectedShift(null);
    setCurrentPage('shift-signup');
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onViewShift={handleViewShift} key="dashboard" />;
      case 'shift-signup':
        return <ShiftSignupPage onViewShift={handleViewShift} key="shift-signup" />;
      case 'volunteers':
        return <VolunteersPage key="volunteers" />;
      case 'shift-detail':
        return <ShiftDetailPage shift={selectedShift} onBack={handleBackToShifts} key="shift-detail" />;
      case 'conversations':
        return <ConversationsPage key="conversations" />;
      case 'profile':
        return <ProfilePage key="profile" />;
      case 'settings':
        return <SettingsPage key="settings" />;
      default:
        return <Dashboard onViewShift={handleViewShift} key="dashboard-default" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg dark:text-gray-100 transition-colors duration-200">
      <Header 
        onMenuClick={() => setIsSidebarOpen(true)} 
        onNavigate={setCurrentPage}
      />
      <div className="max-w-[1440px] mx-auto">
        <div className="flex">
          <Sidebar 
            isOpen={isSidebarOpen} 
            onClose={() => setIsSidebarOpen(false)}
            currentPage={currentPage}
            onMenuItemClick={handleMenuItemClick}
          />
          {renderPage()}
        </div>
      </div>
      <MobileMenu 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)}
        currentPage={currentPage}
        onNavigate={handleMenuItemClick}
      />
    </div>
  );
}
