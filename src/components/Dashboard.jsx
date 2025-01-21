import React from 'react';
import { StatCard } from './dashboard/StatCard';
import { ActivityFeed } from './dashboard/ActivityFeed';
import { TaskList } from './dashboard/TaskList';
import { RevenueChart } from './dashboard/graphs/RevenueChart';
import { CustomerChart } from './dashboard/graphs/CustomerChart';

export default function Dashboard() {
  return (
    <main className="flex-1 min-w-0 overflow-auto">
      <div className="max-w-[1440px] mx-auto animate-fade-in">
        <div className="flex flex-wrap justify-between gap-3 p-4">
          <h1 className="text-gray-900 dark:text-white text-2xl md:text-3xl font-bold">Dashboard</h1>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
          <StatCard title="Total revenue" value="$1,500" change="+5%" />
          <StatCard title="Active customers" value="20" change="+5%" />
          <StatCard title="New customers" value="5" change="+5%" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-4">
          {/* Main content - 2 columns */}
          <div className="lg:col-span-2 space-y-4">
            <RevenueChart />
            <CustomerChart />
          </div>
          
          {/* Sidebar - 1 column */}
          <div className="space-y-4">
            <TaskList />
            <ActivityFeed />
          </div>
        </div>
      </div>
    </main>
  );
}