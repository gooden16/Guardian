import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { VolunteerFilters } from './VolunteerFilters';
import { VolunteerTable } from './VolunteerTable';
import { AddVolunteerModal } from './AddVolunteerModal';
import { TrainingLevel } from '../../models/Volunteer';
import { getVolunteers } from '../../lib/database';
import toast from 'react-hot-toast';

export function VolunteersPage() {
  const [volunteers, setVolunteers] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    trainingLevel: 'all',
    status: 'all'
  });

  useEffect(() => {
    loadVolunteers();
  }, []);

  const loadVolunteers = async () => {
    try {
      const data = await getVolunteers();
      setVolunteers(data);
    } catch (error) {
      console.error('Error loading volunteers:', error);
      toast.error('Failed to load volunteers');
    } finally {
      setLoading(false);
    }
  };

  const handleAddVolunteer = (newVolunteer) => {
    setVolunteers([...volunteers, { ...newVolunteer, id: crypto.randomUUID() }]);
  };

  const filteredVolunteers = volunteers.filter(volunteer => {
    if (filters.trainingLevel !== 'all' && volunteer.training_level !== filters.trainingLevel) {
      return false;
    }
    if (filters.status !== 'all' && volunteer.is_active !== (filters.status === 'active')) {
      return false;
    }
    if (filters.search) {
      const search = filters.search.toLowerCase();
      return (
        volunteer.name.toLowerCase().includes(search) ||
        volunteer.email.toLowerCase().includes(search) ||
        volunteer.phone?.includes(search)
      );
    }
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
      </div>
    );
  }

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
                {volunteers.filter(v => v.training_level === TrainingLevel.TEAM_LEADER && v.is_active).length}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">active</span>
            </p>
          </Card>
          
          <Card className="p-6">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Level 1 Volunteers</h3>
            <p className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-semibold text-gray-900 dark:text-white">
                {volunteers.filter(v => v.training_level === TrainingLevel.LEVEL_1 && v.is_active).length}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">active</span>
            </p>
          </Card>
          
          <Card className="p-6">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Level 2 Volunteers</h3>
            <p className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-semibold text-gray-900 dark:text-white">
                {volunteers.filter(v => v.training_level === TrainingLevel.LEVEL_2 && v.is_active).length}
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
