import React from 'react';
import { Card, CardHeader, CardContent } from '../../ui/Card';
import { Button } from '../../ui/Button';

const plans = [
  {
    name: 'Basic',
    price: '$29',
    period: 'month',
    features: [
      'Up to 1,000 customers',
      'Basic analytics',
      'Email support',
      '5 team members'
    ],
    current: true
  },
  {
    name: 'Pro',
    price: '$79',
    period: 'month',
    features: [
      'Up to 10,000 customers',
      'Advanced analytics',
      'Priority support',
      'Unlimited team members'
    ],
    current: false
  },
  {
    name: 'Enterprise',
    price: '$199',
    period: 'month',
    features: [
      'Unlimited customers',
      'Custom analytics',
      '24/7 support',
      'Custom features'
    ],
    current: false
  }
];

export function BillingSettings() {
  return (
    <Card>
      <CardHeader>
        <h2 className="text-gray-900 dark:text-white text-lg font-semibold">Billing & Plans</h2>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-lg border ${
                plan.current
                  ? 'border-primary'
                  : 'border-gray-100 dark:border-gray-800'
              } p-6`}
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{plan.name}</h3>
              <div className="mt-2">
                <span className="text-3xl font-bold text-gray-900 dark:text-white">{plan.price}</span>
                <span className="text-gray-500 dark:text-gray-400">/{plan.period}</span>
              </div>
              <ul className="mt-6 space-y-4">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256" className="text-primary">
                      <path d="M229.66,77.66l-128,128a8,8,0,0,1-11.32,0l-56-56a8,8,0,0,1,11.32-11.32L96,188.69,218.34,66.34a8,8,0,0,1,11.32,11.32Z" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
              <div className="mt-6">
                <Button
                  variant={plan.current ? 'secondary' : 'primary'}
                  className="w-full"
                >
                  {plan.current ? 'Current Plan' : 'Upgrade'}
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 border-t border-gray-100 dark:border-gray-800 pt-6">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">Payment Method</h3>
          <div className="flex items-center justify-between p-4 rounded-lg border border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gray-100 dark:bg-dark-hover">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 256 256">
                  <path d="M224,48H32A16,16,0,0,0,16,64V192a16,16,0,0,0,16,16H224a16,16,0,0,0,16-16V64A16,16,0,0,0,224,48Zm0,144H32V64H224V192ZM64,104a8,8,0,0,1,8-8H96a8,8,0,0,1,0,16H72A8,8,0,0,1,64,104Zm128,48a8,8,0,0,1-8,8H72a8,8,0,0,1,0-16H184A8,8,0,0,1,192,152Z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Visa ending in 4242</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Expires 12/24</p>
              </div>
            </div>
            <Button variant="secondary">Update</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}