import React from 'react';
import clsx from 'clsx';

export function Card({ className, children }) {
  return (
    <div className={clsx(
      'bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm',
      className
    )}>
      {children}
    </div>
  );
}

export function CardHeader({ className, children }) {
  return (
    <div className={clsx(
      'flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800',
      className
    )}>
      {children}
    </div>
  );
}

export function CardContent({ className, children }) {
  return (
    <div className={clsx('p-6', className)}>
      {children}
    </div>
  );
}