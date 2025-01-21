import React, { useState, useEffect } from 'react';
import { format, startOfWeek, addDays } from 'date-fns';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Shift } from '../types';

export default function Schedule() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchShifts();
  }, [currentDate]);

  const fetchShifts = async () => {
    try {
      const { data, error } = await supabase
        .from('shifts')
        .select(`
          *,
          assignments:shift_assignments(
            user:users(
              id, 
              first_name,
              last_name,
              role
            )
          )
        `)
        .gte('date', format(startOfWeek(currentDate), 'yyyy-MM-dd'))
        .lte('date', format(addDays(startOfWeek(currentDate), 6), 'yyyy-MM-dd'))
        .order('date', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) throw error;
      
      // Transform the data to match our frontend types
      const transformedShifts = data.map(shift => ({
        ...shift,
        assignments: shift.assignments.map(assignment => ({
          ...assignment,
          user: {
            ...assignment.user,
            firstName: assignment.user.first_name,
            lastName: assignment.user.last_name
          }
        }))
      }));
      
      setShifts(transformedShifts);
    } catch (error) {
      console.error('Error fetching shifts:', error);
    } finally {
      setLoading(false);
    }
  };

  const weekDays = Array.from({ length: 7 }, (_, i) =>
    addDays(startOfWeek(currentDate), i)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Schedule</h1>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setCurrentDate(addDays(currentDate, -7))}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="font-medium">
            {format(weekDays[0], 'MMM d')} -{' '}
            {format(weekDays[6], 'MMM d, yyyy')}
          </span>
          <button
            onClick={() => setCurrentDate(addDays(currentDate, 7))}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="grid grid-cols-7 divide-x divide-gray-200">
          {weekDays.map((day) => (
            <div
              key={day.toString()}
              className="p-4 text-center border-b border-gray-200"
            >
              <p className="text-sm text-gray-500">
                {format(day, 'EEEE')}
              </p>
              <p className="font-semibold">{format(day, 'MMM d')}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 divide-x divide-gray-200">
          {weekDays.map((day) => {
            const dayShifts = shifts.filter(
              (shift) => shift.date === format(day, 'yyyy-MM-dd')
            );

            return (
              <div
                key={day.toString()}
                className="min-h-[200px] p-4 space-y-2"
              >
                {dayShifts.map((shift) => (
                  <div
                    key={shift.id}
                    className="p-3 rounded-lg bg-blue-50 border border-blue-100 hover:bg-blue-100 transition-colors cursor-pointer"
                  >
                    <p className="font-medium text-sm">
                      {format(new Date(`2000-01-01T${shift.startTime}`), 'h:mm a')} -{' '}
                      {format(new Date(`2000-01-01T${shift.endTime}`), 'h:mm a')}
                    </p>
                    <p className="text-xs text-gray-600">
                      {shift.assignments.length} / 4 Volunteers
                    </p>
                    {shift.status === 'OPEN' && (
                      <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">
                        Needs Volunteers
                      </span>
                    )}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}