import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday } from 'date-fns';
import { Calendar as CalendarIcon, Users, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type Shift = Database['public']['Tables']['shifts']['Row'];
type ShiftAssignment = Database['public']['Tables']['shift_assignments']['Row'];

const ShiftCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [assignments, setAssignments] = useState<ShiftAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMonthShifts = async () => {
      setLoading(true);
      const start = startOfMonth(currentDate);
      const end = endOfMonth(currentDate);
      
      const { data: shiftsData, error: shiftsError } = await supabase
        .from('shifts')
        .select('*')
        .gte('date', start.toISOString())
        .lte('date', end.toISOString());

      if (shiftsError) {
        console.error('Error fetching shifts:', shiftsError);
        return;
      }

      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('shift_assignments')
        .select('*')
        .in('shift_id', shiftsData?.map(s => s.id) || []);

      if (assignmentsError) {
        console.error('Error fetching assignments:', assignmentsError);
        return;
      }

      setShifts(shiftsData || []);
      setAssignments(assignmentsData || []);
      setLoading(false);
    };

    fetchMonthShifts();
  }, [currentDate]);

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate),
  });

  const getShiftsForDate = (date: Date) => {
    return shifts.filter(shift => 
      new Date(shift.date).toDateString() === date.toDateString()
    );
  };

  const getAssignmentsForShift = (shiftId: string) => {
    return assignments.filter(assignment => assignment.shift_id === shiftId);
  };

  const previousMonth = () => {
    setCurrentDate(date => new Date(date.getFullYear(), date.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(date => new Date(date.getFullYear(), date.getMonth() + 1));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Shift Calendar</h2>
        <div className="flex items-center space-x-4">
          <button
            onClick={previousMonth}
            className="p-2 text-gray-600 hover:text-gray-900"
          >
            ←
          </button>
          <h3 className="text-lg font-semibold">
            {format(currentDate, 'MMMM yyyy')}
          </h3>
          <button
            onClick={nextMonth}
            className="p-2 text-gray-600 hover:text-gray-900"
          >
            →
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-4">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div
              key={day}
              className="text-sm font-semibold text-gray-600 text-center py-2"
            >
              {day}
            </div>
          ))}
          
          {daysInMonth.map((date, index) => {
            const dayShifts = getShiftsForDate(date);
            const isCurrentDay = isToday(date);
            
            return (
              <div
                key={date.toISOString()}
                className={`min-h-[120px] p-2 border rounded-lg ${
                  isCurrentDay
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-sm font-medium text-gray-900">
                  {format(date, 'd')}
                </div>
                
                <div className="mt-2 space-y-1">
                  {dayShifts.map(shift => {
                    const assignments = getAssignmentsForShift(shift.id);
                    const needsVolunteers = assignments.length < shift.min_volunteers;
                    
                    return (
                      <div
                        key={shift.id}
                        className={`p-2 rounded text-xs ${
                          needsVolunteers
                            ? 'bg-red-100 text-red-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>
                            {shift.shift_type === 'EARLY' ? '8:35 AM' : '10:20 AM'}
                          </span>
                          <div className="flex items-center space-x-1">
                            <Users className="h-3 w-3" />
                            <span>
                              {assignments.length}/{shift.ideal_volunteers}
                            </span>
                          </div>
                        </div>
                        {needsVolunteers && (
                          <div className="flex items-center space-x-1 mt-1 text-red-700">
                            <AlertCircle className="h-3 w-3" />
                            <span>Needs volunteers</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ShiftCalendar;