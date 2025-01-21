import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Calendar, Clock, Users, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '../lib/supabase';
import type { Shift } from '../types';

export default function ShiftDetail() {
  const { id } = useParams();
  const [shift, setShift] = useState<Shift | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchShiftDetails();
    }
  }, [id]);

  const fetchShiftDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('shifts')
        .select(`
          *,
          assignments:shift_assignments(
            user:users(
              id,
              first_name,
              last_name,
              role
            )
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      // Transform the data to match our frontend types
      const transformedShift = {
        ...data,
        assignments: data.assignments.map(assignment => ({
          ...assignment,
          user: {
            ...assignment.user,
            firstName: assignment.user.first_name,
            lastName: assignment.user.last_name
          }
        }))
      };
      
      setShift(transformedShift);
    } catch (error) {
      console.error('Error fetching shift details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!shift) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Shift Details</h1>
        <div className="flex space-x-2">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Sign Up
          </button>
          <button className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">
            Request Swap
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-medium">
                  {format(new Date(shift.date), 'EEEE, MMMM d, yyyy')}
                </h2>
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

            <div className="border-t border-gray-100 pt-6">
              <h3 className="font-medium mb-4">Assigned Volunteers</h3>
              <div className="space-y-4">
                {shift.assignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-gray-100"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                        {assignment.user.firstName[0]}
                        {assignment.user.lastName[0]}
                      </div>
                      <div>
                        <div className="font-medium">
                          {assignment.user.firstName} {assignment.user.lastName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {assignment.user.role.replace('_', ' ')}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {shift.assignments.length < 4 && (
                  <div className="flex items-center justify-center p-4 rounded-lg border border-dashed border-gray-200 text-gray-400">
                    <Users className="w-5 h-5 mr-2" />
                    <span>Open Position</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {shift.notes && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center space-x-2 mb-4">
                <MessageSquare className="w-5 h-5 text-gray-400" />
                <h3 className="font-medium">Notes</h3>
              </div>
              <p className="text-gray-600">{shift.notes}</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="font-medium mb-4">Shift Requirements</h3>
            <ul className="space-y-3">
              <li className="flex items-center text-sm text-gray-600">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Team Leader (1)
              </li>
              <li className="flex items-center text-sm text-gray-600">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                L2 Volunteer (1)
              </li>
              <li className="flex items-center text-sm text-gray-600">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                L1 Volunteers (2)
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="font-medium mb-4">Recent Activity</h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm text-gray-600">
                    John Doe signed up as Team Leader
                  </p>
                  <p className="text-xs text-gray-400">2 hours ago</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm text-gray-600">
                    Sarah Smith requested a shift swap
                  </p>
                  <p className="text-xs text-gray-400">1 day ago</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}