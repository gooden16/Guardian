import React from 'react';
import { Card, CardHeader, CardContent } from '../../ui/Card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Mon', new: 4, returning: 8 },
  { name: 'Tue', new: 3, returning: 10 },
  { name: 'Wed', new: 5, returning: 7 },
  { name: 'Thu', new: 6, returning: 9 },
  { name: 'Fri', new: 8, returning: 11 },
  { name: 'Sat', new: 7, returning: 12 },
  { name: 'Sun', new: 4, returning: 6 },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-dark-card p-3 border border-gray-100 dark:border-gray-800 rounded-lg shadow-lg">
        <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
        <div className="mt-1">
          <p className="text-sm">
            <span className="inline-block w-3 h-3 rounded-sm bg-primary mr-2"></span>
            New: {payload[0].value}
          </p>
          <p className="text-sm">
            <span className="inline-block w-3 h-3 rounded-sm bg-emerald-500 mr-2"></span>
            Returning: {payload[1].value}
          </p>
        </div>
      </div>
    );
  }
  return null;
};

export function CustomerChart() {
  return (
    <Card>
      <CardHeader>
        <h2 className="text-gray-900 dark:text-white text-lg font-semibold">Customer Activity</h2>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
              <XAxis 
                dataKey="name" 
                axisLine={false}
                tickLine={false}
                className="text-gray-600 dark:text-gray-400"
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                className="text-gray-600 dark:text-gray-400"
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="new" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              <Bar dataKey="returning" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}