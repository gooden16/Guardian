import { useState } from 'react';
import { format } from 'date-fns';
import clsx from 'clsx';
import { VolunteerDetailsModal } from './VolunteerDetailsModal';
import { TrainingLevel } from '../../models/Volunteer';

const TrainingLevelBadge = ({ level }) => {
  const colors = {
    [TrainingLevel.TEAM_LEADER]: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    [TrainingLevel.LEVEL_1]: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    [TrainingLevel.LEVEL_2]: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
  };

  const labels = {
    [TrainingLevel.TEAM_LEADER]: 'Team Leader',
    [TrainingLevel.LEVEL_1]: 'Level 1',
    [TrainingLevel.LEVEL_2]: 'Level 2'
  };

  return (
    <span className={clsx(
      'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
      colors[level]
    )}>
      {labels[level]}
    </span>
  );
};

export function VolunteerTable({ volunteers }) {
  const [selectedVolunteer, setSelectedVolunteer] = useState(null);

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-800">
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Volunteer</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Training Level</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Status</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Shifts This Quarter</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Last Shift</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody>
            {volunteers.map((volunteer) => (
              <tr 
                key={volunteer.id}
                className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-dark-hover transition-colors"
              >
                <td className="py-3 px-4">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{volunteer.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{volunteer.email}</p>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <TrainingLevelBadge level={volunteer.trainingLevel} />
                </td>
                <td className="py-3 px-4">
                  <span className={clsx(
                    'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                    volunteer.isActive
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                  )}>
                    {volunteer.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <p className="text-sm text-gray-900 dark:text-white">
                    {volunteer.shiftsThisQuarter} shifts
                  </p>
                </td>
                <td className="py-3 px-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {volunteer.lastShift ? format(new Date(volunteer.lastShift), 'MMM d, yyyy') : 'No shifts yet'}
                  </p>
                </td>
                <td className="py-3 px-4 text-right">
                  <button 
                    onClick={() => setSelectedVolunteer(volunteer)}
                    className="text-primary hover:text-primary-light text-sm font-medium"
                  >
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedVolunteer && (
        <VolunteerDetailsModal
          volunteer={selectedVolunteer}
          onClose={() => setSelectedVolunteer(null)}
        />
      )}
    </>
  );
}
