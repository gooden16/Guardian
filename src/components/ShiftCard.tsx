import React, { useState } from 'react';
import { format } from 'date-fns';
import { Users, MessageCircle } from 'lucide-react';
import { ShiftView } from './ShiftView';
import type { Shift } from '../types/shift';

interface ShiftCardProps {
  userId: string;
  userRole?: string;
  date: Date;
  earlyShift?: Shift;
  lateShift?: Shift;
  onSignUp: (type: 'early' | 'late', otherType?: 'early' | 'late') => void;
}

export function ShiftCard({ userId, userRole, date, earlyShift, lateShift, onSignUp }: ShiftCardProps) {
  const [viewingShift, setViewingShift] = useState<Shift | null>(null);
  const isAdmin = (userRole || '').toLowerCase() === 'admin';
  const isTeamLeader = userRole === 'TL';

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

  return (
    <div className="bg-white rounded-lg shadow-sm ring-1 ring-gray-900/5 h-full flex flex-col">
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-base font-semibold text-gray-900">
              {format(date, 'MMMM d, yyyy')}
            </h3>
            {earlyShift?.hebrew_parasha && (
              <div className="mt-1">
                <p className="text-sm text-gray-600 font-hebrew" dir="rtl" lang="he">
                  {earlyShift.hebrew_parasha}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="px-4 py-3 space-y-3 flex-1">
        {userRole === 'TL' ? (
          <div className="space-y-4">
            <div className="space-y-3">
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
          <>
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
                onClick={() => onSignUp('early')}
                disabled={!canSignUp(earlyShift)}
                className={`px-3 py-1 text-xs font-medium rounded-md ring-1 ring-inset
                  ${getButtonStyles(earlyShift)}
                  ${!canSignUp(earlyShift) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}
              >
                {getButtonText(earlyShift)}
              </button>
              {earlyShift && (
                <button
                  onClick={() => setViewingShift(earlyShift)}
                  className="ml-2 text-gray-400 hover:text-gray-500"
                >
                  <MessageCircle className="h-5 w-5" />
                </button>
              )}
            </div>

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
                onClick={() => onSignUp('late')}
                disabled={!canSignUp(lateShift)}
                className={`px-3 py-1 text-xs font-medium rounded-md ring-1 ring-inset
                  ${getButtonStyles(lateShift)}
                  ${!canSignUp(lateShift) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}
              >
                {getButtonText(lateShift)}
              </button>
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
    </div>
  );
}
