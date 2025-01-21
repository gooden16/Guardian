import React from 'react';
import { Menu } from '@headlessui/react';
import clsx from 'clsx';

const ranges = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: 'ytd', label: 'Year to date' },
  { value: '12m', label: 'Last 12 months' },
];

export function DateRangePicker({ value, onChange }) {
  const selectedRange = ranges.find(range => range.value === value);

  return (
    <Menu as="div" className="relative">
      <Menu.Button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-hover text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-dark-card transition-colors">
        <span>{selectedRange?.label}</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256">
          <path d="M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z" />
        </svg>
      </Menu.Button>

      <Menu.Items className="absolute right-0 mt-1 w-48 bg-white dark:bg-dark-card rounded-lg shadow-lg border border-gray-100 dark:border-gray-800 focus:outline-none">
        <div className="p-1">
          {ranges.map((range) => (
            <Menu.Item key={range.value}>
              {({ active }) => (
                <button
                  onClick={() => onChange(range.value)}
                  className={clsx(
                    'flex w-full items-center px-3 py-2 text-sm rounded-md',
                    active ? 'bg-gray-50 dark:bg-dark-hover' : '',
                    value === range.value ? 'text-primary font-medium' : 'text-gray-700 dark:text-gray-200'
                  )}
                >
                  {range.label}
                </button>
              )}
            </Menu.Item>
          ))}
        </div>
      </Menu.Items>
    </Menu>
  );
}