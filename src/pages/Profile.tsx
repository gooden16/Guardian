import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getUserShifts } from '../lib/shifts';
import { getUserProfile, updateUserProfile } from '../lib/profiles';
import { UserShifts } from '../components/UserShifts';
import { ProfileForm } from '../components/ProfileForm';
import { Pencil } from 'lucide-react';
import type { Shift } from '../types/shift';
import type { Profile } from '../types/profile';

export function Profile() {
  const { user } = useAuth();
  const [userShifts, setUserShifts] = useState<Shift[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const shifts = await getUserShifts();
        const profileData = user ? await getUserProfile(user.id) : null;
        setUserShifts(shifts);
        setProfile(profileData);
      } catch (error) {
        console.error('Failed to load user data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user]);

  const getRoleDisplay = (role: string) => {
    switch (role) {
      case 'TL': return 'Team Leader';
      case 'L2': return 'Level 2 Volunteer';
      case 'L1': return 'Level 1 Volunteer';
      default: return role;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Profile</h1>
        {!isEditing && profile && (
          <button
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Pencil className="h-4 w-4 mr-2" />
            Edit Profile
          </button>
        )}
      </div>
      
      {isEditing && profile ? (
        <div className="bg-white shadow rounded-lg p-6">
          <ProfileForm
            profile={profile}
            onUpdate={() => {
              setIsEditing(false);
              // Reload profile data
              if (user) {
                getUserProfile(user.id).then(data => setProfile(data));
              }
            }}
            onCancel={() => setIsEditing(false)}
          />
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg p-6">
        <div className="space-y-4">
          <div className="flex justify-center">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt="Profile"
                className="w-24 h-24 rounded-full object-cover"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center">
                <span className="text-gray-400">
                  {profile?.first_name?.[0]?.toUpperCase() || ''}
                  {profile?.last_name?.[0]?.toUpperCase() || ''}
                </span>
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <p className="mt-1 text-sm text-gray-900">
              {profile?.first_name} {profile?.last_name}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <p className="mt-1 text-sm text-gray-900">{profile?.email}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Role</label>
            <p className="mt-1">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                ${profile?.role === 'TL' ? 'bg-purple-100 text-purple-800' :
                  profile?.role === 'L2' ? 'bg-blue-100 text-blue-800' :
                  'bg-green-100 text-green-800'}`}>
                {profile ? getRoleDisplay(profile.role) : 'Loading...'}
              </span>
              {profile?.is_admin && (
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  Admin
                </span>
              )}
            </p>
          </div>
          {profile?.phone && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone</label>
              <p className="mt-1 text-sm text-gray-900">{profile.phone}</p>
            </div>
          )}
          {profile?.preferred_shift && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Preferred Shift</label>
              <p className="mt-1 text-sm text-gray-900">
                {profile.preferred_shift === 'early' ? 'Early (8:35 AM - 10:10 AM)' : 'Late (10:20 AM - 12:00 PM)'}
              </p>
            </div>
          )}
        </div>
      </div>
      )}
      
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Your Shifts</h2>
        <UserShifts 
          shifts={userShifts} 
          userId={user?.id || ''} 
          userRole={profile?.role}
        />
      </div>
    </div>
  );
}