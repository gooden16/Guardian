import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const data = [
  { name: 'Electronics', value: 35000 },
  { name: 'Clothing', value: 25000 },
  { name: 'Home & Garden', value: 20000 },
  { name: 'Books', value: 15000 },
  { name: 'Sports', value: 12000 },
  { name: 'Beauty', value: 10000 },
];

const COLORS = [
  '#4f46e5',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-white dark:bg-dark-card p-3 border border-gray-100 dark:border-gray-800 rounded-lg shadow-lg">
        <p className="text-sm font-medium text-gray-900 dark:text-white">{data.name}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          ${data.value.toLocaleString()}
        </p>
      </div>
    );
  }
  return null;
};

const CustomLegend = ({ payload }) => (
  <div className="grid grid-cols-2 gap-2 mt-4">
    {payload.map((entry, index) => (
      <div key={index} className="flex items-center gap-2">
        <div 
          className="w-3 h-3 rounded-sm"
          style={{ backgroundColor: entry.color }}
        />
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {entry.value} (${data[index].value.toLocaleString()})
        </span>
      </div>
    ))}
  </div>
);

export function SalesBreakdown() {
  return (
    <div className="h-[400px] mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="45%"
            outerRadius={120}
            dataKey="value"
            labelLine={false}
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend content={<CustomLegend />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}