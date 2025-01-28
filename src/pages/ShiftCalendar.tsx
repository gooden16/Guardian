import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday, getDay } from 'date-fns';
import { Calendar as CalendarIcon, Users, AlertCircle, Plus, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getHebrewDate, isHoliday, getParasha, isShabbat, isMajorHoliday, getHolidayName } from '../lib/hebcal';
import type { Database } from '../lib/database.types';

type Shift = Database['public']['Tables']['shifts']['Row'];
type ShiftAssignment = Database['public']['Tables']['shift_assignments']['Row'];

const ShiftCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [assignments, setAssignments] = useState<ShiftAssignment[]>([]);
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null);
  const [signingUp, setSigningUp] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: volunteer } = await supabase
          .from('volunteers')
          .select('id')
          .eq('auth_user_id', user.id)
          .single();
        
        if (volunteer) {
          setCurrentUser(volunteer);
        }
      }
      
      // Get shifts and assignments
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

    fetchData();
  }, [currentDate]);

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate),
  });

  const getShiftsForDate = (date: Date) => {
    return shifts.filter(shift => 
      new Date(shift.date).toDateString() === date.toDateString()
    ).sort((a, b) => 
      a.shift_type === 'EARLY' ? -1 : 1
    );
  };

  const getAssignmentsForShift = (shiftId: string) => {
    return assignments.filter(assignment => assignment.shift_id === shiftId);
  };

  const isUserAssigned = (shiftId: string) => {
    return assignments.some(a => 
      a.shift_id === shiftId && 
      a.volunteer_id === currentUser?.id
    );
  };

  const handleSignup = async (shiftId: string) => {
    if (!currentUser) {
      alert('Please log in to sign up for shifts');
      return;
    }

    setSigningUp(shiftId);
    
    const { error } = await supabase
      .from('shift_assignments')
      .insert({
        shift_id: shiftId,
        volunteer_id: currentUser.id,
        status: 'CONFIRMED'
      });

    if (error) {
      console.error('Error signing up for shift:', error);
      alert('Failed to sign up for shift. Please try again.');
    } else {
      // Refresh assignments
      const { data } = await supabase
        .from('shift_assignments')
        .select('*')
        .in('shift_id', shifts.map(s => s.id));
      
      if (data) {
        setAssignments(data);
      }
    }
    
    setSigningUp(null);
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
            if (dayShifts.length === 0) return null;
            
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
                <div className="text-sm font-medium text-gray-900 flex items-center justify-between">
                  {format(date, 'd')}
                  {isMajorHoliday(date) && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      {getHolidayName(date)}
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {getHebrewDate(date)}
                </div>
                {isShabbat(date) && getParasha(date) && (
                  <div className="text-xs text-gray-600 mt-1 italic">
                    {getParasha(date)}
                  </div>
                )}
                
                {(isShabbat(date) || isMajorHoliday(date)) && (
                  <div className="mt-2 space-y-1">
                    {dayShifts.map((shift) => {
                      const assignments = getAssignmentsForShift(shift.id);
                      const needsVolunteers = assignments.length < shift.min_volunteers;
                      const userAssigned = isUserAssigned(shift.id);
                      
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
                              {shift.shift_type === 'EARLY' ? '8:35 - 10:20 AM' : '10:10 AM - 12:00 PM'}
                            </span>
                            <div className="flex items-center space-x-1">
                              <Users className="h-3 w-3" />
                              <span>
                                {assignments.length}/{shift.ideal_volunteers}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            {needsVolunteers && (
                              <div className="flex items-center space-x-1 text-red-700">
                                <AlertCircle className="h-3 w-3" />
                                <span>Needs volunteers</span>
                              </div>
                            )}
                            {!userAssigned && assignments.length < shift.ideal_volunteers && (
                              <button
                                onClick={() => handleSignup(shift.id)}
                                disabled={signingUp === shift.id}
                                className="flex items-center space-x-1 text-blue-600 hover:text-blue-800"
                              >
                                {signingUp === shift.id ? (
                                  <div className="animate-spin h-3 w-3 border-b-2 border-blue-600 rounded-full" />
                                ) : (
                                  <Plus className="h-3 w-3" />
                                )}
                                <span>Sign up</span>
                              </button>
                            )}
                            {userAssigned && (
                              <div className="flex items-center space-x-1 text-green-600">
                                <Check className="h-3 w-3" />
                                <span>Signed up</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ShiftCalendar;