import React from 'react';
import { Dialog } from '@headlessui/react';
import { format } from 'date-fns';
import { Card } from '../ui/Card';
import { TrainingLevel } from '../../models/Volunteer';

const DetailItem = ({ label, value }) => (
  <div className="space-y-1">
    <dt className="text-sm text-gray-500 dark:text-gray-400">{label}</dt>
    <dd className="text-sm font-medium text-gray-900 dark:text-white">{value}</dd>
  </div>
);

const ShiftHistory = () => (
  <div className="mt-6">
    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">Recent Shifts</h4>
    <div className="space-y-4">
      {[
        { date: '2023-12-20', time: 'Early', role: 'Team Leader' },
        { date: '2023-12-15', time: 'Late', role: 'Team Leader' },
        { date: '2023-12-10', time: 'Early', role: 'Team Leader' },
      ].map((shift, index) => (
        <div 
          key={index}
          className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-dark-hover"
        >
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {format(new Date(shift.date), 'MMMM d, yyyy')}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {shift.time} Shift
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-primary font-medium">
              {shift.role}
            </p>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const ActivityLog = () => (
  <div className="mt-6">
    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">Recent Activity</h4>
    <div className="space-y-4">
      {[
        { action: 'Completed shift', time: '2 days ago' },
        { action: 'Updated contact information', time: '1 week ago' },
        { action: 'Completed training', time: '2 weeks ago' },
      ].map((activity, index) => (
        <div 
          key={index}
          className="flex items-center justify-between py-2"
        >
          <p className="text-sm text-gray-900 dark:text-white">{activity.action}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{activity.time}</p>
        </div>
      ))}
    </div>
  </div>
);

const trainingLevelLabels = {
  [TrainingLevel.TEAM_LEADER]: 'Team Leader',
  [TrainingLevel.LEVEL_1]: 'Level 1',
  [TrainingLevel.LEVEL_2]: 'Level 2'
};

export function VolunteerDetailsModal({ volunteer, onClose }) {
  if (!volunteer) return null;

  return (
    <Dialog
      open={true}
      onClose={onClose}
      className="relative z-50"
    >
      <div className="fixed inset-0 bg-black/20 dark:bg-black/40" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-2xl">
          <Card>
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
              <div>
                <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white">
                  {volunteer.name}
                </Dialog.Title>
                <p className="text-sm text-gray-500 dark:text-gray-400">{volunteer.email}</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Volunteer Details */}
              <div className="grid grid-cols-2 gap-6">
                <DetailItem 
                  label="Training Level" 
                  value={trainingLevelLabels[volunteer.trainingLevel]}
                />
                <DetailItem 
                  label="Status" 
                  value={
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      volunteer.isActive
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      {volunteer.isActive ? 'Active' : 'Inactive'}
                    </span>
                  }
                />
                <DetailItem 
                  label="Phone" 
                  value={volunteer.phone}
                />
                <DetailItem 
                  label="Shifts This Quarter" 
                  value={`${volunteer.shiftsThisQuarter} shifts`}
                />
                <DetailItem 
                  label="Last Shift" 
                  value={volunteer.lastShift ? format(new Date(volunteer.lastShift), 'MMMM d, yyyy') : 'No shifts yet'}
                />
                <DetailItem 
                  label="Availability" 
                  value={volunteer.availability.map(day => 
                    day.charAt(0) + day.slice(1).toLowerCase()
                  ).join(', ')}
                />
              </div>

              {/* Shift History */}
              <ShiftHistory />

              {/* Activity Log */}
              <ActivityLog />
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100 dark:border-gray-800">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-dark-hover rounded-lg transition-colors"
              >
                Close
              </button>
              <button
                className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-light rounded-lg transition-colors"
              >
                Edit Volunteer
              </button>
            </div>
          </Card>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
