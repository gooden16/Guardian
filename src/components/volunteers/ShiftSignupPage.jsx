import React, { useState } from 'react';
import { format } from 'date-fns';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { ShiftTime, SHIFT_TIMES } from '../../models/Shift';
import { getHolidayName, getNextShiftDates } from '../../utils/jewishCalendar';

// Get the next 5 shift dates
const nextShiftDates = getNextShiftDates(5);

// Create upcoming shifts based on the next valid dates
const UPCOMING_SHIFTS = [
  {
    date: nextShiftDates[0],
    time: ShiftTime.EARLY_MORNING,
    role: 'Team Leader',
    spotsAvailable: 1
  },
  {
    date: nextShiftDates[0],
    time: ShiftTime.LATE_MORNING,
    role: 'Level 1',
    spotsAvailable: 2
  },
  {
    date: nextShiftDates[1],
    time: ShiftTime.EARLY_MORNING,
    role: 'Level 2',
    spotsAvailable: 1
  },
  {
    date: nextShiftDates[1],
    time: ShiftTime.LATE_MORNING,
    role: 'Level 1',
    spotsAvailable: 1
  },
  {
    date: nextShiftDates[2],
    time: ShiftTime.EARLY_MORNING,
    role: 'Team Leader',
    spotsAvailable: 1
  }
];

export function ShiftSignupPage({ onViewShift }) {
  const [selectedDate, setSelectedDate] = useState(null);

  const formatShiftTime = (time) => {
    const times = SHIFT_TIMES[time];
    const formatTime = (timeStr) => {
      const [hours, minutes] = timeStr.split(':');
      const period = hours >= 12 ? 'PM' : 'AM';
      const hour = hours % 12 || 12;
      return `${hour}:${minutes} ${period}`;
    };
    return `${formatTime(times.start)} - ${formatTime(times.end)}`;
  };

  return (
    <main className="flex-1 min-w-0 overflow-auto">
      <div className="max-w-[1440px] mx-auto animate-fade-in">
        <div className="flex flex-wrap justify-between gap-3 p-4">
          <h1 className="text-gray-900 dark:text-white text-2xl md:text-3xl font-bold">Shift Signup</h1>
        </div>

        <div className="p-4">
          <Card>
            <CardHeader>
              <h2 className="text-gray-900 dark:text-white text-lg font-semibold">Available Shifts</h2>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {UPCOMING_SHIFTS.map((shift, index) => (
                  <button
                    key={index}
                    onClick={() => onViewShift(shift)}
                    className="w-full p-4 rounded-lg border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-dark-hover transition-colors text-left"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {format(shift.date, 'EEEE, MMMM d')}
                        </p>
                        {getHolidayName(shift.date) && (
                          <p className="text-sm text-primary">
                            {getHolidayName(shift.date)}
                          </p>
                        )}
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {formatShiftTime(shift.time)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {shift.role}
                        </p>
                        {shift.spotsAvailable > 0 ? (
                          <p className="text-sm text-green-600 dark:text-green-400">
                            {shift.spotsAvailable} spot{shift.spotsAvailable !== 1 ? 's' : ''} available
                          </p>
                        ) : (
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Fully staffed
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}