import React from 'react';
import { BackupSettings } from '../components/settings/BackupSettings';

export const SettingsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
      </div>

      <BackupSettings />
    </div>
  );
};
