import React from 'react';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { NotionLogo, ShoppingCart, Bell, Eye } from '../Icons';

const ActivityItem = ({ icon: Icon, title, time }) => (
  <>
    <div className="flex flex-col items-center gap-1">
      <div className="activity-line h-2" />
      <div className="p-2 rounded-full bg-gray-50 dark:bg-dark-hover text-gray-700 dark:text-gray-300">
        <Icon />
      </div>
      <div className="activity-line grow" />
    </div>
    <div className="flex flex-1 flex-col py-3">
      <p className="text-gray-900 dark:text-white text-sm font-medium">{title}</p>
      <p className="text-gray-500 dark:text-gray-400 text-sm">{time}</p>
    </div>
  </>
);

export function ActivityFeed() {
  return (
    <Card>
      <CardHeader>
        <h2 className="text-gray-900 dark:text-white text-lg font-semibold">Recent activity</h2>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <div className="grid grid-cols-[40px_1fr] gap-x-2 min-w-[300px]">
          <ActivityItem icon={NotionLogo} title="David Jones created an account" time="5 minutes ago" />
          <ActivityItem icon={ShoppingCart} title="Bob Smith purchased a $100 item" time="1 hour ago" />
          <ActivityItem icon={ShoppingCart} title="Charlie Brown added an item to cart" time="2 hours ago" />
          <ActivityItem icon={Bell} title="Alice Freeman signed up for the newsletter" time="3 hours ago" />
          <ActivityItem icon={Eye} title="David Jones viewed a product" time="4 hours ago" />
        </div>
      </CardContent>
    </Card>
  );
}