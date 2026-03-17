import React from 'react';
import { format, parseISO } from 'date-fns';

export interface ShiftDateOption {
  date: string;       // ISO date string
  title: string;      // parasha or holiday name
}

interface PreferencesCalendarProps {
  selectedDates: string[];
  shiftDates: ShiftDateOption[];
  onChange: (dates: string[]) => void;
}

export function PreferencesCalendar({
  selectedDates,
  shiftDates,
  onChange,
}: PreferencesCalendarProps) {
  const toggle = (iso: string) => {
    if (selectedDates.includes(iso)) {
      onChange(selectedDates.filter((d) => d !== iso));
    } else {
      onChange([...selectedDates, iso]);
    }
  };

  if (shiftDates.length === 0) {
    return <p className="text-sm text-gray-400 italic">No shift dates found for this quarter.</p>;
  }

  return (
    <div className="space-y-1.5">
      {shiftDates.map(({ date: iso, title }) => {
        const isUnavailable = selectedDates.includes(iso);
        return (
          <button
            key={iso}
            onClick={() => toggle(iso)}
            className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg border text-sm transition-colors ${
              isUnavailable
                ? 'bg-red-50 border-red-200 text-red-700'
                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <div className="flex flex-col items-start text-left">
              <span className="font-medium">{format(parseISO(iso), 'EEE, MMM d')}</span>
              <span className={`text-xs mt-0.5 ${isUnavailable ? 'text-red-400' : 'text-gray-400'}`}>{title}</span>
            </div>
            <span className={`text-xs font-medium shrink-0 ml-3 ${isUnavailable ? 'text-red-500' : 'text-gray-400'}`}>
              {isUnavailable ? 'Unavailable' : 'Available'}
            </span>
          </button>
        );
      })}
      {selectedDates.length > 0 && (
        <p className="pt-1 text-xs text-gray-500">
          {selectedDates.length} date{selectedDates.length !== 1 ? 's' : ''} marked unavailable
        </p>
      )}
    </div>
  );
}
