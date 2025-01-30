import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUserProfile } from '../lib/profiles';
import { RoleChangeRequests } from '../components/admin/RoleChangeRequests';
import { VolunteerManagement } from '../components/admin/VolunteerManagement';
import { ShiftManagement } from '../components/admin/ShiftManagement';
import { Users, CalendarDays, ArrowUpRight } from 'lucide-react';

export function Admin() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<'volunteers' | 'shifts' | 'roles'>('volunteers');

  useEffect(() => {
    async function checkAdmin() {
      if (user) {
        const profile = await getUserProfile(user.id);
        setIsAdmin(profile?.is_admin ?? false);
      }
    }
    checkAdmin();
  }, [user]);

  if (isAdmin === null) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900 pb-4">Admin Dashboard</h1>
        </div>
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('volunteers')}
            className={`
              flex items-center whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
              ${activeTab === 'volunteers'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
            `}
          >
            <Users className="h-5 w-5 mr-2" />
            Volunteers
          </button>
          <button
            onClick={() => setActiveTab('shifts')}
            className={`
              flex items-center whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
              ${activeTab === 'shifts'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
            `}
          >
            <CalendarDays className="h-5 w-5 mr-2" />
            Shifts
          </button>
          <button
            onClick={() => setActiveTab('roles')}
            className={`
              flex items-center whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
              ${activeTab === 'roles'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
            `}
          >
            <ArrowUpRight className="h-5 w-5 mr-2" />
            Role Requests
          </button>
        </nav>
      </div>

      <div className="mt-6">
        {activeTab === 'volunteers' && <VolunteerManagement />}
        {activeTab === 'shifts' && <ShiftManagement />}
        {activeTab === 'roles' && <RoleChangeRequests />}
      </div>
    </div>
  );
}