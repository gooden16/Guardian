import React from 'react';
import { format } from 'date-fns';
import { Calendar, MessageCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getUpcomingShabbatDates } from '../lib/hebcal';
import { ShiftView } from './ShiftView';
import type { Shift } from '../types/shift';
import type { ShabbatDate } from '../lib/hebcal';

interface UserShiftsProps {
  shifts: Shift[];
  userId: string;
  userRole?: string;
  className?: string;
}

export function UserShifts({ shifts, userId, userRole, className = '' }: UserShiftsProps) {
  const [shabbatDates, setShabbatDates] = useState<ShabbatDate[]>([]);
  const [viewingShift, setViewingShift] = useState<Shift | null>(null);
  const isAdmin = userRole === 'admin';
  const isTeamLeader = userRole === 'TL';

  useEffect(() => {
    async function loadShabbatDates() {
      if (shifts.length > 0) {
        const startDate = new Date(shifts[0].date);
        const dates = await getUpcomingShabbatDates(startDate);
        setShabbatDates(dates);
      }
    }
    loadShabbatDates();
  }, [shifts]);

  const userShifts = shifts.filter(shift => 
    shift.volunteers.some(volunteer => volunteer.id === userId)
  ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (userShifts.length === 0) {
    return (
      <div className={`bg-white rounded-lg shadow-sm p-6 ${className}`}>
        <div className="text-center text-gray-500">
          <Calendar className="h-8 w-8 mx-auto mb-2" />
          <p>You haven't signed up for any shifts yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {userShifts.map(shift => (
        <div
          key={shift.id}
          onClick={() => setViewingShift(shift)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              setViewingShift(shift);
            }
          }}
          className="bg-white rounded-lg shadow-sm p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <div>
            <p className="text-sm font-medium text-gray-900">
              {format(new Date(shift.date), 'MMMM d, yyyy')}
            </p>
            {shabbatDates.find(sd => sd.date.toISOString().split('T')[0] === shift.date) && (
              <div className="mt-1">
                <p className="text-sm text-gray-600">
                  {shabbatDates.find(sd => sd.date.toISOString().split('T')[0] === shift.date)?.parasha}
                </p>
                <p className="text-sm text-gray-500 font-hebrew" dir="rtl">
                  {shabbatDates.find(sd => sd.date.toISOString().split('T')[0] === shift.date)?.hebrew}
                </p>
              </div>
            )}
            <p className="text-xs text-gray-500">
              {shift.type === 'early' ? '8:35 AM - 10:10 AM' : '10:20 AM - 12:00 PM'}
            </p>
          </div>
          <div className="flex items-center">
            <span className={`
              px-2 py-1 text-xs font-medium rounded-full
              ${shift.type === 'early' 
                ? 'bg-blue-50 text-blue-700' 
                : 'bg-purple-50 text-purple-700'}
            `}>
              {shift.type === 'early' ? 'Early' : 'Late'} Shift
            </span>
          </div>
        </div>
      ))}
      {viewingShift && (
        <ShiftView
          shift={viewingShift}
          isAdmin={isAdmin}
          isTeamLeader={isTeamLeader}
          onClose={() => setViewingShift(null)}
        />
      )}
    </div>
  );
}