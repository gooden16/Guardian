import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { supabase } from '../../lib/supabase';
import type { Profile } from '../../types/profile';
import { Pencil, Trash2, X, Check } from 'lucide-react';

export function VolunteerManagement() {
  const [volunteers, setVolunteers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Profile>>({});

  async function handleToggleAdmin(volunteer: Profile) {
    if (!confirm(`Are you sure you want to ${volunteer.is_admin ? 'remove' : 'grant'} admin privileges for ${volunteer.first_name} ${volunteer.last_name}?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_admin: !volunteer.is_admin })
        .eq('id', volunteer.id);

      if (error) throw error;
      await loadVolunteers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update admin status');
    }
  }

  useEffect(() => {
    loadVolunteers();
  }, []);

  async function loadVolunteers() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('last_name', { ascending: true });

      if (error) throw error;
      setVolunteers(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load volunteers');
    } finally {
      setLoading(false);
    }
  }

  async function handleEdit(volunteer: Profile) {
    setEditingId(volunteer.id);
    setEditForm(volunteer);
  }

  async function handleSave() {
    if (!editingId || !editForm) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: editForm.first_name,
          last_name: editForm.last_name,
          role: editForm.role,
          phone: editForm.phone,
          preferred_shift: editForm.preferred_shift
        })
        .eq('id', editingId);

      if (error) throw error;
      
      setEditingId(null);
      setEditForm({});
      await loadVolunteers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update volunteer');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this volunteer?')) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadVolunteers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete volunteer');
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
    <div className="bg-white shadow-sm ring-1 ring-gray-900/5 rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-base font-semibold leading-6 text-gray-900">
          Volunteer Management
        </h3>
        
        <div className="mt-6 flow-root">
          <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
              <table className="min-w-full divide-y divide-gray-300">
                <thead>
                  <tr>
                    <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">
                      Name
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Email
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Role
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Phone
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Preferred Shift
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Admin
                    </th>
                    <th className="relative py-3.5 pl-3 pr-4 sm:pr-0">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {volunteers.map((volunteer) => (
                    <tr key={volunteer.id}>
                      {editingId === volunteer.id ? (
                        <>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm">
                            <div className="flex space-x-2">
                              <input
                                type="text"
                                value={editForm.first_name || ''}
                                onChange={(e) => setEditForm(prev => ({ ...prev, first_name: e.target.value }))}
                                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                              />
                              <input
                                type="text"
                                value={editForm.last_name || ''}
                                onChange={(e) => setEditForm(prev => ({ ...prev, last_name: e.target.value }))}
                                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                              />
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {volunteer.email}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm">
                            <select
                              value={editForm.role || ''}
                              onChange={(e) => setEditForm(prev => ({ ...prev, role: e.target.value as any }))}
                              className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                            >
                              <option value="L1">Level 1 Volunteer</option>
                              <option value="L2">Level 2 Volunteer</option>
                              <option value="TL">Team Leader</option>
                            </select>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm">
                            <input
                              type="tel"
                              value={editForm.phone || ''}
                              onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                              className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                            />
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm">
                            <select
                              value={editForm.preferred_shift || ''}
                              onChange={(e) => setEditForm(prev => ({ ...prev, preferred_shift: e.target.value as any }))}
                              className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                            >
                              <option value="">No preference</option>
                              <option value="early">Early (8:35 AM - 10:10 AM)</option>
                              <option value="late">Late (10:20 AM - 12:00 PM)</option>
                            </select>
                          </td>
                          <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">
                            <div className="flex justify-end space-x-2">
                              <button
                                onClick={handleSave}
                                className="text-green-600 hover:text-green-900"
                              >
                                <Check className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => {
                                  setEditingId(null);
                                  setEditForm({});
                                }}
                                className="text-gray-600 hover:text-gray-900"
                              >
                                <X className="h-5 w-5" />
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm">
                            <div className="font-medium text-gray-900">
                              {volunteer.first_name} {volunteer.last_name}
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {volunteer.email}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm">
                            <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium
                              ${volunteer.role === 'TL'
                                ? 'bg-purple-50 text-purple-700 ring-1 ring-inset ring-purple-700/10'
                                : volunteer.role === 'L2'
                                ? 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-700/10'
                                : 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-700/10'
                              }`}>
                              {volunteer.role === 'TL' ? 'Team Leader' :
                               volunteer.role === 'L2' ? 'Level 2' : 'Level 1'}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {volunteer.phone || '-'}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {volunteer.preferred_shift === 'early' ? 'Early' :
                             volunteer.preferred_shift === 'late' ? 'Late' : 'No preference'}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm">
                            <button
                              onClick={() => handleToggleAdmin(volunteer)}
                              className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium
                                ${volunteer.is_admin
                                  ? 'bg-purple-50 text-purple-700 ring-1 ring-inset ring-purple-700/10 hover:bg-purple-100'
                                  : 'bg-gray-50 text-gray-600 ring-1 ring-inset ring-gray-500/10 hover:bg-gray-100'
                                }`}
                            >
                              {volunteer.is_admin ? 'Admin' : 'Make Admin'}
                            </button>
                          </td>
                          <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">
                            <div className="flex justify-end space-x-2">
                              <button
                                onClick={() => handleEdit(volunteer)}
                                className="text-indigo-600 hover:text-indigo-900"
                              >
                                <Pencil className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => handleDelete(volunteer.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <Trash2 className="h-5 w-5" />
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {volunteers.length === 0 && (
                <div className="text-center py-6 text-sm text-gray-500">
                  No volunteers found
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}