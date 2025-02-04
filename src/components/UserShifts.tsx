import React from 'react';
import { format } from 'date-fns';
import { Calendar, MessageCircle, LogOut } from 'lucide-react';
import { useState } from 'react';
import { ShiftView } from './ShiftView';
import { withdrawFromShift, withdrawFromShifts } from '../lib/shifts';
import type { Shift } from '../types/shift';

interface UserShiftsProps {
  shifts: Shift[];
  userId: string;
  userRole?: string;
  onWithdraw?: () => void;
  className?: string;
}

export function UserShifts({ shifts, userId, userRole, onWithdraw, className = '' }: UserShiftsProps) {
  const [viewingShift, setViewingShift] = useState<Shift | null>(null);
  const [withdrawingShifts, setWithdrawingShifts] = useState<Shift[]>([]);
  const [withdrawReason, setWithdrawReason] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);
  const isAdmin = userRole === 'admin';
  const isTeamLeader = userRole === 'TL';

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
      if (onWithdraw) onWithdraw();
    } catch (error) {
      console.error('Failed to withdraw:', error);
    } finally {
      setWithdrawing(false);
    }
  };

  const handleWithdrawClick = (shift: Shift) => {
    if (isTeamLeader) {
      // Find the other shift on the same date
      const otherShift = shifts.find(s => 
        s.date === shift.date && s.type !== shift.type
      );
      if (otherShift) {
        setWithdrawingShifts([shift, otherShift]);
      }
    } else {
      setWithdrawingShifts([shift]);
    }
  };

  const userShifts = shifts.filter(shift => 
    shift.volunteers.some(volunteer => volunteer.id === userId)
  ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (userShifts.length === 0) {
    return (
      <div className={`bg-white rounded-lg shadow-sm p-6 ${className}`}>
        <div className="text-center text-gray-500">
          <Calendar className="h-8 w-8 mx-auto mb-2" />
          <p>You haven't signed up for any shifts yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {userShifts.map(shift => (
        <div
          key={shift.id}
          onClick={() => setViewingShift(shift)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              setViewingShift(shift);
            }
          }}
          className="bg-white rounded-lg shadow-sm p-4 flex items-center justify-between hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <div>
            <p className="text-sm font-medium text-gray-900">
              {format(new Date(shift.date), 'MMMM d, yyyy')}
            </p>
            {shift.hebrew_parasha && (
              <div className="mt-1">
                <p className="text-sm text-gray-500 font-hebrew" dir="rtl" lang="he">
                  {shift.hebrew_parasha}
                </p>
              </div>
            )}
            <p className="text-xs text-gray-500">
              {shift.type === 'early' ? '8:35 AM - 10:10 AM' : '10:20 AM - 12:00 PM'}
            </p>
          </div>
          <div className="flex items-center">
            <span className={`
              px-2 py-1 text-xs font-medium rounded-full
              ${shift.type === 'early' 
                ? 'bg-blue-50 text-blue-700' 
                : 'bg-purple-50 text-purple-700'}
            `}>
              {shift.type === 'early' ? 'Early' : 'Late'} Shift
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleWithdrawClick(shift);
              }}
              className="text-red-600 hover:text-red-700 p-2"
            >
              <LogOut className="h-5 w-5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setViewingShift(shift);
              }}
              className="text-gray-400 hover:text-gray-500 p-2"
            >
              <MessageCircle className="h-5 w-5" />
            </button>
          </div>
        </div>
      ))}
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