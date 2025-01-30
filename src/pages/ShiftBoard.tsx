import React from 'react';
import { useState, useEffect } from 'react';
import { CalendarDays, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { getShifts, signUpForShift, getUserShifts } from '../lib/shifts';
import { getUpcomingShabbatDates } from '../lib/hebcal';
import { ShiftCard } from '../components/ShiftCard';
import { UserShifts } from '../components/UserShifts';
import type { Shift } from '../types/shift';
import type { ShabbatDate } from '../lib/hebcal';

export function ShiftBoard() {
  const { user } = useAuth();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [userShifts, setUserShifts] = useState<Shift[]>([]);
  const [shabbatDates, setShabbatDates] = useState<ShabbatDate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        // Get user role
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

          if (!profile) {
            throw new Error('User profile not found');
          }

          setUserRole(profile?.role || null);
        }

        // Get next 4 weeks of shifts
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 28);
        
        const shiftsData = await getShifts(startDate, endDate);
        const userShiftsData = await getUserShifts();
        const shabbatDatesData = await getUpcomingShabbatDates(startDate);
        setShifts(shiftsData || []);
        setUserShifts(userShiftsData);
        setShabbatDates(shabbatDatesData);
      } catch (error) {
        console.error('Failed to load data:', error);
        setError(error instanceof Error ? error.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user]);

  const handleSignUp = async (shift: Shift, otherShift?: Shift) => {
    setError(null);
    try {
      await signUpForShift(shift.id, otherShift?.id);
      
      // Reload shifts after signup
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 28);

      const shiftsData = await getShifts(startDate, endDate);
      const userShiftsData = await getUserShifts();
      setShifts(shiftsData);
      setUserShifts(userShiftsData);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to sign up for shift';
      setError(message);
      
      // Clear error after 5 seconds
      setTimeout(() => setError(null), 5000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="text-red-600 text-center py-4">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-semibold text-gray-900">Shift Board</h1>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <CalendarDays className="h-5 w-5" />
            <span>Next 4 Shabbatot</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Users className="h-5 w-5" />
            <span>Your Shifts: {userShifts.length}/3</span>
          </div>
        </div>
      </div>
      
      {/* User's Shifts */}
      <div className="mb-8 bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">My Shifts</h2>
        <UserShifts 
          shifts={userShifts} 
          userId={user?.id || ''} 
          userRole={userRole}
        />
      </div>
      {/* Available Shifts */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Available Shifts</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Group shifts by date */}
          {Object.entries(
            shifts.reduce((acc, shift) => {
              const date = shift.date;
              if (!acc[date]) {
                acc[date] = { early: null, late: null };
              }
              acc[date][shift.type] = shift;
              return acc;
            }, {} as Record<string, { early: Shift | null; late: Shift | null }>)
          ).map(([date, { early, late }]) => {
            const shabbatDate = new Date(date);
            const parashaInfo = shabbatDates.find(
              sd => sd.date.toISOString().split('T')[0] === date
            );
            return (
              <ShiftCard
                key={date}
                userId={user?.id || ''}
                userRole={userRole}
                date={shabbatDate}
                parasha={parashaInfo?.parasha}
                hebrewParasha={parashaInfo?.hebrew}
                earlyShift={early}
                lateShift={late}
                onSignUp={(type, otherType) => {
                  const shift = type === 'early' ? early : late;
                  const otherShift = otherType === 'early' ? early : late;
                  if (shift && (!userRole || userRole !== 'TL' || otherShift)) {
                    handleSignUp(shift, otherShift);
                  }
                }}
              />
            );
          })}
        </div>
        {error && (
          <div className="text-red-600 text-center mt-4">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}