import React from 'react';
import { Card, CardHeader, CardContent } from '../../ui/Card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Jan', revenue: 1000 },
  { name: 'Feb', revenue: 1500 },
  { name: 'Mar', revenue: 1300 },
  { name: 'Apr', revenue: 1800 },
  { name: 'May', revenue: 2000 },
  { name: 'Jun', revenue: 1700 },
  { name: 'Jul', revenue: 2300 },
  { name: 'Aug', revenue: 2500 },
  { name: 'Sep', revenue: 2800 },
  { name: 'Oct', revenue: 3000 },
  { name: 'Nov', revenue: 2700 },
  { name: 'Dec', revenue: 3200 },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-dark-card p-3 border border-gray-100 dark:border-gray-800 rounded-lg shadow-lg">
        <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
        <p className="text-sm text-primary">
          ${payload[0].value.toLocaleString()}
        </p>
      </div>
    );
  }
  return null;
};

export function RevenueChart() {
  return (
    <Card>
      <CardHeader>
        <h2 className="text-gray-900 dark:text-white text-lg font-semibold">Revenue Overview</h2>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                </linearGradient>
              </defs>
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
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}