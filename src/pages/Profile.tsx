import React, { useState, useEffect } from 'react';
import { User, Calendar, Clock, Award, Settings } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type Volunteer = Database['public']['Tables']['volunteers']['Row'];
type ShiftAssignment = Database['public']['Tables']['shift_assignments']['Row'];

const Profile = () => {
  const [volunteer, setVolunteer] = useState<Volunteer | null>(null);
  const [assignments, setAssignments] = useState<ShiftAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      const { data: volunteerData } = await supabase
        .from('volunteers')
        .select('*')
        .eq('auth_user_id', user.id)
        .single();

      if (volunteerData) {
        setVolunteer(volunteerData);
        
        const { data: assignmentsData } = await supabase
          .from('shift_assignments')
          .select('*')
          .eq('volunteer_id', volunteerData.id)
          .order('created_at', { ascending: false });

        setAssignments(assignmentsData || []);
      }
      
      setLoading(false);
    };

    fetchProfile();
  }, []);

  const updatePreferences = async (updates: Partial<Volunteer>) => {
    if (!volunteer) return;

    const { error } = await supabase
      .from('volunteers')
      .update(updates)
      .eq('id', volunteer.id);

    if (!error) {
      setVolunteer({ ...volunteer, ...updates });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!volunteer) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Profile Not Found</h2>
        <p className="mt-2 text-gray-600">Please contact an administrator.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Profile Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center space-x-6">
          <div className="relative">
            {volunteer.avatar_url ? (
              <img
                src={volunteer.avatar_url}
                alt="Profile"
                className="h-24 w-24 rounded-full object-cover"
              />
            ) : (
              <div className="h-24 w-24 rounded-full bg-blue-100 flex items-center justify-center">
                <User className="h-12 w-12 text-blue-600" />
              </div>
            )}
            <span className="absolute bottom-0 right-0 h-4 w-4 rounded-full bg-green-400 border-2 border-white"></span>
          </div>
          
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">
              {volunteer.first_name} {volunteer.last_initial}.
            </h1>
            <div className="mt-1 flex items-center space-x-4">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                {volunteer.role}
              </span>
              <span className="text-gray-500">{volunteer.email}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Quarterly Goal</h3>
            <Award className="h-5 w-5 text-blue-600" />
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold text-gray-900">
              {volunteer.quarterly_commitment_count}/
              {volunteer.role === 'TL' ? '4' : '3'}
            </div>
            <div className="mt-1 text-sm text-gray-500">Shifts completed</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Last Shift</h3>
            <Calendar className="h-5 w-5 text-blue-600" />
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold text-gray-900">
              {volunteer.last_shift_date
                ? new Date(volunteer.last_shift_date).toLocaleDateString()
                : 'N/A'}
            </div>
            <div className="mt-1 text-sm text-gray-500">Date completed</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Preferences</h3>
            <Clock className="h-5 w-5 text-blue-600" />
          </div>
          <div className="mt-4 space-y-2">
            {volunteer.preferred_shift_type?.map(type => (
              <span
                key={type}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-2"
              >
                {type}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Preferences */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Shift Preferences</h3>
          <Settings className="h-5 w-5 text-blue-600" />
        </div>
        
        <div className="space-y-6">
          <div>
            <label className="text-sm font-medium text-gray-700">
              Preferred Shift Types
            </label>
            <div className="mt-2 flex flex-wrap gap-2">
              {(['EARLY', 'LATE'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => {
                    const current = volunteer.preferred_shift_type || [];
                    const updated = current.includes(type)
                      ? current.filter(t => t !== type)
                      : [...current, type];
                    updatePreferences({ preferred_shift_type: updated });
                  }}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                    volunteer.preferred_shift_type?.includes(type)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">
              Preferred Days
            </label>
            <div className="mt-2 flex flex-wrap gap-2">
              {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
                <button
                  key={day}
                  onClick={() => {
                    const current = volunteer.preferred_days || [];
                    const updated = current.includes(day)
                      ? current.filter(d => d !== day)
                      : [...current, day];
                    updatePreferences({ preferred_days: updated });
                  }}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                    volunteer.preferred_days?.includes(day)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Shifts */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Recent Shifts</h3>
        <div className="space-y-4">
          {assignments.slice(0, 5).map(assignment => (
            <div
              key={assignment.id}
              className="flex items-center justify-between py-3 border-b border-gray-200 last:border-0"
            >
              <div className="flex items-center space-x-4">
                <Calendar className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="font-medium text-gray-900">
                    {new Date(assignment.created_at).toLocaleDateString()}
                  </div>
                  <div className="text-sm text-gray-500">
                    Status: {assignment.status}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Profile;