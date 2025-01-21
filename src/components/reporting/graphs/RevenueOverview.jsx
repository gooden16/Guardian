import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { date: '2023-12-01', revenue: 1200, expenses: 800 },
  { date: '2023-12-02', revenue: 1500, expenses: 900 },
  { date: '2023-12-03', revenue: 1800, expenses: 1000 },
  { date: '2023-12-04', revenue: 1600, expenses: 850 },
  { date: '2023-12-05', revenue: 2000, expenses: 1100 },
  { date: '2023-12-06', revenue: 2200, expenses: 1300 },
  { date: '2023-12-07', revenue: 2400, expenses: 1400 },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-dark-card p-3 border border-gray-100 dark:border-gray-800 rounded-lg shadow-lg">
        <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
        <div className="mt-1 space-y-1">
          <p className="text-sm">
            <span className="inline-block w-3 h-3 rounded-sm bg-primary mr-2"></span>
            Revenue: ${payload[0].value.toLocaleString()}
          </p>
          <p className="text-sm">
            <span className="inline-block w-3 h-3 rounded-sm bg-red-500 mr-2"></span>
            Expenses: ${payload[1].value.toLocaleString()}
          </p>
        </div>
      </div>
    );
  }
  return null;
};

export function RevenueOverview() {
  return (
    <div className="h-[400px] mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
              <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="expensesGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
          <XAxis 
            dataKey="date" 
            axisLine={false}
            tickLine={false}
            className="text-gray-600 dark:text-gray-400"
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tickFormatter={(value) => `$${value}`}
            className="text-gray-600 dark:text-gray-400"
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#4f46e5"
            fillOpacity={1}
            fill="url(#revenueGradient)"
          />
          <Area
            type="monotone"
            dataKey="expenses"
            stroke="#ef4444"
            fillOpacity={1}
            fill="url(#expensesGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}