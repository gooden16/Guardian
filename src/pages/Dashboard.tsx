import React from 'react';
import { Calendar, Users, Award } from 'lucide-react';

const Dashboard = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Welcome Back</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Upcoming Shifts */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Upcoming Shifts</h3>
            <Calendar className="h-5 w-5 text-blue-600" />
          </div>
          <div className="space-y-3">
            {/* Placeholder for upcoming shifts */}
            <p className="text-gray-500">No upcoming shifts</p>
          </div>
        </div>

        {/* Progress Tracker */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Quarterly Progress</h3>
            <Users className="h-5 w-5 text-blue-600" />
          </div>
          <div className="space-y-3">
            <div className="relative pt-1">
              <div className="flex mb-2 items-center justify-between">
                <div>
                  <span className="text-xs font-semibold inline-block text-blue-600">
                    0/3 Shifts Completed
                  </span>
                </div>
              </div>
              <div className="flex h-2 mb-4 overflow-hidden bg-blue-100 rounded">
                <div className="w-0 bg-blue-500"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Top Volunteers</h3>
            <Award className="h-5 w-5 text-blue-600" />
          </div>
          <div className="space-y-3">
            {/* Placeholder for leaderboard */}
            <p className="text-gray-500">Loading leaderboard...</p>
          </div>
        </div>
      </div>

      {/* Suggested Shifts */}
      <div className="bg-white p-6 rounded-lg shadow-sm mt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Suggested Shifts</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Placeholder for suggested shifts */}
          <p className="text-gray-500">No suggested shifts available</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;