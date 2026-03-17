import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Check } from 'lucide-react';
import type { Profile } from '../types/profile';
import { Avatar } from './Avatar';

interface VolunteerSelectorProps {
  volunteers: Profile[];
  selectedIds: string[];
  currentUserId: string;
  onChange: (ids: string[]) => void;
  max?: number;
  placeholder?: string;
}

export function VolunteerSelector({
  volunteers,
  selectedIds,
  currentUserId,
  onChange,
  max = 4,
  placeholder = 'Search volunteers…',
}: VolunteerSelectorProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const eligible = volunteers.filter(
    (v) => v.id !== currentUserId && (
      query.trim() === '' ||
      `${v.first_name} ${v.last_name}`.toLowerCase().includes(query.toLowerCase())
    )
  );

  const selectedVolunteers = volunteers.filter((v) => selectedIds.includes(v.id));

  const toggle = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((s) => s !== id));
    } else if (selectedIds.length < max) {
      onChange([...selectedIds, id]);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Selected chips */}
      {selectedVolunteers.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {selectedVolunteers.map((v) => (
            <span
              key={v.id}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-full"
            >
              {v.first_name} {v.last_name}
              <button
                onClick={() => toggle(v.id)}
                className="text-indigo-400 hover:text-indigo-600"
                aria-label={`Remove ${v.first_name}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder={selectedIds.length >= max ? `Max ${max} selected` : placeholder}
          disabled={selectedIds.length >= max}
          className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50 disabled:text-gray-400"
        />
      </div>

      {/* Dropdown */}
      {open && eligible.length > 0 && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
          {eligible.map((v) => {
            const isSelected = selectedIds.includes(v.id);
            return (
              <button
                key={v.id}
                onClick={() => toggle(v.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 transition-colors text-left"
              >
                <Avatar url={v.avatar_url} name={`${v.first_name} ${v.last_name}`} size="sm" />
                <span className="flex-1 text-sm text-gray-800">
                  {v.first_name} {v.last_name}
                  <span className={`ml-1.5 text-xs
                    ${v.role === 'TL' ? 'text-purple-600' :
                      v.role === 'L2' ? 'text-blue-600' :
                      'text-green-600'}`}>
                    {v.role}
                  </span>
                </span>
                {isSelected && <Check className="h-4 w-4 text-indigo-600" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
