import React, { useState } from 'react';
import { Card, CardHeader, CardContent } from '../../ui/Card';
import { Button } from '../../ui/Button';
import toast from 'react-hot-toast';

export function SecuritySettings() {
  const [settings, setSettings] = useState({
    twoFactor: true,
    sessionTimeout: '30',
    passwordExpiry: '90',
    loginAttempts: '5'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    toast.success('Security settings updated successfully');
  };

  return (
    <Card>
      <CardHeader>
        <h2 className="text-gray-900 dark:text-white text-lg font-semibold">Security Settings</h2>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={settings.twoFactor}
                onChange={(e) => setSettings({ ...settings, twoFactor: e.target.checked })}
                className="checkbox-custom"
              />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Two-Factor Authentication</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Add an extra layer of security to your account</p>
              </div>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Session Timeout (minutes)
              </label>
              <select
                value={settings.sessionTimeout}
                onChange={(e) => setSettings({ ...settings, sessionTimeout: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-hover text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="60">1 hour</option>
                <option value="120">2 hours</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Password Expiry (days)
              </label>
              <select
                value={settings.passwordExpiry}
                onChange={(e) => setSettings({ ...settings, passwordExpiry: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-hover text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="30">30 days</option>
                <option value="60">60 days</option>
                <option value="90">90 days</option>
                <option value="180">180 days</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Failed Login Attempts
              </label>
              <select
                value={settings.loginAttempts}
                onChange={(e) => setSettings({ ...settings, loginAttempts: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-hover text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="3">3 attempts</option>
                <option value="5">5 attempts</option>
                <option value="10">10 attempts</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit">Update Security Settings</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}