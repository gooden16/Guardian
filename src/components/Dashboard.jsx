import React, { useState, useEffect } from 'react';
import { StatCard } from './dashboard/StatCard';
import { ActivityFeed } from './dashboard/ActivityFeed';
import { format } from 'date-fns';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { ShiftTime } from '../models/Shift';
import { getHolidayName } from '../utils/jewishCalendar';
import { getUpcomingShifts, signUpForShift } from '../lib/database';
import toast from 'react-hot-toast';

export function Dashboard({ onViewShift }) {
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadShifts();
  }, []);

  const loadShifts = async () => {
    try {
      const data = await getUpcomingShifts();
      setShifts(data.slice(0, 3)); // Only show first 3 shifts
    } catch (error) {
      console.error('Error loading shifts:', error);
      toast.error('Failed to load shifts');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (shift) => {
    try {
      await signUpForShift(shift.id, shift.role);
      toast.success(`Successfully signed up for ${format(new Date(shift.date), 'MMMM d')} shift`);
      loadShifts(); // Reload shifts to update availability
    } catch (error) {
      console.error('Error signing up for shift:', error);
      toast.error('Failed to sign up for shift');
    }
  };

  return (
    <main className="flex-1 min-w-0 overflow-auto">
      <div className="max-w-[1440px] mx-auto animate-fade-in">
        <div className="flex flex-wrap justify-between gap-3 p-4">
          <h1 className="text-gray-900 dark:text-white text-2xl md:text-3xl font-bold">Dashboard</h1>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
          <StatCard title="Your upcoming shifts" value="3" change="+1 this month" />
          <StatCard title="Total shifts completed" value="12" change="+5 this quarter" />
          <StatCard title="Active conversations" value="5" change="+2 new messages" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-4">
          {/* Main content - 2 columns */}
          <div className="lg:col-span-2 space-y-4">
            {/* Upcoming Shifts */}
            <Card>
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Upcoming Shifts
                </h2>
                {loading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {shifts.map((shift) => (
                      <div
                        key={shift.id}
                        className="p-4 rounded-lg border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-dark-hover transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {format(new Date(shift.date), 'EEEE, MMMM d')}
                            </p>
                            {getHolidayName(new Date(shift.date)) && (
                              <p className="text-sm text-primary">
                                {getHolidayName(new Date(shift.date))}
                              </p>
                            )}
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                              {shift.time === ShiftTime.EARLY_MORNING ? '8:35 AM - 10:20 AM' : '10:10 AM - 12:00 PM'}
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
                        <div className="flex justify-end gap-2 mt-4">
                          <Button 
                            variant="secondary"
                            onClick={() => onViewShift(shift)}
                          >
                            View Details
                          </Button>
                          {shift.spotsAvailable > 0 && (
                            <Button onClick={() => handleSignup(shift)}>
                              Sign Up
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>
          
          {/* Sidebar - 1 column */}
          <div className="space-y-4">
            <ActivityFeed />
          </div>
        </div>
      </div>
    </main>
  );
}