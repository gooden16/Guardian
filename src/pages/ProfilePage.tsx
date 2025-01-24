import React, { useEffect, useState, useRef } from 'react';
import { UserCircle, Award, Calendar, Upload, History, Phone } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ProfileService, Profile, Role } from '../services/ProfileService';

export function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role>('L1');
  const [stats, setStats] = useState<{ totalShifts: number; shabbatotCount: number } | null>(null);
  const [totalCompleted, setTotalCompleted] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        if (!user) return;
        
        const [profileData, adminStatus, statsData, completedShifts] = await Promise.all([
          ProfileService.getProfile(user.id),
          ProfileService.isAdmin(user.id),
          ProfileService.getQuarterlyStats(user.id),
          ProfileService.getTotalCompletedShifts(user.id),
        ]);

        setProfile(profileData);
        setIsAdmin(adminStatus);
        setStats(statsData);
        setTotalCompleted(completedShifts);
        setFirstName(profileData?.first_name || '');
        setLastName(profileData?.last_name || '');
        setPhoneNumber(profileData?.phone_number || '');
      } catch (error) {
        setError('Failed to load profile');
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [user]);

  const handleRoleUpdate = async (userId: string, newRole: Role) => {
    try {
      await ProfileService.updateRole(userId, newRole);
      if (userId === user?.id) {
        setProfile(prev => prev ? { ...prev, role: newRole } : null);
      }
      setEditingUserId(null);
    } catch (error) {
      console.error('Failed to update role:', error);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    try {
      setUploading(true);
      const avatarUrl = await ProfileService.uploadAvatar(user.id, file);
      setProfile(prev => prev ? { ...prev, avatar_url: avatarUrl } : null);
    } catch (error) {
      console.error('Failed to upload avatar:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleNameUpdate = async () => {
    if (!user) return;
    try {
      await ProfileService.updateName(user.id, firstName, lastName);
      setProfile(prev => prev ? { ...prev, first_name: firstName, last_name: lastName } : null);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update name:', error);
    }
  };

  const handlePhoneUpdate = async () => {
    if (!user) return;
    try {
      await ProfileService.updatePhone(user.id, phoneNumber);
      setProfile(prev => prev ? { ...prev, phone_number: phoneNumber } : null);
      setIsEditingPhone(false);
    } catch (error) {
      console.error('Failed to update phone number:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="text-sm text-red-700">{error || 'Profile not found'}</div>
      </div>
    );
  }

  const getRequirementStatus = () => {
    const requirements = profile.role === 'TL' 
      ? { target: 2, label: 'Shabbatot' }
      : { target: 3, label: 'shifts' };

    const current = profile.role === 'TL' ? stats?.shabbatotCount : stats?.totalShifts;
    const progress = current || 0;
    const remaining = Math.max(0, requirements.target - progress);

    return {
      progress,
      remaining,
      target: requirements.target,
      label: requirements.label,
    };
  };

  const requirementStatus = getRequirementStatus();

  return (
    <div className="max-w-3xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center space-x-4">
            <div className="relative flex-shrink-0 group cursor-pointer" onClick={handleAvatarClick}>
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="Profile"
                  className="h-16 w-16 rounded-full object-cover"
                />
              ) : (
                <UserCircle className="h-16 w-16 text-gray-400" />
              )}
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity">
                <Upload className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleAvatarChange}
                disabled={uploading}
              />
            </div>
            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-2">
                  <div>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="First Name"
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Last Name"
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={handleNameUpdate}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setFirstName(profile.first_name);
                        setLastName(profile.last_name);
                      }}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {profile.first_name || profile.last_name
                      ? `${profile.first_name} ${profile.last_name}`
                      : profile.email}
                  </h2>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-sm text-indigo-600 hover:text-indigo-900"
                  >
                    Edit Name
                  </button>
                </>
              )}
              <div className="mt-1 flex items-center">
                <Award className="h-5 w-5 text-indigo-500 mr-2" />
                {editingUserId === profile.id ? (
                  <div className="flex items-center space-x-2">
                    <select
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value as Role)}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    >
                      <option value="TL">Team Leader</option>
                      <option value="L1">Level 1</option>
                      <option value="L2">Level 2</option>
                    </select>
                    <button
                      onClick={() => handleRoleUpdate(profile.id, selectedRole)}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingUserId(null)}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center">
                    <span className="text-sm text-gray-500 mr-2">
                      {profile.role === 'TL' ? 'Team Leader' : `Level ${profile.role.slice(1)}`}
                    </span>
                    {isAdmin && (
                      <button
                        onClick={() => {
                          setEditingUserId(profile.id);
                          setSelectedRole(profile.role);
                        }}
                        className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                )}
              </div>
              <div className="mt-2 flex items-center">
                <Phone className="h-5 w-5 text-gray-400 mr-2" />
                {isEditingPhone ? (
                  <div className="flex items-center space-x-2">
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="Phone Number"
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                    <button
                      onClick={handlePhoneUpdate}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingPhone(false);
                        setPhoneNumber(profile.phone_number || '');
                      }}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center">
                    <span className="text-sm text-gray-500 mr-2">
                      {profile.phone_number || 'No phone number added'}
                    </span>
                    <button
                      onClick={() => setIsEditingPhone(true)}
                      className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                    >
                      {profile.phone_number ? 'Edit' : 'Add'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="bg-gray-50 overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center">
                  <Calendar className="h-6 w-6 text-gray-400 mr-2" />
                  <div className="flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Current Quarter Progress
                      </dt>
                      <dd className="mt-1 text-3xl font-semibold text-gray-900">
                        {requirementStatus.progress} / {requirementStatus.target} {requirementStatus.label}
                      </dd>
                    </dl>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="relative pt-1">
                    <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
                      <div
                        style={{ width: `${(requirementStatus.progress / requirementStatus.target) * 100}%` }}
                        className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-500"
                      />
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-gray-600">
                    {requirementStatus.remaining > 0
                      ? `${requirementStatus.remaining} more ${requirementStatus.label} needed this quarter`
                      : 'Quarterly requirement met!'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center">
                  <History className="h-6 w-6 text-gray-400 mr-2" />
                  <div className="flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total Completed Shifts
                      </dt>
                      <dd className="mt-1 text-3xl font-semibold text-gray-900">
                        {totalCompleted}
                      </dd>
                    </dl>
                  </div>
                </div>
                <p className="mt-4 text-sm text-gray-600">
                  All time completed shifts across all quarters
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
