import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Bell, Phone, UserCircle } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';
import { ShiftService, ShiftWithCounts } from '../services/ShiftService';

type ShiftWithAssignments = Database['public']['Tables']['shifts']['Row'] & {
  shift_assignments: Array<{
    id: string;
    user_id: string;
    role: 'TL' | 'L1' | 'L2';
    profiles: {
      first_name: string;
      last_name: string;
      avatar_url: string | null;
      phone_number: string | null;
    };
  }>;
};

export function ShiftDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [shift, setShift] = useState<ShiftWithCounts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadShiftDetails() {
      try {
        if (!id) return;
        const shiftData = await ShiftService.getShiftWithCounts(id);
        setShift(shiftData);
      } catch (err) {
        console.error('Error loading shift details:', err);
        setError(err instanceof Error ? err.message : 'Failed to load shift details');
      } finally {
        setLoading(false);
      }
    }

    loadShiftDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (error || !shift) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="text-sm text-red-700">{error || 'Shift not found'}</div>
      </div>
    );
  }

  const roleGroups = shift.shift_assignments.reduce((acc, assignment) => {
    if (!acc[assignment.role]) {
      acc[assignment.role] = [];
    }
    acc[assignment.role].push(assignment);
    return acc;
  }, {} as Record<'TL' | 'L1' | 'L2', typeof shift.shift_assignments>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to="/shifts"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Shifts
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">
            {shift.name} - {shift.shift_type}
          </h1>
        </div>
        <div className="text-sm text-gray-500">
          {format(new Date(shift.date), 'MMMM d, yyyy')}
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Volunteers</h3>
          <div className="space-y-6">
            {(['TL', 'L1', 'L2'] as const).map((role) => (
              <div key={role} className="space-y-2">
                <h4 className="text-sm font-medium text-gray-500">
                  {role === 'TL' ? 'Team Leaders' : `Level ${role.slice(1)}`}{' '}
                  ({(roleGroups[role] || []).length} / {shift[`required_${role.toLowerCase()}`]})
                </h4>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {(roleGroups[role] || []).map((assignment) => (
                    <div
                      key={assignment.id}
                      className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
                    >
                      {assignment.profiles.avatar_url ? (
                        <img
                          src={assignment.profiles.avatar_url}
                          alt={`${assignment.profiles.first_name} ${assignment.profiles.last_name}`}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <UserCircle className="h-10 w-10 text-gray-400" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {assignment.profiles.first_name} {assignment.profiles.last_name}
                        </p>
                        {assignment.profiles.phone_number && (
                          <p className="text-sm text-gray-500 flex items-center">
                            <Phone className="h-3 w-3 mr-1" />
                            {assignment.profiles.phone_number}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Notifications</h3>
            <button
              type="button"
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Bell className="h-4 w-4 mr-2" />
              Send Notification
            </button>
          </div>
          <div className="bg-gray-50 rounded-lg p-6 text-center text-gray-500">
            Notification functionality coming soon
          </div>
        </div>
      </div>
    </div>
  );
}
