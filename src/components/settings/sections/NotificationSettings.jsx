import { useState } from 'react';
import { Card, CardHeader, CardContent } from '../../ui/Card';
import { Button } from '../../ui/Button';
import toast from 'react-hot-toast';

const initialSettings = {
  emailNotifications: {
    shiftReminders: true,
    shiftUpdates: true,
    teamMessages: true,
    adminAnnouncements: true
  },
  emailFrequency: 'instant',
  pushNotifications: {
    shiftReminders: true,
    shiftUpdates: true,
    teamMessages: false,
    adminAnnouncements: true
  }
};

const NotificationGroup = ({ title, settings, onChange }) => (
  <div className="space-y-4">
    <h3 className="text-sm font-medium text-gray-900 dark:text-white">{title}</h3>
    <div className="space-y-3">
      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={settings.shiftReminders}
          onChange={(e) => onChange({ ...settings, shiftReminders: e.target.checked })}
          className="checkbox-custom"
        />
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-white">Shift Reminders</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Receive reminders about your upcoming shifts</p>
        </div>
      </label>

      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={settings.shiftUpdates}
          onChange={(e) => onChange({ ...settings, shiftUpdates: e.target.checked })}
          className="checkbox-custom"
        />
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-white">Shift Updates</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Get notified about changes to your shifts</p>
        </div>
      </label>

      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={settings.teamMessages}
          onChange={(e) => onChange({ ...settings, teamMessages: e.target.checked })}
          className="checkbox-custom"
        />
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-white">Team Messages</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Receive messages from your team members</p>
        </div>
      </label>

      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={settings.adminAnnouncements}
          onChange={(e) => onChange({ ...settings, adminAnnouncements: e.target.checked })}
          className="checkbox-custom"
        />
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-white">Admin Announcements</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Get important announcements from administrators</p>
        </div>
      </label>
    </div>
  </div>
);

export function NotificationSettings() {
  const [settings, setSettings] = useState(initialSettings);

  const handleSubmit = (e) => {
    e.preventDefault();
    toast.success('Notification settings updated successfully');
  };

  return (
    <Card>
      <CardHeader>
        <h2 className="text-gray-900 dark:text-white text-lg font-semibold">Notification Settings</h2>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-8">
          <NotificationGroup
            title="Email Notifications"
            settings={settings.emailNotifications}
            onChange={(newSettings) => setSettings({ ...settings, emailNotifications: newSettings })}
          />

          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Email Frequency</h3>
            <select
              value={settings.emailFrequency}
              onChange={(e) => setSettings({ ...settings, emailFrequency: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-hover text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="instant">Send immediately</option>
              <option value="daily">Daily digest</option>
              <option value="weekly">Weekly digest</option>
            </select>
          </div>

          <NotificationGroup
            title="Push Notifications"
            settings={settings.pushNotifications}
            onChange={(newSettings) => setSettings({ ...settings, pushNotifications: newSettings })}
          />

          <div className="flex justify-end pt-4">
            <Button type="submit">Save Changes</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}