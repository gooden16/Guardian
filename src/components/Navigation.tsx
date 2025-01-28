import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Calendar, User, Settings } from 'lucide-react';

const Navigation = () => {
  const navItems = [
    { to: '/', icon: Home, label: 'Dashboard' },
    { to: '/shifts', icon: Calendar, label: 'Shifts' },
    { to: '/profile', icon: User, label: 'Profile' },
    { to: '/admin', icon: Settings, label: 'Admin' },
  ];

  return (
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
    </nav>
  );
};

export default Navigation;