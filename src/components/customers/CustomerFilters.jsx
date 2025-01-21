import React from 'react';

export function CustomerFilters({ filters, onChange }) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="flex-1 min-w-[200px]">
        <input
          type="text"
          placeholder="Search customers..."
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-hover text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
      </div>
      
      <select
        value={filters.status}
        onChange={(e) => onChange({ ...filters, status: e.target.value })}
        className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-hover text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary"
      >
        <option value="all">All Status</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </select>
      
      <select
        value={filters.sortBy}
        onChange={(e) => onChange({ ...filters, sortBy: e.target.value })}
        className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-hover text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary"
      >
        <option value="name">Sort by Name</option>
        <option value="spent">Sort by Spent</option>
        <option value="lastOrder">Sort by Last Order</option>
      </select>
    </div>
  );
}