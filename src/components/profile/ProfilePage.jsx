import React, { useState } from 'react';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import toast from 'react-hot-toast';

const initialProfile = {
  name: 'Alice Freeman',
  email: 'alice@example.com',
  avatar: 'https://cdn.usegalileo.ai/stability/117a7a12-7704-4917-9139-4a3f76c42e78.png',
  role: 'Admin',
  timezone: 'America/New_York',
  notifications: {
    email: true,
    push: true,
    updates: false
  }
};

export function ProfilePage() {
  const [profile, setProfile] = useState(initialProfile);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(profile);

  const handleSubmit = (e) => {
    e.preventDefault();
    setProfile(formData);
    setIsEditing(false);
    toast.success('Profile updated successfully');
  };

  return (
    <main className="flex-1 min-w-0 overflow-auto">
      <div className="max-w-[1440px] mx-auto animate-fade-in">
        <div className="flex flex-wrap justify-between gap-3 p-4">
          <h1 className="text-gray-900 dark:text-white text-2xl md:text-3xl font-bold">Your Profile</h1>
        </div>

        <div className="p-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Profile Overview */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h2 className="text-gray-900 dark:text-white text-lg font-semibold">Profile Information</h2>
                  <Button 
                    variant={isEditing ? 'secondary' : 'primary'}
                    onClick={() => {
                      if (isEditing) {
                        setFormData(profile);
                      }
                      setIsEditing(!isEditing);
                    }}
                  >
                    {isEditing ? 'Cancel' : 'Edit Profile'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-hover text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-hover text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Timezone
                      </label>
                      <select
                        value={formData.timezone}
                        onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-hover text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      >
                        <option value="America/New_York">Eastern Time (ET)</option>
                        <option value="America/Chicago">Central Time (CT)</option>
                        <option value="America/Denver">Mountain Time (MT)</option>
                        <option value="America/Los_Angeles">Pacific Time (PT)</option>
                      </select>
                    </div>

                    <div className="flex justify-end pt-4">
                      <Button type="submit">Save Changes</Button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <img
                        src={profile.avatar}
                        alt={profile.name}
                        className="w-20 h-20 rounded-full"
                      />
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                          {profile.name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{profile.role}</p>
                      </div>
                    </div>

                    <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</dt>
                        <dd className="mt-1 text-sm text-gray-900 dark:text-white">{profile.email}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Timezone</dt>
                        <dd className="mt-1 text-sm text-gray-900 dark:text-white">{profile.timezone}</dd>
                      </div>
                    </dl>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Notification Preferences */}
            <Card>
              <CardHeader>
                <h2 className="text-gray-900 dark:text-white text-lg font-semibold">Notification Settings</h2>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={profile.notifications.email}
                      onChange={(e) => setProfile({
                        ...profile,
                        notifications: {
                          ...profile.notifications,
                          email: e.target.checked
                        }
                      })}
                      className="checkbox-custom"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Email Notifications</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Receive emails about your account activity</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={profile.notifications.push}
                      onChange={(e) => setProfile({
                        ...profile,
                        notifications: {
                          ...profile.notifications,
                          push: e.target.checked
                        }
                      })}
                      className="checkbox-custom"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Push Notifications</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Receive push notifications in your browser</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={profile.notifications.updates}
                      onChange={(e) => setProfile({
                        ...profile,
                        notifications: {
                          ...profile.notifications,
                          updates: e.target.checked
                        }
                      })}
                      className="checkbox-custom"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Product Updates</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Receive updates about new features and improvements</p>
                    </div>
                  </label>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}