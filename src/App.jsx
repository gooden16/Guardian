import React, { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { Header } from './components/ui/Header';
import Sidebar from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { VolunteersPage } from './components/volunteers/VolunteersPage';
import { ShiftSignupPage } from './components/volunteers/ShiftSignupPage';
import { ShiftDetailPage } from './components/volunteers/ShiftDetailPage';
import { ConversationsPage } from './components/conversations/ConversationsPage';
import { ProfilePage } from './components/profile/ProfilePage';
import { SettingsPage } from './components/settings/SettingsPage';
import { MobileMenu } from './components/ui/MobileMenu';

export default function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [selectedShift, setSelectedShift] = useState(null);

  const handleMenuItemClick = (page) => {
    setCurrentPage(page);
    setIsSidebarOpen(false);
  };

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
        return <Dashboard onViewShift={handleViewShift} />;
      case 'volunteers':
        return <VolunteersPage />;
      case 'shift-signup':
        return <ShiftSignupPage onViewShift={handleViewShift} />;
      case 'shift-detail':
        return <ShiftDetailPage shift={selectedShift} onBack={handleBackToShifts} />;
      case 'conversations':
        return <ConversationsPage />;
      case 'profile':
        return <ProfilePage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <Dashboard onViewShift={handleViewShift} />;
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
      <Toaster position="top-right" />
    </div>
  );
}