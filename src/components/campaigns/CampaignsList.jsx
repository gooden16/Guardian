import React from 'react';
import { format } from 'date-fns';
import { Menu } from '@headlessui/react';
import clsx from 'clsx';

export function CampaignsList({ campaigns, onEdit, onDelete }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[800px]">
        <thead>
          <tr className="border-b border-gray-100 dark:border-gray-800">
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Campaign</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Type</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Status</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Progress</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Dates</th>
            <th className="text-right py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Actions</th>
          </tr>
        </thead>
        <tbody>
          {campaigns.map((campaign) => (
            <tr 
              key={campaign.id}
              className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-dark-hover transition-colors"
            >
              <td className="py-3 px-4">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{campaign.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Budget: ${campaign.budget.toLocaleString()}</p>
              </td>
              <td className="py-3 px-4">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                  {campaign.type}
                </span>
              </td>
              <td className="py-3 px-4">
                <span className={clsx(
                  'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                  {
                    'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400': campaign.status === 'active',
                    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400': campaign.status === 'scheduled',
                    'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300': campaign.status === 'completed'
                  }
                )}>
                  {campaign.status}
                </span>
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${(campaign.spent / campaign.budget) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {Math.round((campaign.spent / campaign.budget) * 100)}%
                  </span>
                </div>
              </td>
              <td className="py-3 px-4">
                <p className="text-sm text-gray-900 dark:text-white">
                  {format(new Date(campaign.startDate), 'MMM d, yyyy')}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {format(new Date(campaign.endDate), 'MMM d, yyyy')}
                </p>
              </td>
              <td className="py-3 px-4 text-right">
                <Menu as="div" className="relative inline-block text-left">
                  <Menu.Button className="p-2 hover:bg-gray-100 dark:hover:bg-dark-hover rounded-lg transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256">
                      <path d="M112,60a16,16,0,1,1,16,16A16,16,0,0,1,112,60Zm16,52a16,16,0,1,0,16,16A16,16,0,0,0,128,112Zm0,68a16,16,0,1,0,16,16A16,16,0,0,0,128,180Z" />
                    </svg>
                  </Menu.Button>

                  <Menu.Items className="absolute right-0 mt-2 w-48 bg-white dark:bg-dark-card rounded-lg shadow-lg border border-gray-100 dark:border-gray-800 focus:outline-none">
                    <div className="p-1">
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            onClick={() => onEdit(campaign)}
                            className={clsx(
                              'flex w-full items-center px-3 py-2 text-sm rounded-md',
                              active ? 'bg-gray-100 dark:bg-dark-hover' : ''
                            )}
                          >
                            Edit Campaign
                          </button>
                        )}
                      </Menu.Item>
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            onClick={() => onDelete(campaign.id)}
                            className={clsx(
                              'flex w-full items-center px-3 py-2 text-sm rounded-md text-red-600 dark:text-red-400',
                              active ? 'bg-gray-100 dark:bg-dark-hover' : ''
                            )}
                          >
                            Delete Campaign
                          </button>
                        )}
                      </Menu.Item>
                    </div>
                  </Menu.Items>
                </Menu>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}