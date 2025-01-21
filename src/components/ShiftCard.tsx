import React from 'react';
import { Clock, Users, AlertCircle } from 'lucide-react';
import type { Shift } from '../types';
import { formatTime, formatDate } from '../utils/date';
import { logger } from '../utils/logger';

interface ShiftCardProps {
  shift: Shift;
  onSignUp?: () => void;
  onRequestCoverage?: () => void;
}

const ShiftCard: React.FC<ShiftCardProps> = ({ shift, onSignUp, onRequestCoverage }) => {
  const isFullyStaffed = 
    shift?.teamLeader && 
    shift?.l1Volunteers?.length === 2 && 
    shift?.l2Volunteer;

  if (!shift) {
    logger.error('ShiftCard rendered without shift data');
    return null;
  }

  const handleSignUp = () => {
    try {
      logger.info('User attempting to sign up for shift', { shiftId: shift.id });
      onSignUp?.();
    } catch (error) {
      logger.error('Error during shift sign-up', error);
    }
  };

  const handleRequestCoverage = () => {
    try {
      logger.info('User requesting coverage for shift', { shiftId: shift.id });
      onRequestCoverage?.();
    } catch (error) {
      logger.error('Error during coverage request', error);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">{formatDate(shift.date)}</h3>
          <div className="flex items-center text-gray-600 mt-1">
            <Clock className="w-4 h-4 mr-2" />
            <span>{formatTime(shift.startTime)} - {formatTime(shift.endTime)}</span>
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm ${
          shift.status === 'FILLED' 
            ? 'bg-green-100 text-green-800'
            : shift.status === 'NEEDS_COVERAGE'
            ? 'bg-red-100 text-red-800'
            : 'bg-blue-100 text-blue-800'
        }`}>
          {shift.status}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-start space-x-2">
          <Users className="w-5 h-5 text-gray-500 mt-1" />
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-700">Team Composition</p>
            <div className="mt-1 space-y-1">
              <p className="text-sm text-gray-600">
                Team Leader: {shift.teamLeader?.name || 'Needed'}
              </p>
              <p className="text-sm text-gray-600">
                L1 Volunteers ({shift.l1Volunteers.length}/2): 
                {shift.l1Volunteers.map(v => v.name).join(', ') || 'Needed'}
              </p>
              <p className="text-sm text-gray-600">
                L2 Volunteer: {shift.l2Volunteer?.name || 'Needed'}
              </p>
            </div>
          </div>
        </div>

        {shift.notes && (
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 text-gray-500 mt-1" />
            <div>
              <p className="text-sm font-medium text-gray-700">Notes</p>
              <p className="text-sm text-gray-600 mt-1">{shift.notes}</p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 flex space-x-4">
        {!isFullyStaffed && onSignUp && (
          <button
            onClick={handleSignUp}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 
                     transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Sign Up
          </button>
        )}
        {onRequestCoverage && (
          <button
            onClick={handleRequestCoverage}
            className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 
                     transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Request Coverage
          </button>
        )}
      </div>
    </div>
  );
};