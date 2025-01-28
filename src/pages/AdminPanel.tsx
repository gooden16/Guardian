import React, { useState, useEffect } from 'react';
import {
  Users,
  Calendar as CalendarIcon,
  Download,
  Search,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { generateShifts } from '../lib/shifts';
import type { Database } from '../lib/database.types';

type Volunteer = Database['public']['Tables']['volunteers']['Row'];
type Shift = Database['public']['Tables']['shifts']['Row'];

const AdminPanel = () => {
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'volunteers' | 'shifts'>('volunteers');
  const [generating, setGenerating] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      // Check if current user is admin
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: volunteer } = await supabase
          .from('volunteers')
          .select('*')
          .eq('auth_user_id', user.id);
        
        if (volunteer && volunteer.length > 0) {
          setIsAdmin(volunteer[0].is_admin);
        }
      }
      
      const [volunteersResponse, shiftsResponse] = await Promise.all([
        supabase.from('volunteers').select('*').order('created_at', { ascending: false }),
        supabase.from('shifts').select('*').order('date', { ascending: false }).limit(50),
      ]);

      if (volunteersResponse.data) setVolunteers(volunteersResponse.data);
      if (shiftsResponse.data) setShifts(shiftsResponse.data);
      
      setLoading(false);
    };

    fetchData();
  }, []);

  const filteredVolunteers = volunteers.filter(volunteer =>
    `${volunteer.first_name} ${volunteer.last_initial}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const exportData = async () => {
    const data = activeTab === 'volunteers' ? volunteers : shifts;
    const csvContent = 
      'data:text/csv;charset=utf-8,' + 
      Object.keys(data[0] || {}).join(',') + '\n' +
      data.map(row => 
        Object.values(row).map(val => 
          typeof val === 'string' ? `"${val}"` : val
        ).join(',')
      ).join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${activeTab}_${new Date().toISOString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleGenerateShifts = async () => {
    setGenerating(true);
    try {
      // Generate shifts for the next 3 months
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 3);
      
      await generateShifts(startDate, endDate);
      
      // Refresh shifts data
      const { data } = await supabase
        .from('shifts')
        .select('*')
        .order('date', { ascending: false })
        .limit(50);
      
      if (data) setShifts(data);
    } catch (error) {
      console.error('Error generating shifts:', error);
      alert('Failed to generate shifts. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Admin Panel</h2>
        <div className="flex items-center space-x-4">
          {isAdmin && (
            <button
              onClick={handleGenerateShifts}
              disabled={generating}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${generating ? 'animate-spin' : ''}`} />
              Generate Shifts
            </button>
          )}
          <button
            onClick={exportData}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <Download className="h-4 w-4 mr-2" />
            Export {activeTab}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('volunteers')}
            className={`${
              activeTab === 'volunteers'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Volunteers
          </button>
          <button
            onClick={() => setActiveTab('shifts')}
            className={`${
              activeTab === 'shifts'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Shifts
          </button>
        </nav>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder={`Search ${activeTab}...`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />
      </div>

      {activeTab === 'volunteers' ? (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {filteredVolunteers.map((volunteer) => (
              <li key={volunteer.id}>
                <div className="px-4 py-4 flex items-center sm:px-6">
                  <div className="min-w-0 flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <div className="flex text-sm">
                        <p className="font-medium text-blue-600 truncate">
                          {volunteer.first_name} {volunteer.last_initial}.
                        </p>
                        <p className="ml-1 flex-shrink-0 font-normal text-gray-500">
                          ({volunteer.role})
                        </p>
                      </div>
                      <div className="mt-2 flex">
                        <div className="flex items-center text-sm text-gray-500">
                          <Users className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                          <p>{volunteer.email}</p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 flex-shrink-0 sm:mt-0">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            volunteer.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {volunteer.is_active ? 'Active' : 'Inactive'}
                        </span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {volunteer.quarterly_commitment_count} shifts
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {shifts.map((shift) => (
              <li key={shift.id}>
                <div className="px-4 py-4 flex items-center sm:px-6">
                  <div className="min-w-0 flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <div className="flex text-sm">
                        <p className="font-medium text-blue-600 truncate">
                          {new Date(shift.date).toLocaleDateString()}
                        </p>
                        <p className="ml-1 flex-shrink-0 font-normal text-gray-500">
                          ({shift.shift_type})
                        </p>
                      </div>
                      <div className="mt-2 flex">
                        <div className="flex items-center text-sm text-gray-500">
                          <CalendarIcon className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                          <p>{shift.hebrew_name}</p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 flex-shrink-0 sm:mt-0">
                      <div className="flex items-center space-x-2">
                        {shift.is_holiday && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            Holiday
                          </span>
                        )}
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {shift.min_volunteers} min / {shift.ideal_volunteers} ideal
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;