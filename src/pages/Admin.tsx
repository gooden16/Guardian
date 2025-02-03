import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUserProfile } from '../lib/profiles';
import { syncParashaData } from '../lib/admin';
import { RoleChangeRequests } from '../components/admin/RoleChangeRequests';
import { VolunteerManagement } from '../components/admin/VolunteerManagement';
import { ShiftManagement } from '../components/admin/ShiftManagement';
import { Users, CalendarDays, ArrowUpRight, RefreshCw } from 'lucide-react';

export function Admin() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<'volunteers' | 'shifts' | 'roles'>('volunteers');
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  useEffect(() => {
    async function checkAdmin() {
      if (user) {
        const profile = await getUserProfile(user.id);
        setIsAdmin(profile?.is_admin ?? false);
      }
    }
    checkAdmin();
  }, [user]);

  const handleSyncParasha = async () => {
    setSyncing(true);
    setSyncError(null);
    try {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 90); // Sync next 90 days
      
      await syncParashaData(startDate, endDate);
    } catch (err) {
      setSyncError(err instanceof Error ? err.message : 'Failed to sync parasha data');
    } finally {
      setSyncing(false);
    }
  };

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
        {activeTab === 'shifts' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-900">Shift Management</h2>
              <button
                onClick={handleSyncParasha}
                disabled={syncing}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
              >
                {syncing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Sync Parasha Data
                  </>
                )}
              </button>
            </div>
            {syncError && (
              <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">
                {syncError}
              </div>
            )}
            <ShiftManagement />
          </div>
        )}
        {activeTab === 'roles' && <RoleChangeRequests />}
      </div>
    </div>
  );
}
