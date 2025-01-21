import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Calendar, Clock, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useStore } from '../lib/store';
import type { Shift } from '../types';

export default function MyShifts() {
  const { user } = useStore();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'upcoming' | 'past'>('upcoming');

  useEffect(() => {
    if (user) {
      fetchMyShifts();
    }
  }, [user, view]);

  const fetchMyShifts = async () => {
    try {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('shift_assignments')
        .select(`
          shift:shifts(
            id,
            date,
            start_time,
            end_time,
            type,
            status,
            notes
          )
        `)
        .eq('user_id', user?.id)
        .gte('shift.date', view === 'upcoming' ? now.split('T')[0] : '1970-01-01')
        .lt('shift.date', view === 'past' ? now.split('T')[0] : '2100-01-01')
        .order('shift(date)', { ascending: view === 'upcoming' });

      if (error) throw error;
      setShifts(data.map((d) => d.shift));
    } catch (error) {
      console.error('Error fetching shifts:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Loading shifts...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">My Shifts</h1>
        <div className="flex space-x-2">
          <button
            onClick={() => setView('upcoming')}
            className={`px-4 py-2 rounded-lg ${
              view === 'upcoming'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Upcoming
          </button>
          <button
            onClick={() => setView('past')}
            className={`px-4 py-2 rounded-lg ${
              view === 'past'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Past
          </button>
        </div>
      </div>

      <div className="grid gap-4">
        {shifts.map((shift) => (
          <div
            key={shift.id}
            className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-medium text-lg">
                    {format(new Date(shift.date), 'EEEE, MMMM d, yyyy')}
                  </h3>
                  <div className="flex items-center space-x-4 mt-1 text-gray-600">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>
                        {format(new Date(`2000-01-01T${shift.startTime}`), 'h:mm a')} -{' '}
                        {format(new Date(`2000-01-01T${shift.endTime}`), 'h:mm a')}
                      </span>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        shift.type === 'EARLY'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-indigo-100 text-indigo-800'
                      }`}
                    >
                      {shift.type} Shift
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex space-x-2">
                <button className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                  View Details
                </button>
                {view === 'upcoming' && (
                  <button className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg flex items-center space-x-1">
                    <AlertCircle className="w-4 h-4" />
                    <span>Request Coverage</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {shifts.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">No shifts found</h3>
            <p className="text-gray-500 mt-1">
              {view === 'upcoming'
                ? "You don't have any upcoming shifts scheduled"
                : "You haven't completed any shifts yet"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}