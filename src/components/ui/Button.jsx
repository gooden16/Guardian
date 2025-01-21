import React from 'react';
import clsx from 'clsx';

export function Button({ className, children, variant = 'primary', ...props }) {
  return (
    <button
      className={clsx(
        'flex items-center justify-center px-4 h-10 rounded-xl font-medium transition-colors duration-200',
        {
          'bg-primary hover:bg-primary-light text-white': variant === 'primary',
          'bg-gray-100 hover:bg-gray-200 text-gray-900': variant === 'secondary',
        },
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}