import React from 'react';

interface AvatarProps {
  url?: string | null;
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Avatar({ url, name, size = 'md', className = '' }: AvatarProps) {
  const [error, setError] = React.useState(false);
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase();
  
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-20 h-20 text-xl'
  };

  if (!url || error) {
    return (
      <div 
        className={`${sizeClasses[size]} rounded-full bg-gray-100 flex items-center justify-center ${className}`}
        title={name}
      >
        <span className="text-gray-400">{initials}</span>
      </div>
    );
  }

  return (
    <img
      src={url}
      alt={name}
      title={name}
      onError={() => setError(true)}
      className={`${sizeClasses[size]} rounded-full object-cover ${className}`}
    />
  );
}