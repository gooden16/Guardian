import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Calendar,
  Users,
  Clock,
  Bell,
  Settings,
  BarChart,
} from 'lucide-react';

const menuItems = [
  { icon: Calendar, label: 'Schedule', path: '/' },
  { icon: Users, label: 'Volunteers', path: '/volunteers' },
  { icon: Clock, label: 'My Shifts', path: '/my-shifts' },
  { icon: Bell, label: 'Notifications', path: '/notifications' },
  { icon: BarChart, label: 'Reports', path: '/reports' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <div className="w-64 bg-white rounded-lg shadow-sm p-4">
      <div className="space-y-2">
        {menuItems.map(({ icon: Icon, label, path }) => {
          const isActive = location.pathname === path || 
            (path === '/' && location.pathname === '/') ||
            (path !== '/' && location.pathname.startsWith(path));

          return (
            <Link
              key={label}
              to={path}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left
                ${
                  isActive
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}