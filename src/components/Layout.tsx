import React from 'react';
import { Calendar, Users, Clock, Bell } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-blue-600 text-white shadow-lg">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="w-8 h-8" />
            <h1 className="text-2xl font-bold">CSS HIR Volunteer Portal</h1>
          </div>
          <nav className="hidden md:flex space-x-6">
            <a href="#schedule" className="flex items-center space-x-2 hover:text-blue-200">
              <Calendar className="w-5 h-5" />
              <span>Schedule</span>
            </a>
            <a href="#shifts" className="flex items-center space-x-2 hover:text-blue-200">
              <Clock className="w-5 h-5" />
              <span>My Shifts</span>
            </a>
            <a href="#notifications" className="flex items-center space-x-2 hover:text-blue-200">
              <Bell className="w-5 h-5" />
              <span>Notifications</span>
            </a>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-300 py-8 mt-auto">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-center md:text-left mb-4 md:mb-0">
              <h2 className="text-lg font-semibold">Community Security Service</h2>
              <p className="text-sm">Hebrew Institute of Riverdale Chapter</p>
            </div>
            <div className="text-sm text-center md:text-right">
              <p>Emergency Contact: (555) 123-4567</p>
              <p>© {new Date().getFullYear()} CSS. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};