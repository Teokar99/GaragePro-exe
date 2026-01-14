import React from 'react';
import { Database, AlertTriangle } from 'lucide-react';

export function DatabaseSeeder() {
  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Database className="w-8 h-8 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Database Tools</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">Populate or clear the database with mock data</p>
          </div>
        </div>

        <div className="text-center py-8">
          <AlertTriangle className="mx-auto h-16 w-16 text-amber-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Feature Not Available</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md mx-auto">
            Database seeding and bulk operations are not available in the desktop version of GaragePro.
            The application uses a local SQLite database that is managed automatically.
          </p>
          <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 max-w-md mx-auto">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              To add data, use the Customers and Services pages in the main application.
              Your data is stored locally in a secure SQLite database.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
