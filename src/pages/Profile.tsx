import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getUserProfile, updateNotificationPrefs } from '../lib/profiles';
import { Avatar } from '../components/Avatar';
import { ProfileForm } from '../components/ProfileForm';
import { Pencil, Bell } from 'lucide-react';
import type { Profile } from '../types/profile';

const ROLE_LABELS: Record<string, string> = {
  TL: 'Team Leader',
  L2: 'Level 2 Volunteer',
  L1: 'Level 1 Volunteer',
};

export function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [notifSaving, setNotifSaving] = useState(false);

  const reload = () => {
    if (user) getUserProfile(user.id).then(setProfile);
  };

  useEffect(() => {
    if (user) {
      setLoading(true);
      getUserProfile(user.id).then((p) => {
        setProfile(p);
        setLoading(false);
      });
    }
  }, [user]);

  const handleNotifToggle = async (field: 'notification_assignments' | 'notification_changes' | 'notification_announcements') => {
    if (!profile || !user) return;
    const newVal = !profile[field];
    setProfile((p) => p ? { ...p, [field]: newVal } : p);
    setNotifSaving(true);
    try {
      await updateNotificationPrefs(user.id, {
        notification_assignments: field === 'notification_assignments' ? newVal : (profile.notification_assignments ?? true),
        notification_changes: field === 'notification_changes' ? newVal : (profile.notification_changes ?? true),
        notification_announcements: field === 'notification_announcements' ? newVal : (profile.notification_announcements ?? true),
      });
    } finally {
      setNotifSaving(false);
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
      <h1 className="text-2xl font-bold text-gray-900">Profile</h1>

      {/* Profile card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        {isEditing && profile ? (
          <ProfileForm
            profile={profile}
            onUpdate={() => { setIsEditing(false); reload(); }}
            onCancel={() => setIsEditing(false)}
          />
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Avatar
                  url={profile?.avatar_url}
                  name={`${profile?.first_name} ${profile?.last_name}`}
                  size="lg"
                />
                <div>
                  <p className="text-lg font-semibold text-gray-900">
                    {profile?.first_name} {profile?.last_name}
                  </p>
                  <p className="text-sm text-gray-500">{profile?.email}</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Role</p>
                <div className="mt-1 flex items-center gap-2 flex-wrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                    ${profile?.role === 'TL' ? 'bg-purple-100 text-purple-800' :
                      profile?.role === 'L2' ? 'bg-blue-100 text-blue-800' :
                      'bg-green-100 text-green-800'}`}>
                    {profile ? ROLE_LABELS[profile.role] : '—'}
                  </span>
                  {profile?.is_admin && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                      Admin
                    </span>
                  )}
                </div>
              </div>

              {profile?.phone && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Phone</p>
                  <p className="mt-1 text-sm text-gray-900">{profile.phone}</p>
                </div>
              )}

              {profile?.preferred_shift && profile.preferred_shift !== 'none' && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Preferred shift</p>
                  <p className="mt-1 text-sm text-gray-900">
                    {profile.preferred_shift === 'early' ? 'Early (8:35–10:10 AM)' : 'Late (10:20 AM–12:00 PM)'}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Notification preferences */}
      {!isEditing && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="h-4 w-4 text-gray-500" />
            <h2 className="text-base font-semibold text-gray-900">
              Email notifications
              {notifSaving && <span className="ml-2 text-xs font-normal text-gray-400">Saving…</span>}
            </h2>
          </div>
          <div className="space-y-3">
            {[
              { key: 'notification_assignments' as const, label: 'When I\'m assigned to a shift' },
              { key: 'notification_changes' as const, label: 'When my assignment changes' },
              { key: 'notification_announcements' as const, label: 'When a new announcement is posted' },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center justify-between cursor-pointer">
                <span className="text-sm text-gray-700">{label}</span>
                <button
                  role="switch"
                  aria-checked={profile?.[key] ?? true}
                  onClick={() => handleNotifToggle(key)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                    (profile?.[key] ?? true) ? 'bg-indigo-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                      (profile?.[key] ?? true) ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}