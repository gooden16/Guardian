import React from 'react';
import { Calendar, Users, Clock } from 'lucide-react';

const stats = [
  {
    icon: Calendar,
    label: 'Open Shifts',
    value: '12',
    change: '+2',
    changeType: 'increase',
  },
  {
    icon: Users,
    label: 'Active Volunteers',
    value: '48',
    change: '+5',
    changeType: 'increase',
  },
  {
    icon: Clock,
    label: 'Hours Covered',
    value: '284',
    change: '+24',
    changeType: 'increase',
  },
];

const upcomingShifts = [
  {
    date: '2024-03-23',
    time: '8:35 AM - 10:20 AM',
    type: 'EARLY',
    status: 'NEEDS_TL',
  },
  {
    date: '2024-03-23',
    time: '10:10 AM - 12:00 PM',
    type: 'LATE',
    status: 'NEEDS_L2',
  },
  {
    date: '2024-03-30',
    time: '8:35 AM - 10:20 AM',
    type: 'EARLY',
    status: 'FILLED',
  },
];

export default function Dashboard() {
  return (
    <div className="flex-1 space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map(({ icon: Icon, label, value, change, changeType }) => (
          <div
            key={label}
            className="bg-white rounded-lg shadow-sm p-6 flex items-center space-x-4"
          >
            <div
              className={`p-3 rounded-lg ${
                label === 'Open Shifts'
                  ? 'bg-red-100 text-red-600'
                  : label === 'Active Volunteers'
                  ? 'bg-green-100 text-green-600'
                  : 'bg-blue-100 text-blue-600'
              }`}
            >
              <Icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-600">{label}</p>
              <div className="flex items-baseline space-x-2">
                <h3 className="text-2xl font-semibold">{value}</h3>
                <span
                  className={`text-sm ${
                    changeType === 'increase'
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}
                >
                  {change}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Upcoming Shifts */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">Upcoming Shifts</h2>
          <button className="text-blue-600 hover:text-blue-700 font-medium">
            View All
          </button>
        </div>
        <div className="space-y-4">
          {upcomingShifts.map((shift) => (
            <div
              key={`${shift.date}-${shift.time}`}
              className="flex items-center justify-between p-4 rounded-lg border border-gray-100 hover:border-blue-100 hover:bg-blue-50 transition-colors"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium">{shift.time}</h3>
                  <p className="text-sm text-gray-600">
                    {new Date(shift.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <span
                  className={`px-3 py-1 rounded-full text-sm ${
                    shift.status === 'FILLED'
                      ? 'bg-green-100 text-green-600'
                      : 'bg-yellow-100 text-yellow-600'
                  }`}
                >
                  {shift.status === 'FILLED'
                    ? 'Filled'
                    : `Needs ${shift.status.split('_')[1]}`}
                </span>
                <button className="text-blue-600 hover:text-blue-700 font-medium">
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}