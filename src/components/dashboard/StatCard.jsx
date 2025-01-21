import React from 'react';
import { Card } from '../ui/Card';

export function StatCard({ title, value, change }) {
  return (
    <Card className="flex flex-col gap-2 p-6 hover:shadow-md transition-shadow duration-200">
      <p className="text-gray-600 dark:text-gray-300 text-sm font-medium">{title}</p>
      <p className="text-gray-900 dark:text-white text-2xl font-bold">{value}</p>
      <p className="text-emerald-600 dark:text-emerald-400 text-sm font-medium">{change}</p>
    </Card>
  );
}