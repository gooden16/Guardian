import React from 'react';
import { House, UsersThree, ChatDots, Megaphone, ChartPie } from './Icons';
import clsx from 'clsx';

/**
 * Navigation menu items configuration
 * Each item defines an id, icon component, and display text
 */
const menuItems = [
  { id: 'dashboard', icon: House, text: 'Home' },
  { id: 'volunteers', icon: UsersThree, text: 'Volunteers' },
  { id: 'conversations', icon: ChatDots, text: 'Conversations' },
  { id: 'campaigns', icon: Megaphone, text: 'Campaigns' },
  { id: 'reporting', icon: ChartPie, text: 'Reporting' }
];

/**
 * Quick access customer item component
 * Displays customer avatar, name, last seen status, and amount
 */
const QuickAccessItem = ({ image, name, lastSeen, amount, onClick }) => (
  <button
    onClick={onClick}
    className="flex items-center gap-4 w-full px-4 py-3 hover:bg-gray-50 dark:hover:bg-dark-hover transition-colors duration-200"
  >
    <div className="flex items-center gap-4 flex-1">
      <div
        className="bg-center bg-no-repeat bg-cover rounded-full h-10 w-10 border border-gray-100 dark:border-gray-700"
        style={{ backgroundImage: `url("${image}")` }}
      />
      <div className="flex flex-col min-w-0">
        <p className="text-gray-900 dark:text-white text-sm font-medium truncate">{name}</p>
        <p className="text-gray-500 dark:text-gray-400 text-xs">Last seen {lastSeen}</p>
      </div>
    </div>
    <div className="shrink-0">
      <p className="text-gray-700 dark:text-gray-300 text-sm font-medium">${amount}</p>
    </div>
  </button>
);

/**
 * Sidebar component that contains navigation menu and quick access items
 * Handles both desktop and mobile layouts
 */
export default function Sidebar({ isOpen, onClose, currentPage, onMenuItemClick }) {
  return (
    <aside className={clsx(
      'fixed inset-y-0 left-0 z-40 w-80 bg-white dark:bg-dark-card border-r border-gray-100 dark:border-gray-800 lg:static transform transition-transform duration-300 ease-in-out',
      isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
    )}>
      <div className="flex h-full flex-col">
        {/* Mobile header */}
        <div className="flex items-center justify-between p-4 lg:hidden">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Menu</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-dark-hover rounded-lg transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {/* Navigation menu */}
          <nav className="flex flex-col gap-1 p-4">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onMenuItemClick(item.id)}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200',
                  currentPage === item.id
                    ? 'bg-primary bg-opacity-15 text-primary dark:bg-opacity-20'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-hover'
                )}
              >
                <item.icon />
                <span className="text-sm font-medium">{item.text}</span>
              </button>
            ))}
          </nav>
          
          {/* Quick access section */}
          <div className="border-t border-gray-100 dark:border-gray-800">
            <h3 className="text-gray-900 dark:text-white text-sm font-semibold px-4 py-3">
              Quick access
            </h3>
            <div className="space-y-1">
              <QuickAccessItem
                image="https://cdn.usegalileo.ai/stability/117a7a12-7704-4917-9139-4a3f76c42e78.png"
                name="Alice Freeman"
                lastSeen="2 days ago"
                amount={200}
                onClick={() => onMenuItemClick('customers')}
              />
              <QuickAccessItem
                image="https://cdn.usegalileo.ai/stability/d4e7d763-28f3-4af2-bc57-a26db12c522b.png"
                name="Bob Smith"
                lastSeen="5 days ago"
                amount={100}
                onClick={() => onMenuItemClick('customers')}
              />
              <QuickAccessItem
                image="https://cdn.usegalileo.ai/stability/e9fdb59b-64bb-4239-8e52-f71e0cfb538e.png"
                name="Charlie Brown"
                lastSeen="7 days ago"
                amount={50}
                onClick={() => onMenuItemClick('customers')}
              />
              <QuickAccessItem
                image="https://cdn.usegalileo.ai/stability/1af7ccee-eb75-4af5-b80e-ee2ec64a79ef.png"
                name="David Jones"
                lastSeen="10 days ago"
                amount={300}
                onClick={() => onMenuItemClick('customers')}
              />
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}