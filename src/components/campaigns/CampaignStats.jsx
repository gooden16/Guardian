import React from 'react';
import { Card } from '../ui/Card';
import clsx from 'clsx';

export function CampaignStats({ title, value, trend, description }) {
  const isPositive = trend.startsWith('+');

  return (
    <Card className="p-6">
      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</h3>
      <p className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl font-semibold text-gray-900 dark:text-white">{value}</span>
        <span className={clsx(
          'text-sm font-medium',
          isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
        )}>
          {trend}
        </span>
      </p>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>
    </Card>
  );
}