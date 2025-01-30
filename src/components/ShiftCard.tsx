import React from 'react';
import { format } from 'date-fns';
import { Users } from 'lucide-react';
import type { Shift } from '../types/shift';

interface ShiftCardProps {
  userId: string;
  date: Date;
  parasha?: string;
  hebrewParasha?: string;
  earlyShift?: Shift;
  lateShift?: Shift;
  onSignUp: (type: 'early' | 'late') => void;
}

export function ShiftCard({ userId, date, parasha, hebrewParasha, earlyShift, lateShift, onSignUp }: ShiftCardProps) {
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
    return 'Sign Up';
  };

  const getButtonStyles = (shift?: Shift) => {
    if (!shift) return 'bg-gray-50 text-gray-400';
    if (isUserSignedUp(shift)) return 'bg-gray-100 text-gray-500 cursor-not-allowed';
    return getStatusColor(getShiftStatus(shift));
  };

  return (
    <div className="bg-white rounded-lg shadow-sm ring-1 ring-gray-900/5">
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-base font-semibold text-gray-900">
              {format(date, 'MMMM d, yyyy')}
            </h3>
            {parasha && (
              <div className="mt-1">
                <p className="text-sm text-gray-600">{parasha}</p>
                <p className="text-sm text-gray-500 font-hebrew" dir="rtl">{hebrewParasha}</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="px-4 py-3 space-y-3">
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
            onClick={() => onSignUp('early')}
            disabled={!earlyShift || getShiftStatus(earlyShift) === 'full' || isUserSignedUp(earlyShift)}
            className={`px-3 py-1 text-xs font-medium rounded-md ring-1 ring-inset
              ${getButtonStyles(earlyShift)}
              ${!earlyShift || getShiftStatus(earlyShift) === 'full' || isUserSignedUp(earlyShift) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}
          >
            {getButtonText(earlyShift)}
          </button>
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
            onClick={() => onSignUp('late')}
            disabled={!lateShift || getShiftStatus(lateShift) === 'full' || isUserSignedUp(lateShift)}
            className={`px-3 py-1 text-xs font-medium rounded-md ring-1 ring-inset
              ${getButtonStyles(lateShift)}
              ${!lateShift || getShiftStatus(lateShift) === 'full' || isUserSignedUp(lateShift) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}
          >
            {getButtonText(lateShift)}
          </button>
        </div>
      </div>
    </div>
  );
}