import React from 'react';
import { useState, useEffect } from 'react';
import { CalendarDays, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { getShifts, signUpForShift, getUserShifts } from '../lib/shifts';
import { ShiftCard } from '../components/ShiftCard';
import { UserShifts } from '../components/UserShifts';
import { ActivityFeed } from '../components/ActivityFeed';
import type { Shift } from '../types/shift';

function ShiftBoard() {
  const { user } = useAuth();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [userShifts, setUserShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        if (!user) {
          console.error('No user found');
          throw new Error('User not authenticated');
        }

        console.log('Loading data for user:', user.id);

        // Get user role
        const { data: profile, error: profileError } = await supabase 
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        
        if (profileError) {
          console.error('Profile error:', profileError);
          throw new Error('Failed to load user profile');
        }

        if (!profile) {
          console.error('No profile found for user:', user.id);
          throw new Error('User profile not found');
        }

        console.log('User role:', profile.role);
        setUserRole(profile.role);

        // Get next 4 weeks of shifts
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 28);
        
        console.log('Fetching shifts from', startDate, 'to', endDate);

        try {
          const shiftsData = await getShifts(startDate, endDate);
          console.log('Shifts data received:', shiftsData?.length || 0, 'shifts');
          setShifts(shiftsData);
        } catch (shiftsError) {
          console.error('Error loading shifts:', shiftsError);
          throw new Error('Failed to load shifts data');
        }

        try {
          const userShiftsData = await getUserShifts();
          console.log('User shifts data received:', userShiftsData?.length || 0, 'shifts');
          setUserShifts(userShiftsData);
        } catch (userShiftsError) {
          console.error('Error loading user shifts:', userShiftsError);
          throw new Error('Failed to load user shifts data');
        }

      } catch (error) {
        console.error('Failed to load data:', error);
        setError(error instanceof Error ? error.message : 'Failed to load shift data. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      loadData();
    }
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

  const handleWithdraw = async () => {
    // Reload shifts after withdrawal
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 28);

    const shiftsData = await getShifts(startDate, endDate);
    const userShiftsData = await getUserShifts();
    setShifts(shiftsData);
    setUserShifts(userShiftsData);
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
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="text-center">
          <p className="text-red-600 font-medium mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-6">
      <div className="flex-1 space-y-6">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              return (
                <ShiftCard
                  key={date}
                  userId={user?.id || ''}
                  userRole={userRole}
                  date={shabbatDate}
                  earlyShift={early}
                  lateShift={late}
                  onSignUp={(type, otherType) => {
                    const shift = type === 'early' ? early : late;
                    const otherShift = otherType === 'early' ? early : late;
                    if (shift && (!userRole || userRole !== 'TL' || otherShift)) {
                      handleSignUp(shift, otherShift);
                    }
                  }}
                  onWithdraw={handleWithdraw}
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
      
      {/* Activity Feed */}
      <div className="hidden lg:block w-80 bg-white rounded-lg shadow-sm p-6 h-fit sticky top-24">
        <ActivityFeed />
      </div>
    </div>
  );
}

export { ShiftBoard };