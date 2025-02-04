import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Users, MessageCircle, LogOut } from 'lucide-react';
import type { Shift } from '../types/shift';
import { withdrawFromShift, withdrawFromShifts } from '../lib/shifts';

interface ShiftCardProps {
  userId: string;
  userRole?: string;
  date: Date;
  earlyShift?: Shift;
  lateShift?: Shift;
  onSignUp: (type: 'early' | 'late', otherType?: 'early' | 'late') => void;
  onWithdraw: () => void;
}

export function ShiftCard({ userId, userRole, date, earlyShift, lateShift, onSignUp, onWithdraw }: ShiftCardProps) {
  const [viewingShift, setViewingShift] = useState<Shift | null>(null);
  const [withdrawingShifts, setWithdrawingShifts] = useState<Shift[]>([]);
  const [withdrawReason, setWithdrawReason] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);
  const isAdmin = (userRole || '').toLowerCase() === 'admin';
  const isTeamLeader = userRole === 'TL';

  // Add debug logging
  useEffect(() => {
    console.log('ShiftCard props:', {
      userId,
      userRole,
      date,
      earlyShift,
      lateShift
    });
  }, [userId, userRole, date, earlyShift, lateShift]);

  const getShiftStatus = (shift: Shift) => {
    const volunteerCount = shift.volunteers.length;
    if (volunteerCount === 0) return 'empty';
    if (volunteerCount < 3) return 'understaffed';
    if (volunteerCount === 4) return 'full';
    return 'partial';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'empty': return 'bg-red-50 text-red-700 ring-red-600/20';
      case 'understaffed': return 'bg-yellow-50 text-yellow-700 ring-yellow-600/20';
      case 'partial': return 'bg-blue-50 text-blue-700 ring-blue-600/20';
      case 'full': return 'bg-green-50 text-green-700 ring-green-600/20';
      default: return 'bg-gray-50 text-gray-700 ring-gray-600/20';
    }
  };

  const isUserSignedUp = (shift?: Shift) => {
    return shift?.volunteers.some(volunteer => volunteer.id === userId) ?? false;
  };

  const handleWithdraw = async () => {
    if (!withdrawReason.trim()) return;
    
    try {
      setWithdrawing(true);
      
      // For Team Leaders, withdraw from both shifts
      if (isTeamLeader && withdrawingShifts.length === 2) {
        await withdrawFromShifts(withdrawingShifts.map(s => s.id), withdrawReason);
      } else {
        // Regular volunteer withdrawal
        await withdrawFromShift(withdrawingShifts[0].id, withdrawReason);
      }
      
      setWithdrawingShifts([]);
      setWithdrawReason('');
      onWithdraw();
    } catch (error) {
      console.error('Failed to withdraw:', error);
    } finally {
      setWithdrawing(false);
    }
  };

  const handleWithdrawClick = (shift: Shift) => {
    if (isTeamLeader) {
      // Team Leaders must withdraw from both shifts
      const otherShift = shift.type === 'early' ? lateShift : earlyShift;
      if (otherShift && isUserSignedUp(otherShift)) {
        setWithdrawingShifts([shift, otherShift]);
      }
    } else {
      setWithdrawingShifts([shift]);
    }
  };

  const getButtonText = (shift?: Shift) => {
    if (!shift) return 'Sign Up';
    if (isUserSignedUp(shift)) return 'Signed Up';
    if (getShiftStatus(shift) === 'full') return 'Full';
    if (userRole === 'TL') return 'Sign Up for Both Shifts';
    return 'Sign Up';
  };

  const getButtonStyles = (shift?: Shift) => {
    if (!shift) return 'bg-gray-50 text-gray-400';
    if (isUserSignedUp(shift)) return 'bg-gray-100 text-gray-500 cursor-not-allowed';
    return getStatusColor(getShiftStatus(shift));
  };

  const canSignUp = (shift?: Shift) => {
    if (!shift || isUserSignedUp(shift) || getShiftStatus(shift) === 'full') {
      return false;
    }
    // For Team Leaders, both shifts must be available
    if (userRole === 'TL') {
      return earlyShift && 
             lateShift && 
             !isUserSignedUp(earlyShift) &&
             !isUserSignedUp(lateShift) &&
             getShiftStatus(earlyShift) !== 'full' &&
             getShiftStatus(lateShift) !== 'full';
    }
    return true;
  };

  const handleSignUp = (type: 'early' | 'late') => {
    if (userRole === 'TL') {
      // For Team Leaders, always sign up for both shifts
      const otherType = type === 'early' ? 'late' : 'early';
      const currentShift = type === 'early' ? earlyShift : lateShift;
      const otherShift = type === 'early' ? lateShift : earlyShift;
      
      if (!currentShift || !otherShift) {
        return; // Both shifts must exist
      }
      
      if (getShiftStatus(currentShift) === 'full' || getShiftStatus(otherShift) === 'full') {
        return; // Both shifts must have space
      }
      
      onSignUp(type, otherType);
    } else {
      // Regular volunteers can sign up for individual shifts
      onSignUp(type);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm ring-1 ring-gray-900/5 h-full flex flex-col">
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-base font-semibold text-gray-900">
              {format(date, 'MMMM d, yyyy')}
            </h3>
            {(earlyShift?.hebrew_parasha || lateShift?.hebrew_parasha) && (
              <div className="mt-1">
                <p className="text-sm text-gray-500 font-hebrew" dir="rtl" lang="he">
                  {earlyShift?.hebrew_parasha || lateShift?.hebrew_parasha}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="px-4 py-3 space-y-3 flex-1">
        {userRole === 'TL' ? (
          // Team Leader view - single button for both shifts
          <div className="space-y-4">
            <div className="space-y-3">
              {/* Early Shift Info */}
              <div>
                <p className="text-sm font-medium text-gray-900">Early Shift</p>
                <p className="text-xs text-gray-500">8:35 AM - 10:10 AM</p>
                <div className="mt-1 flex items-center gap-1">
                  <Users className="h-4 w-4 text-gray-400" />
                  <span className="text-xs text-gray-500">
                    {earlyShift?.volunteers.length ?? 0}/4
                  </span>
                </div>
              </div>
              {/* Late Shift Info */}
              <div>
                <p className="text-sm font-medium text-gray-900">Late Shift</p>
                <p className="text-xs text-gray-500">10:20 AM - 12:00 PM</p>
                <div className="mt-1 flex items-center gap-1">
                  <Users className="h-4 w-4 text-gray-400" />
                  <span className="text-xs text-gray-500">
                    {lateShift?.volunteers.length ?? 0}/4
                  </span>
                </div>
              </div>
            </div>
            {/* Combined signup button */}
            <button
              onClick={() => handleSignUp('early')}
              disabled={!canSignUp(earlyShift)}
              className={`w-full px-3 py-2 text-sm font-medium rounded-md ring-1 ring-inset
                ${getButtonStyles(earlyShift)}
                ${!canSignUp(earlyShift) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}
            >
              {getButtonText(earlyShift)}
            </button>
          </div>
        ) : (
          // Regular volunteer view - separate buttons
          <>
            {/* Early Shift */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Early Shift</p>
                <p className="text-xs text-gray-500">8:35 AM - 10:10 AM</p>
                <div className="mt-1 flex items-center gap-1">
                  <Users className="h-4 w-4 text-gray-400" />
                  <span className="text-xs text-gray-500">
                    {earlyShift?.volunteers.length ?? 0}/4
                  </span>
                </div>
              </div>
              <button
                onClick={() => handleSignUp('early')}
                disabled={!canSignUp(earlyShift)}
                className={`px-3 py-1 text-xs font-medium rounded-md ring-1 ring-inset
                  ${getButtonStyles(earlyShift)}
                  ${!canSignUp(earlyShift) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}
              >
                {getButtonText(earlyShift)}
              </button>
              {isUserSignedUp(earlyShift) && (
                <button
                  onClick={() => handleWithdrawClick(earlyShift!)}
                  className="ml-2 text-red-600 hover:text-red-700"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              )}
              {earlyShift && (
                <button
                  onClick={() => setViewingShift(earlyShift)}
                  className="ml-2 text-gray-400 hover:text-gray-500"
                >
                  <MessageCircle className="h-5 w-5" />
                </button>
              )}
            </div>

            {/* Late Shift */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Late Shift</p>
                <p className="text-xs text-gray-500">10:20 AM - 12:00 PM</p>
                <div className="mt-1 flex items-center gap-1">
                  <Users className="h-4 w-4 text-gray-400" />
                  <span className="text-xs text-gray-500">
                    {lateShift?.volunteers.length ?? 0}/4
                  </span>
                </div>
              </div>
              <button
                onClick={() => handleSignUp('late')}
                disabled={!canSignUp(lateShift)}
                className={`px-3 py-1 text-xs font-medium rounded-md ring-1 ring-inset
                  ${getButtonStyles(lateShift)}
                  ${!canSignUp(lateShift) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}
              >
                {getButtonText(lateShift)}
              </button>
              {isUserSignedUp(lateShift) && (
                <button
                  onClick={() => handleWithdrawClick(lateShift!)}
                  className="ml-2 text-red-600 hover:text-red-700"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              )}
              {lateShift && (
                <button
                  onClick={() => setViewingShift(lateShift)}
                  className="ml-2 text-gray-400 hover:text-gray-500"
                >
                  <MessageCircle className="h-5 w-5" />
                </button>
              )}
            </div>
          </>
        )}
      </div>
      {viewingShift && (
        <ShiftView
          shift={viewingShift}
          isAdmin={isAdmin}
          isTeamLeader={isTeamLeader}
          onClose={() => setViewingShift(null)}
        />
      )}
      
      {/* Withdrawal Modal */}
      {withdrawingShifts.length > 0 && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {isTeamLeader ? 'Withdraw from Both Shifts' : 'Withdraw from Shift'}
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Please provide a reason for withdrawing from {isTeamLeader ? 'these shifts' : 'this shift'}.
            </p>
            <textarea
              value={withdrawReason}
              onChange={(e) => setWithdrawReason(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              rows={3}
              placeholder="Enter your reason..."
              required
            />
            <div className="mt-4 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setWithdrawingShifts([]);
                  setWithdrawReason('');
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleWithdraw}
                disabled={!withdrawReason.trim() || withdrawing}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700 disabled:opacity-50"
              >
                {withdrawing ? 'Withdrawing...' : 'Withdraw'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}