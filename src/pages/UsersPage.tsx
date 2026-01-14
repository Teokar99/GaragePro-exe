import React from 'react';
import { AlertTriangle } from 'lucide-react';

export function UsersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage user roles and permissions</p>
      </div>
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-12">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-16 w-16 text-amber-500" />
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">Feature Not Available</h3>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 max-w-md mx-auto">
            User management is not available in the desktop version of GaragePro.
            All users authenticate using PIN codes configured during first-time setup.
          </p>
          <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 max-w-md mx-auto">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              To manage user access, you'll need to reconfigure the application through the first-run wizard.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
