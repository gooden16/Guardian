import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { supabase } from '../../lib/supabase';
import type { Shift } from '../../types/shift';
import { Users, Trash2 } from 'lucide-react';
import { ShiftCreation } from './ShiftCreation';

export function ShiftManagement() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadShifts();
  }, []);

  async function loadShifts() {
    try {
      const { data, error } = await supabase
        .from('shifts')
        .select(`
          id,
          date,
          type,
          shift_volunteers (
            id,
            user_id,
            profiles:user_id (
              first_name,
              last_name,
              role
            )
          )
        `)
        .gte('date', new Date().toISOString().split('T')[0])
        .order('date', { ascending: true });

      if (error) throw error;
      const shiftsData = data?.map(shift => ({
        ...shift,
        volunteers: shift.shift_volunteers.map((sv: any) => ({
          id: sv.user_id,
          role: sv.profiles.role,
          name: `${sv.profiles.first_name} ${sv.profiles.last_name}`
        }))
      })) || [];

      setShifts(shiftsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load shifts');
    } finally {
      setLoading(false);
    }
  }

  async function handleRemoveVolunteer(shiftId: string, userId: string) {
    if (!confirm('Are you sure you want to remove this volunteer from the shift?')) return;

    try {
      const { error } = await supabase
        .from('shift_volunteers')
        .delete()
        .eq('shift_id', shiftId)
        .eq('user_id', userId);

      if (error) throw error;
      await loadShifts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove volunteer');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-600 text-center py-4">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <ShiftCreation onSuccess={loadShifts} />
      
      {Object.entries(shifts.reduce((acc: { [key: string]: Shift[] }, shift) => {
        const date = shift.date;
        if (!acc[date]) acc[date] = [];
        acc[date].push(shift);
        return acc;
      }, {})).map(([date, dayShifts]) => (
        <div key={date} className="bg-white shadow-sm ring-1 ring-gray-900/5 rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-base font-semibold leading-6 text-gray-900">
              {format(new Date(date), 'MMMM d, yyyy')}
              {dayShifts[0]?.hebrew_parasha && (
                <div className="mt-1">
                  <p className="text-sm text-gray-500 font-hebrew" dir="rtl" lang="he">
                    {dayShifts[0].hebrew_parasha}
                  </p>
                </div>
              )}
            </h3>
            
            <div className="mt-6 space-y-6">
              {dayShifts.map(shift => (
                <div key={shift.id} className="border-t border-gray-100 pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">
                        {shift.type === 'early' ? 'Early Shift (8:35 AM - 10:10 AM)' : 'Late Shift (10:20 AM - 12:00 PM)'}
                      </h4>
                      <div className="mt-1 flex items-center text-sm text-gray-500">
                        <Users className="h-4 w-4 mr-1" />
                        <span>{shift.volunteers.length}/4 volunteers</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
                    {shift.volunteers.length > 0 ? (
                      <ul className="divide-y divide-gray-100">
                        {shift.volunteers.map(volunteer => (
                          <li key={volunteer.id} className="flex items-center justify-between py-2">
                            <div>
                              <p className="text-sm font-medium text-gray-900">{volunteer.name}</p>
                              <p className="text-xs text-gray-500">{volunteer.role}</p>
                            </div>
                            <button
                              onClick={() => handleRemoveVolunteer(shift.id, volunteer.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-500 py-2">No volunteers signed up yet</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}

      {shifts.length === 0 && (
        <div className="text-center py-6 text-sm text-gray-500">
          No upcoming shifts found
        </div>
      )}
    </div>
  );
}