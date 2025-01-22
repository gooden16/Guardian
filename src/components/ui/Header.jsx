import React from 'react';
import { SearchBar } from './SearchBar';
import { NotificationsMenu } from './NotificationsMenu';
import { UserMenu } from './UserMenu';
import { ThemeToggle } from './ThemeToggle';

export function Header({ onMenuClick, onNavigate }) {
  return (
    <header className="sticky top-0 z-30 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-dark-card">
      <div className="max-w-[1440px] mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-dark-hover rounded-lg transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-primary">CSS Guardian</span>
            <span className="text-sm text-gray-500 dark:text-gray-400">HIR Chapter</span>
          </div>
          <div className="hidden sm:block">
            <SearchBar />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <NotificationsMenu />
          <ThemeToggle />
          <UserMenu onNavigate={onNavigate} />
        </div>
      </div>
    </header>
  );
}
