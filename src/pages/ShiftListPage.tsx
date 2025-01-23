import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Calendar, Clock, Users, Filter } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ShiftService, Shift } from '../services/ShiftService';

export function ShiftListPage() {
  const { user } = useAuth();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [userShifts, setUserShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAllShifts, setShowAllShifts] = useState(false);

  useEffect(() => {
    async function loadShifts() {
      try {
        const [allShifts, myShifts] = await Promise.all([
          ShiftService.getShifts(showAllShifts),
          ShiftService.getUserShifts(user!.id),
        ]);
        setShifts(allShifts);
        setUserShifts(myShifts);
      } catch (error) {
        setError('Failed to load shifts');
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    loadShifts();
  }, [user, showAllShifts]);

  const handleSignUp = async (shiftId: string) => {
    try {
      await ShiftService.signUpForShift(shiftId, user!.id);
      const [allShifts, myShifts] = await Promise.all([
        ShiftService.getShifts(showAllShifts),
        ShiftService.getUserShifts(user!.id),
      ]);
      setShifts(allShifts);
      setUserShifts(myShifts);
    } catch (error) {
      console.error('Failed to sign up for shift:', error);
    }
  };

  const handleWithdraw = async (shiftId: string) => {
    try {
      await ShiftService.withdrawFromShift(shiftId, user!.id);
      const [allShifts, myShifts] = await Promise.all([
        ShiftService.getShifts(showAllShifts),
        ShiftService.getUserShifts(user!.id),
      ]);
      setShifts(allShifts);
      setUserShifts(myShifts);
    } catch (error) {
      console.error('Failed to withdraw from shift:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="text-sm text-red-700">{error}</div>
      </div>
    );
  }

  const isSignedUp = (shift: Shift) =>
    userShifts.some((userShift) => userShift.id === shift.id);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Available Shifts</h2>
          <p className="mt-1 text-sm text-gray-500">
            {showAllShifts ? 'Showing all available shifts' : 'Showing shifts for the current quarter'}
          </p>
        </div>
        <button
          onClick={() => setShowAllShifts(!showAllShifts)}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <Filter className="h-4 w-4 mr-2" />
          {showAllShifts ? 'Show Current Quarter' : 'Show All Shifts'}
        </button>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {shifts.map((shift) => {
            const signedUp = isSignedUp(shift);
            return (
              <li key={shift.id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col sm:flex-row sm:items-center">
                      <p className="text-sm font-medium text-indigo-600 truncate">
                        {shift.name}
                      </p>
                      <p className="text-sm text-gray-500 mt-1 sm:mt-0 sm:ml-2">
                        ({format(new Date(shift.date), 'MMMM d, yyyy')})
                      </p>
                      <div className="flex items-center mt-2 sm:mt-0 sm:ml-6">
                        <Clock className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                        <p className="text-sm text-gray-500">
                          {format(new Date(`2000-01-01T${shift.start_time}`), 'h:mm a')} -{' '}
                          {format(new Date(`2000-01-01T${shift.end_time}`), 'h:mm a')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mr-4 ${
                        shift.shift_type === 'Early' ? 'bg-blue-100 text-blue-800' :
                        shift.shift_type === 'Late' ? 'bg-purple-100 text-purple-800' :
                        'bg-orange-100 text-orange-800'
                      }`}>
                        {shift.shift_type}
                      </span>
                      <div className="flex items-center mr-4">
                        <Users className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                        <p className="text-sm text-gray-500">
                          {shift.filled_slots}/{shift.total_slots} slots filled
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          signedUp
                            ? handleWithdraw(shift.id)
                            : handleSignUp(shift.id)
                        }
                        disabled={!signedUp && shift.filled_slots >= shift.total_slots}
                        className={`inline-flex items-center px-3 py-1.5 border text-sm font-medium rounded-md ${
                          signedUp
                            ? 'border-red-300 text-red-700 bg-red-50 hover:bg-red-100'
                            : shift.filled_slots >= shift.total_slots
                            ? 'border-gray-300 text-gray-400 bg-gray-50 cursor-not-allowed'
                            : 'border-green-300 text-green-700 bg-green-50 hover:bg-green-100'
                        }`}
                      >
                        {signedUp
                          ? 'Withdraw'
                          : shift.filled_slots >= shift.total_slots
                          ? 'Full'
                          : 'Sign Up'}
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}