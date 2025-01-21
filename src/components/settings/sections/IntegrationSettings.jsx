import React from 'react';
import { Card, CardHeader, CardContent } from '../../ui/Card';
import { Button } from '../../ui/Button';

const integrations = [
  {
    id: 'hubspot',
    name: 'HubSpot',
    description: 'Sync contacts, deals, and marketing campaigns',
    connected: true,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 256 256">
        <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm48-88a8,8,0,0,1-8,8H136v32a8,8,0,0,1-16,0V136H88a8,8,0,0,1,0-16h32V88a8,8,0,0,1,16,0v32h32A8,8,0,0,1,176,128Z" />
      </svg>
    )
  },
  {
    id: 'salesforce',
    name: 'Salesforce',
    description: 'Bi-directional sync of customer data and opportunities',
    connected: false,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 256 256">
        <path d="M224,115.55V208a16,16,0,0,1-16,16H168a16,16,0,0,1-16-16V168a8,8,0,0,0-8-8H112a8,8,0,0,0-8,8v40a16,16,0,0,1-16,16H48a16,16,0,0,1-16-16V115.55a16,16,0,0,1,5.17-11.78l80-75.48.11-.11a16,16,0,0,1,21.53,0,1.14,1.14,0,0,0,.11.11l80,75.48A16,16,0,0,1,224,115.55Z" />
      </svg>
    )
  },
  {
    id: 'mailchimp',
    name: 'Mailchimp',
    description: 'Email marketing automation and customer segmentation',
    connected: true,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 256 256">
        <path d="M224,48H32A16,16,0,0,0,16,64V192a16,16,0,0,0,16,16H224a16,16,0,0,0,16-16V64A16,16,0,0,0,224,48Zm0,144H32V64H224V192ZM180,128a12,12,0,1,1-12-12A12,12,0,0,1,180,128ZM76,128a12,12,0,1,1,12,12A12,12,0,0,1,76,128Z" />
      </svg>
    )
  },
  {
    id: 'zendesk',
    name: 'Zendesk',
    description: 'Customer support ticket integration and tracking',
    connected: false,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 256 256">
        <path d="M216,48H40A16,16,0,0,0,24,64V224a15.85,15.85,0,0,0,9.24,14.5A16.13,16.13,0,0,0,40,240a15.89,15.89,0,0,0,10.25-3.78.69.69,0,0,0,.13-.11L82.5,208H216a16,16,0,0,0,16-16V64A16,16,0,0,0,216,48ZM40,224h0ZM216,192H82.5a16,16,0,0,0-10.3,3.75l-.12.11L40,224V64H216Z" />
      </svg>
    )
  },
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'Payment processing and subscription management',
    connected: true,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 256 256">
        <path d="M224,48H32A16,16,0,0,0,16,64V192a16,16,0,0,0,16,16H224a16,16,0,0,0,16-16V64A16,16,0,0,0,224,48Zm0,144H32V64H224V192ZM64,104a8,8,0,0,1,8-8H96a8,8,0,0,1,0,16H72A8,8,0,0,1,64,104Zm128,48a8,8,0,0,1-8,8H72a8,8,0,0,1,0-16H184A8,8,0,0,1,192,152Z" />
      </svg>
    )
  },
  {
    id: 'zapier',
    name: 'Zapier',
    description: 'Automate workflows with 3000+ apps',
    connected: false,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 256 256">
        <path d="M208,32H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V48A16,16,0,0,0,208,32ZM48,208V48H208V208Z" />
      </svg>
    )
  }
];

export function IntegrationSettings() {
  return (
    <Card>
      <CardHeader>
        <h2 className="text-gray-900 dark:text-white text-lg font-semibold">Integrations</h2>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {integrations.map((integration) => (
            <div
              key={integration.id}
              className="flex items-center justify-between p-4 rounded-lg border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-dark-hover transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-lg bg-gray-100 dark:bg-dark-hover text-gray-500 dark:text-gray-400">
                  {integration.icon}
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">{integration.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{integration.description}</p>
                </div>
              </div>
              <Button variant={integration.connected ? 'secondary' : 'primary'}>
                {integration.connected ? 'Disconnect' : 'Connect'}
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}