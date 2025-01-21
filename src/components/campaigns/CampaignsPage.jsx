import React, { useState } from 'react';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { CampaignsList } from './CampaignsList';
import { CampaignModal } from './CampaignModal';
import { CampaignStats } from './CampaignStats';

const initialCampaigns = [
  {
    id: 1,
    name: 'Summer Sale 2023',
    status: 'active',
    type: 'email',
    audience: 'all-customers',
    startDate: '2023-12-01',
    endDate: '2023-12-31',
    budget: 5000,
    spent: 2500,
    metrics: {
      sent: 10000,
      opened: 4500,
      clicked: 2000,
      converted: 500
    }
  },
  {
    id: 2,
    name: 'New Product Launch',
    status: 'scheduled',
    type: 'social',
    audience: 'premium-customers',
    startDate: '2024-01-15',
    endDate: '2024-02-15',
    budget: 10000,
    spent: 0,
    metrics: {
      impressions: 0,
      engagement: 0,
      clicks: 0,
      conversions: 0
    }
  },
  {
    id: 3,
    name: 'Black Friday',
    status: 'completed',
    type: 'email',
    audience: 'all-customers',
    startDate: '2023-11-20',
    endDate: '2023-11-27',
    budget: 8000,
    spent: 8000,
    metrics: {
      sent: 15000,
      opened: 8000,
      clicked: 4000,
      converted: 1200
    }
  }
];

export function CampaignsPage() {
  const [campaigns, setCampaigns] = useState(initialCampaigns);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [filters, setFilters] = useState({
    status: 'all',
    type: 'all',
    search: ''
  });

  const handleCreateCampaign = (campaign) => {
    setCampaigns([...campaigns, { ...campaign, id: Date.now() }]);
  };

  const handleUpdateCampaign = (updatedCampaign) => {
    setCampaigns(campaigns.map(c => 
      c.id === updatedCampaign.id ? updatedCampaign : c
    ));
  };

  const handleDeleteCampaign = (id) => {
    setCampaigns(campaigns.filter(c => c.id !== id));
  };

  const filteredCampaigns = campaigns.filter(campaign => {
    if (filters.status !== 'all' && campaign.status !== filters.status) return false;
    if (filters.type !== 'all' && campaign.type !== filters.type) return false;
    if (filters.search && !campaign.name.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  });

  // Calculate total metrics
  const totalMetrics = campaigns.reduce((acc, campaign) => {
    if (campaign.type === 'email') {
      acc.emailsSent += campaign.metrics.sent || 0;
      acc.conversions += campaign.metrics.converted || 0;
    }
    acc.spent += campaign.spent || 0;
    return acc;
  }, { emailsSent: 0, conversions: 0, spent: 0 });

  return (
    <main className="flex-1 min-w-0 overflow-auto">
      <div className="max-w-[1440px] mx-auto animate-fade-in">
        <div className="flex flex-wrap items-center justify-between gap-4 p-4">
          <h1 className="text-gray-900 dark:text-white text-2xl md:text-3xl font-bold">Campaigns</h1>
          <Button onClick={() => {
            setSelectedCampaign(null);
            setIsModalOpen(true);
          }}>
            Create Campaign
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
          <CampaignStats
            title="Total Emails Sent"
            value={totalMetrics.emailsSent.toLocaleString()}
            trend="+12.5%"
            description="Compared to last month"
          />
          <CampaignStats
            title="Total Conversions"
            value={totalMetrics.conversions.toLocaleString()}
            trend="+8.2%"
            description="Compared to last month"
          />
          <CampaignStats
            title="Total Spent"
            value={`$${totalMetrics.spent.toLocaleString()}`}
            trend="+15.3%"
            description="Compared to last month"
          />
        </div>

        <div className="p-4">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center gap-4">
                <input
                  type="text"
                  placeholder="Search campaigns..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="flex-1 min-w-[200px] px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-hover text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-hover text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="completed">Completed</option>
                </select>
                <select
                  value={filters.type}
                  onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                  className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-hover text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="all">All Types</option>
                  <option value="email">Email</option>
                  <option value="social">Social</option>
                </select>
              </div>
            </CardHeader>
            <CardContent>
              <CampaignsList
                campaigns={filteredCampaigns}
                onEdit={(campaign) => {
                  setSelectedCampaign(campaign);
                  setIsModalOpen(true);
                }}
                onDelete={handleDeleteCampaign}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      <CampaignModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedCampaign(null);
        }}
        onSubmit={selectedCampaign ? handleUpdateCampaign : handleCreateCampaign}
        campaign={selectedCampaign}
      />
    </main>
  );
}