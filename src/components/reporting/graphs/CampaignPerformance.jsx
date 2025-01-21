import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Email', sent: 15000, opened: 7500, clicked: 3000 },
  { name: 'Social', impressions: 25000, engagement: 5000, clicks: 2000 },
  { name: 'Display', impressions: 20000, engagement: 4000, clicks: 1500 },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-dark-card p-3 border border-gray-100 dark:border-gray-800 rounded-lg shadow-lg">
        <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm">
            <span className="inline-block w-3 h-3 rounded-sm mr-2" style={{ backgroundColor: entry.color }}></span>
            {entry.name}: {entry.value.toLocaleString()}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function CampaignPerformance() {
  return (
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
          <Bar dataKey="sent" name="Sent" fill="#4f46e5" radius={[4, 4, 0, 0]} />
          <Bar dataKey="opened" name="Opened" fill="#10b981" radius={[4, 4, 0, 0]} />
          <Bar dataKey="clicked" name="Clicked" fill="#f59e0b" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}