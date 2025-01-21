import React, { useState } from 'react';
import { BarChart, PieChart, Calendar, Users, Clock } from 'lucide-react';

export default function Reports() {
  const [dateRange, setDateRange] = useState('quarter');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Reports</h1>
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="quarter">This Quarter</option>
          <option value="year">This Year</option>
          <option value="custom">Custom Range</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="font-medium">Volunteer Participation</h3>
          </div>
          <div className="text-3xl font-semibold mb-2">85%</div>
          <p className="text-sm text-gray-600">
            Active volunteers meeting quarterly requirements
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 bg-green-100 text-green-600 rounded-lg">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="font-medium">Total Hours</h3>
          </div>
          <div className="text-3xl font-semibold mb-2">524</div>
          <p className="text-sm text-gray-600">
            Volunteer hours completed this quarter
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 bg-purple-100 text-purple-600 rounded-lg">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="font-medium">Shift Coverage</h3>
          </div>
          <div className="text-3xl font-semibold mb-2">98%</div>
          <p className="text-sm text-gray-600">
            Shifts fully staffed this quarter
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="font-medium mb-6">Volunteer Distribution by Role</h3>
          <div className="h-64 flex items-center justify-center text-gray-400">
            Chart placeholder - Role distribution
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="font-medium mb-6">Monthly Shift Coverage Trend</h3>
          <div className="h-64 flex items-center justify-center text-gray-400">
            Chart placeholder - Coverage trend
          </div>
        </div>
      </div>
    </div>
  );
}