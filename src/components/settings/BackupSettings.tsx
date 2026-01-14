import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { Download, Upload, Clock, HardDrive, AlertTriangle, CheckCircle, Trash2 } from 'lucide-react';
import type { BackupInfo } from '../../types/tauri';
import { Modal } from '../ui/Modal';

export const BackupSettings: React.FC = () => {
  const [backups, setBackups] = useState<BackupInfo[]>([]);
  const [lastBackupDate, setLastBackupDate] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [restoreModalOpen, setRestoreModalOpen] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<BackupInfo | null>(null);

  useEffect(() => {
    loadBackups();
    loadLastBackupDate();
  }, []);

  const loadBackups = async () => {
    try {
      const result = await invoke<BackupInfo[]>('list_backups');
      setBackups(result);
    } catch (err) {
      console.error('Failed to load backups:', err);
      setError('Failed to load backup list');
    }
  };

  const loadLastBackupDate = async () => {
    try {
      const date = await invoke<string>('get_last_backup_date');
      setLastBackupDate(date);
    } catch (err) {
      console.error('Failed to load last backup date:', err);
    }
  };

  const handleCreateBackup = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const path = await invoke<string>('create_backup');
      setSuccess(`Backup created successfully: ${path}`);
      await loadBackups();
      await loadLastBackupDate();
    } catch (err) {
      setError(err as string);
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreBackup = async () => {
    if (!selectedBackup) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await invoke('restore_backup', { path: selectedBackup.path });
      setSuccess('Backup restored successfully. Please restart the application.');
      setRestoreModalOpen(false);
      setSelectedBackup(null);
    } catch (err) {
      setError(err as string);
    } finally {
      setLoading(false);
    }
  };

  const openRestoreModal = (backup: BackupInfo) => {
    setSelectedBackup(backup);
    setRestoreModalOpen(true);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Backup Settings</h2>

        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mr-2 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-start">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mr-2 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-green-800 dark:text-green-200">{success}</p>
          </div>
        )}

        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <Clock className="w-4 h-4 mr-2" />
            <span>Last automatic backup: </span>
            <span className="ml-1 font-semibold text-gray-900 dark:text-gray-100">
              {lastBackupDate || 'Never'}
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
            Automatic backups are created once per day when the application starts.
          </p>
        </div>

        <div className="mb-6">
          <button
            onClick={handleCreateBackup}
            disabled={loading}
            className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            <Download className="w-5 h-5 mr-2" />
            {loading ? 'Creating Backup...' : 'Create Manual Backup'}
          </button>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Available Backups</h3>

          {backups.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <HardDrive className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No backups available</p>
            </div>
          ) : (
            <div className="space-y-2">
              {backups.map((backup) => (
                <div
                  key={backup.path}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {backup.filename}
                    </p>
                    <div className="flex items-center space-x-4 mt-1">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {backup.created_at}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatFileSize(backup.size)}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => openRestoreModal(backup)}
                    disabled={loading}
                    className="ml-4 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    <Upload className="w-4 h-4 mr-1" />
                    Restore
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={restoreModalOpen}
        onClose={() => {
          setRestoreModalOpen(false);
          setSelectedBackup(null);
        }}
        title="Restore Backup"
      >
        <div className="space-y-4">
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-2 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-800 dark:text-yellow-200">
                <p className="font-semibold mb-1">Warning</p>
                <p>
                  Restoring a backup will replace all current data with the data from the selected backup.
                  A safety backup will be created automatically before the restore operation.
                </p>
              </div>
            </div>
          </div>

          {selectedBackup && (
            <div className="space-y-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                You are about to restore:
              </p>
              <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {selectedBackup.filename}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Created: {selectedBackup.created_at}
                </p>
              </div>
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <button
              onClick={() => {
                setRestoreModalOpen(false);
                setSelectedBackup(null);
              }}
              className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleRestoreBackup}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Restoring...' : 'Restore Backup'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
