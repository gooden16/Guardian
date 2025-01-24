import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Calendar, Clock, Users, Filter, Award, XCircle, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ShiftService, Shift, ShiftWithCounts } from '../services/ShiftService';
import { ProfileService } from '../services/ProfileService';

interface GroupedShift {
  date: string;
  name: string;
  shifts: {
    [key in 'Early' | 'Late' | 'Evening']?: ShiftWithCounts;
  };
}

interface MonthlyShifts {
  month: string;
  shifts: GroupedShift[];
}

export function ShiftListPage() {
  const { user } = useAuth();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [userShifts, setUserShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [operationError, setOperationError] = useState('');
  const [showAllShifts, setShowAllShifts] = useState(false);
  const [quarterlyStats, setQuarterlyStats] = useState<{
    totalShifts: number;
    shabbatotCount: number;
    role: 'TL' | 'L1' | 'L2';
  } | null>(null);
  const [withdrawalShift, setWithdrawalShift] = useState<Shift | null>(null);
  const [withdrawalReason, setWithdrawalReason] = useState('');
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [allShifts, myShifts, profile] = await Promise.all([
          ShiftService.getShifts(showAllShifts),
          ShiftService.getUserShifts(user!.id),
          ProfileService.getProfile(user!.id),
        ]);

        const stats = await ProfileService.getQuarterlyStats(user!.id);
        setQuarterlyStats({ ...stats, role: profile!.role });
        
        setShifts(allShifts);
        setUserShifts(myShifts);
      } catch (error) {
        setError('Failed to load shifts');
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user, showAllShifts]);

  const handleSignUp = async (shiftId: string) => {
    try {
      setOperationError('');
      await ShiftService.signUpForShift(shiftId, user!.id);
      const [allShifts, myShifts, stats] = await Promise.all([
        ShiftService.getShifts(showAllShifts),
        ShiftService.getUserShifts(user!.id),
        ProfileService.getQuarterlyStats(user!.id),
      ]);
      setShifts(allShifts);
      setUserShifts(myShifts);
      if (quarterlyStats) {
        setQuarterlyStats({ ...stats, role: quarterlyStats.role });
      }
    } catch (error) {
      setOperationError(error instanceof Error ? error.message : 'Failed to sign up for shift');
      console.error('Failed to sign up for shift:', error);
    }
  };

  const initiateWithdrawal = (shift: Shift) => {
    setWithdrawalShift(shift);
    setWithdrawalReason('');
    setShowWithdrawalModal(true);
  };

  const handleWithdrawal = async () => {
    if (!withdrawalShift || !withdrawalReason.trim()) return;

    try {
      setOperationError('');
      await ShiftService.withdrawFromShift(withdrawalShift.id, user!.id, withdrawalReason.trim());
      const [allShifts, myShifts, stats] = await Promise.all([
        ShiftService.getShifts(showAllShifts),
        ShiftService.getUserShifts(user!.id),
        ProfileService.getQuarterlyStats(user!.id),
      ]);
      setShifts(allShifts);
      setUserShifts(myShifts);
      if (quarterlyStats) {
        setQuarterlyStats({ ...stats, role: quarterlyStats.role });
      }
      setShowWithdrawalModal(false);
      setWithdrawalShift(null);
      setWithdrawalReason('');
    } catch (error) {
      setOperationError(error instanceof Error ? error.message : 'Failed to withdraw from shift');
      console.error('Failed to withdraw from shift:', error);
    }
  };

  const isTL = quarterlyStats?.role === 'TL';

  const handleTLSignUp = async (earlyShift: Shift, lateShift: Shift) => {
    try {
      setOperationError('');
      await ShiftService.signUpForShift(earlyShift.id, user!.id);
      const [allShifts, myShifts, stats] = await Promise.all([
        ShiftService.getShifts(showAllShifts),
        ShiftService.getUserShifts(user!.id),
        ProfileService.getQuarterlyStats(user!.id),
      ]);
      setShifts(allShifts);
      setUserShifts(myShifts);
      if (quarterlyStats) {
        setQuarterlyStats({ ...stats, role: quarterlyStats.role });
      }
    } catch (error) {
      setOperationError(error instanceof Error ? error.message : 'Failed to sign up for shifts');
      console.error('Failed to sign up for shifts:', error);
    }
  };

  const handleTLWithdrawal = async (shift: Shift) => {
    setWithdrawalShift(shift);
    setWithdrawalReason('');
    setShowWithdrawalModal(true);
  };

  const getRequirementStatus = () => {
    if (!quarterlyStats) return null;

    const requirements = quarterlyStats.role === 'TL' 
      ? { target: 2, label: 'Shabbatot' }
      : { target: 3, label: 'shifts' };

    const current = quarterlyStats.role === 'TL' 
      ? quarterlyStats.shabbatotCount 
      : quarterlyStats.totalShifts;
    
    const progress = current || 0;
    const remaining = Math.max(0, requirements.target - progress);

    return {
      progress,
      remaining,
      target: requirements.target,
      label: requirements.label,
    };
  };

  const groupShiftsByDate = (shifts: Shift[]): GroupedShift[] => {
    const grouped = shifts.reduce((acc, shift) => {
      const date = shift.date;
      if (!acc[date]) {
        acc[date] = {
          date,
          name: shift.name,
          shifts: {},
        };
      }
      acc[date].shifts[shift.shift_type] = shift;
      return acc;
    }, {} as Record<string, GroupedShift>);

    return Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date));
  };

  const groupShiftsByMonth = (shifts: GroupedShift[]): MonthlyShifts[] => {
    const grouped = shifts.reduce((acc, shift) => {
      const monthKey = format(new Date(shift.date), 'yyyy-MM');
      const monthDisplay = format(new Date(shift.date), 'MMMM yyyy');
      
      if (!acc[monthKey]) {
        acc[monthKey] = {
          month: monthDisplay,
          shifts: [],
        };
      }
      acc[monthKey].shifts.push(shift);
      return acc;
    }, {} as Record<string, MonthlyShifts>);

    return Object.values(grouped);
  };

  const isSignedUp = (shift: Shift) =>
    userShifts.some((userShift) => userShift.id === shift.id);

  const renderShiftCard = (groupedShift: GroupedShift) => {
    const { Early: earlyShift, Late: lateShift, Evening: eveningShift } = groupedShift.shifts;
    const hasEarlyAndLate = earlyShift && lateShift;
    const isTLSignedUp = hasEarlyAndLate && isSignedUp(earlyShift) && isSignedUp(lateShift);
    const canTLSignUp = hasEarlyAndLate && 
      earlyShift.filled_slots < earlyShift.total_slots && 
      lateShift.filled_slots < lateShift.total_slots;

    return (
      <div key={groupedShift.date} className="flex-none w-72 bg-white rounded-lg shadow-md p-4 mr-4 hover:shadow-lg transition-shadow">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Calendar className="h-5 w-5 text-gray-400 mr-2" />
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-900">
                  {format(new Date(groupedShift.date), 'MMMM d')}
                </span>
                <span className="text-xs text-gray-500">{groupedShift.name}</span>
              </div>
            </div>
            <Link
              to={`/shifts/${Object.values(groupedShift.shifts)[0].id}`}
              className="text-gray-400 hover:text-gray-600"
            >
              <ChevronRight className="h-5 w-5" />
            </Link>
          </div>

          <div className="space-y-2">
            {(['Early', 'Late', 'Evening'] as const).map((type) => {
              const shift = groupedShift.shifts[type];
              if (!shift) return null;
              
              const signed = isSignedUp(shift);
              return (
                <div key={type} className="flex flex-col space-y-1 p-2 rounded-md bg-gray-50">
                  <div className="flex items-center justify-between">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      type === 'Early' ? 'bg-blue-100 text-blue-800' :
                      type === 'Late' ? 'bg-purple-100 text-purple-800' :
                      'bg-orange-100 text-orange-800'
                    }`}>
                      {type}
                    </span>
                    <div className="flex items-center text-xs text-gray-500">
                      <Users className="h-3 w-3 mr-1" />
                      {shift.filled_slots}/{shift.total_slots}
                    </div>
                  </div>
                  <div className="flex items-center text-xs text-gray-500">
                    <Clock className="h-3 w-3 mr-1" />
                    {format(new Date(`2000-01-01T${shift.start_time}`), 'h:mm a')} -{' '}
                    {format(new Date(`2000-01-01T${shift.end_time}`), 'h:mm a')}
                  </div>
                  {(!isTL || type === 'Evening') && (
                    <button
                      onClick={() => signed ? initiateWithdrawal(shift) : handleSignUp(shift.id)}
                      disabled={!signed && shift.filled_slots >= shift.total_slots}
                      className={`mt-1 w-full inline-flex justify-center items-center px-2 py-1 text-xs font-medium rounded-md ${
                        signed
                          ? 'border-red-300 text-red-700 bg-red-50 hover:bg-red-100'
                          : shift.filled_slots >= shift.total_slots
                          ? 'border-gray-300 text-gray-400 bg-gray-50 cursor-not-allowed'
                          : 'border-green-300 text-green-700 bg-green-50 hover:bg-green-100'
                      }`}
                    >
                      {signed
                        ? 'Withdraw'
                        : shift.filled_slots >= shift.total_slots
                        ? 'Full'
                        : 'Sign Up'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {isTL && hasEarlyAndLate && (
            <button
              onClick={() => isTLSignedUp 
                ? handleTLWithdrawal(earlyShift)
                : handleTLSignUp(earlyShift, lateShift)
              }
              disabled={!isTLSignedUp && !canTLSignUp}
              className={`w-full inline-flex justify-center items-center px-3 py-1.5 text-sm font-medium rounded-md ${
                isTLSignedUp
                  ? 'border-red-300 text-red-700 bg-red-50 hover:bg-red-100'
                  : !canTLSignUp
                  ? 'border-gray-300 text-gray-400 bg-gray-50 cursor-not-allowed'
                  : 'border-green-300 text-green-700 bg-green-50 hover:bg-green-100'
              }`}
            >
              {isTLSignedUp
                ? 'Withdraw from Both'
                : !canTLSignUp
                ? 'Shifts Full'
                : 'Sign Up for Both'}
            </button>
          )}
        </div>
      </div>
    );
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

  const requirementStatus = getRequirementStatus();
  const groupedShifts = groupShiftsByDate(shifts);
  const monthlyShifts = groupShiftsByMonth(groupedShifts);

  return (
    <div className="space-y-6">
      {operationError && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700">{operationError}</div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-gray-900">Shifts</h1>
          <button
            onClick={() => setShowAllShifts(!showAllShifts)}
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Filter className="h-4 w-4 mr-2" />
            {showAllShifts ? 'Show Current Quarter' : 'Show All Shifts'}
          </button>
        </div>

        {requirementStatus && (
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Award className="h-5 w-5 text-indigo-500" />
            <span>
              {requirementStatus.progress} / {requirementStatus.target} {requirementStatus.label} this quarter
            </span>
          </div>
        )}
      </div>

      {monthlyShifts.map(({ month, shifts }) => (
        <div key={month} className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">{month}</h2>
          <div className="flex overflow-x-auto pb-4 space-x-4">
            {shifts.map(renderShiftCard)}
          </div>
        </div>
      ))}

      {showWithdrawalModal && withdrawalShift && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-medium text-gray-900">Withdraw from Shift</h3>
              <button
                onClick={() => {
                  setShowWithdrawalModal(false);
                  setWithdrawalShift(null);
                  setWithdrawalReason('');
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label htmlFor="reason" className="block text-sm font-medium text-gray-700">
                  Reason for withdrawal
                </label>
                <textarea
                  id="reason"
                  rows={3}
                  value={withdrawalReason}
                  onChange={(e) => setWithdrawalReason(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="Please provide a reason for withdrawing from this shift..."
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowWithdrawalModal(false);
                    setWithdrawalShift(null);
                    setWithdrawalReason('');
                  }}
                  className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleWithdrawal}
                  disabled={!withdrawalReason.trim()}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:bg-gray-300"
                >
                  Confirm Withdrawal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}