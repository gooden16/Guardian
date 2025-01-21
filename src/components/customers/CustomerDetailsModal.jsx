import React from 'react';
import { Dialog } from '@headlessui/react';
import { format } from 'date-fns';
import { Card } from '../ui/Card';

const DetailItem = ({ label, value }) => (
  <div className="space-y-1">
    <dt className="text-sm text-gray-500 dark:text-gray-400">{label}</dt>
    <dd className="text-sm font-medium text-gray-900 dark:text-white">{value}</dd>
  </div>
);

const OrderHistory = () => (
  <div className="mt-6">
    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">Recent Orders</h4>
    <div className="space-y-4">
      {[
        { id: 1, date: '2023-12-20', amount: 350, status: 'completed' },
        { id: 2, date: '2023-12-15', amount: 220, status: 'completed' },
        { id: 3, date: '2023-12-10', amount: 180, status: 'completed' },
      ].map((order) => (
        <div 
          key={order.id}
          className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-dark-hover"
        >
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              Order #{order.id}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {format(new Date(order.date), 'MMM d, yyyy')}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              ${order.amount}
            </p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 capitalize">
              {order.status}
            </p>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const ActivityLog = () => (
  <div className="mt-6">
    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">Recent Activity</h4>
    <div className="space-y-4">
      {[
        { action: 'Viewed product X', time: '2 hours ago' },
        { action: 'Updated shipping address', time: '1 day ago' },
        { action: 'Contacted support', time: '3 days ago' },
      ].map((activity, index) => (
        <div 
          key={index}
          className="flex items-center justify-between py-2"
        >
          <p className="text-sm text-gray-900 dark:text-white">{activity.action}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{activity.time}</p>
        </div>
      ))}
    </div>
  </div>
);

export function CustomerDetailsModal({ customer, onClose }) {
  if (!customer) return null;

  return (
    <Dialog
      open={true}
      onClose={onClose}
      className="relative z-50"
    >
      <div className="fixed inset-0 bg-black/20 dark:bg-black/40" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-2xl">
          <Card>
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-4">
                <img
                  src={customer.avatar}
                  alt={customer.name}
                  className="w-12 h-12 rounded-full"
                />
                <div>
                  <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white">
                    {customer.name}
                  </Dialog.Title>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{customer.email}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Customer Details */}
              <div className="grid grid-cols-2 gap-6">
                <DetailItem 
                  label="Status" 
                  value={
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      customer.status === 'active'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      {customer.status}
                    </span>
                  }
                />
                <DetailItem 
                  label="Total Spent" 
                  value={`$${customer.spent.toLocaleString()}`}
                />
                <DetailItem 
                  label="Last Order" 
                  value={format(new Date(customer.lastOrder), 'MMM d, yyyy')}
                />
                <DetailItem 
                  label="Customer Since" 
                  value={format(new Date('2023-01-15'), 'MMM d, yyyy')}
                />
              </div>

              {/* Order History */}
              <OrderHistory />

              {/* Activity Log */}
              <ActivityLog />
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100 dark:border-gray-800">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-dark-hover rounded-lg transition-colors"
              >
                Close
              </button>
              <button
                className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-light rounded-lg transition-colors"
              >
                Edit Customer
              </button>
            </div>
          </Card>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}