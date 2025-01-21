import React, { useState } from 'react';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { VolunteerFilters } from './VolunteerFilters';
import { VolunteerTable } from './VolunteerTable';
import { AddVolunteerModal } from './AddVolunteerModal';
import { TrainingLevel } from '../../models/Volunteer';

const initialVolunteers = [
  {
    id: '1',
    name: 'David Cohen',
    email: 'david@example.com',
    phone: '(555) 123-4567',
    trainingLevel: TrainingLevel.TEAM_LEADER,
    isActive: true,
    shiftsThisQuarter: 2,
    lastShift: '2023-12-15',
    availability: ['SUNDAY']
  },
  {
    id: '2',
    name: 'Sarah Levy',
    email: 'sarah@example.com',
    phone: '(555) 234-5678',
    trainingLevel: TrainingLevel.LEVEL_1,
    isActive: true,
    shiftsThisQuarter: 1,
    lastShift: '2023-12-08',
    availability: ['SUNDAY', 'SATURDAY']
  },
  {
    id: '3',
    name: 'Michael Stern',
    email: 'michael@example.com',
    phone: '(555) 345-6789',
    trainingLevel: TrainingLevel.LEVEL_2,
    isActive: true,
    shiftsThisQuarter: 2,
    lastShift: '2023-12-22',
    availability: ['SATURDAY']
  }
];

export function VolunteersPage() {
  const [volunteers, setVolunteers] = useState(initialVolunteers);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    trainingLevel: 'all',
    status: 'all'
  });

  const handleAddVolunteer = (newVolunteer) => {
    setVolunteers([...volunteers, { ...newVolunteer, id: crypto.randomUUID() }]);
  };

  const filteredVolunteers = volunteers.filter(volunteer => {
    if (filters.trainingLevel !== 'all' && volunteer.trainingLevel !== filters.trainingLevel) {
      return false;
    }
    if (filters.status !== 'all' && volunteer.isActive !== (filters.status === 'active')) {
      return false;
    }
    if (filters.search) {
      const search = filters.search.toLowerCase();
      return (
        volunteer.name.toLowerCase().includes(search) ||
        volunteer.email.toLowerCase().includes(search) ||
        volunteer.phone.includes(search)
      );
    }
    return true;
  });

  return (
    <main className="flex-1 min-w-0 overflow-auto">
      <div className="max-w-[1440px] mx-auto animate-fade-in">
        <div className="flex flex-wrap items-center justify-between gap-4 p-4">
          <h1 className="text-gray-900 dark:text-white text-2xl md:text-3xl font-bold">Volunteers</h1>
          <Button onClick={() => setIsAddModalOpen(true)}>
            Add Volunteer
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
          <Card className="p-6">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Team Leaders</h3>
            <p className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-semibold text-gray-900 dark:text-white">
                {volunteers.filter(v => v.trainingLevel === TrainingLevel.TEAM_LEADER && v.isActive).length}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">active</span>
            </p>
          </Card>
          
          <Card className="p-6">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Level 1 Volunteers</h3>
            <p className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-semibold text-gray-900 dark:text-white">
                {volunteers.filter(v => v.trainingLevel === TrainingLevel.LEVEL_1 && v.isActive).length}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">active</span>
            </p>
          </Card>
          
          <Card className="p-6">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Level 2 Volunteers</h3>
            <p className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-semibold text-gray-900 dark:text-white">
                {volunteers.filter(v => v.trainingLevel === TrainingLevel.LEVEL_2 && v.isActive).length}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">active</span>
            </p>
          </Card>
        </div>

        <div className="p-4">
          <Card>
            <CardHeader>
              <VolunteerFilters filters={filters} onChange={setFilters} />
            </CardHeader>
            <CardContent>
              <VolunteerTable volunteers={filteredVolunteers} />
            </CardContent>
          </Card>
        </div>
      </div>

      <AddVolunteerModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddVolunteer}
      />
    </main>
  );
}