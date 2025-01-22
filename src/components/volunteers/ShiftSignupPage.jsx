import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { ShiftTime } from '../../models/Shift';
import { getHolidayName } from '../../utils/jewishCalendar';
import { getUpcomingShifts, signUpForShift } from '../../lib/database';
import toast from 'react-hot-toast';
import { useAuthContext } from '../../contexts/AuthContext';

export function ShiftSignupPage({ onViewShift }) {
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [signingUp, setSigningUp] = useState(false);
  const { user } = useAuthContext();

  useEffect(() => {
    loadShifts();
  }, []);

  const loadShifts = async () => {
    try {
      const data = await getUpcomingShifts();
      setShifts(data);
    } catch (error) {
      console.error('Error loading shifts:', error);
      toast.error('Failed to load shifts');
    } finally {
      setLoading(false);
    }
  };

  const formatShiftTime = (time) => {
    if (!time) {
      return 'Time not specified';
    }
    const times = {
      [ShiftTime.EARLY_MORNING]: { start: '8:35 AM', end: '10:20 AM' },
      [ShiftTime.LATE_MORNING]: { start: '10:10 AM', end: '12:00 PM' }
    };

    if (!times[time]) {
      return 'Invalid time';
    }

    return `${times[time].start} - ${times[time].end}`;
  };

  const handleSignup = async (shift) => {
    if (signingUp) return;
    
    try {
      setSigningUp(true);
      await signUpForShift(shift.id, shift.role);
      toast.success(`Successfully signed up for ${format(new Date(shift.date), 'MMMM d')} shift`);
      loadShifts(); // Reload shifts to update availability
    } catch (error) {
      console.error('Error signing up for shift:', error);
      toast.error(error.message || 'Failed to sign up for shift');
    } finally {
      setSigningUp(false);
    }
  };

  const isUserSignedUp = (shift) => {
    if (!user || !shift.assignments) return false;
    return shift.assignments.some(assignment => assignment.volunteer?.id === user.id);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
      </div>
    );
  }

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
                          {formatShiftTime(shift.time)}
                        </p>
                      </div>
                      <div className="text-right">
                        {shift.role && (
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {shift.role.split('_').map(word => 
                              word.charAt(0) + word.slice(1).toLowerCase()
                            ).join(' ')}
                          </p>
                        )}
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
                      {shift.spotsAvailable > 0 && !isUserSignedUp(shift) && (
                        <Button 
                          onClick={() => handleSignup(shift)}
                          disabled={signingUp}
                        >
                          {signingUp ? 'Signing up...' : 'Sign Up'}
                        </Button>
                      )}
                      {isUserSignedUp(shift) && (
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Signed Up</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
