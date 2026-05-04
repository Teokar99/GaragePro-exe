import { Car, Trash2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import type { CustomCarEntry } from '../../lib/repositories/customCarDataRepository';
import { customCarDataRepository } from '../../lib/repositories/customCarDataRepository';

export const CustomCarDataSettings: React.FC = () => {
  const [entries, setEntries] = useState<CustomCarEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    try {
      const data = await customCarDataRepository.listAllCustomEntries();
      setEntries(data);
    } catch (err) {
      setError('Failed to load custom entries');
    }
  };

  const handleDelete = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await customCarDataRepository.deleteCustomEntry(id);
      setEntries((prev) => prev.filter((e) => e.id !== id));
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Failed to delete entry');
    } finally {
      setLoading(false);
    }
  };

  // Group by make for display
  const grouped = entries.reduce<Record<string, CustomCarEntry[]>>((acc, e) => {
    acc[e.make] = acc[e.make] ?? [];
    acc[e.make].push(e);
    return acc;
  }, {});

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Car className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
          Custom Makes & Models
        </h2>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Makes and models added manually from the Add Vehicle form.
      </p>

      {entries.length === 0 ? (
        <div className="text-center py-8 text-gray-400 dark:text-gray-500">
          <Car className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p className="text-sm">No custom makes or models added yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([make, makeEntries]) => {
            const makeOnlyEntry = makeEntries.find((e) => e.model === null);
            const modelEntries = makeEntries.filter((e) => e.model !== null);

            return (
              <div
                key={make}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                    {make}
                  </span>
                  {makeOnlyEntry ? (
                    <button
                      type="button"
                      onClick={() => handleDelete(makeOnlyEntry.id)}
                      disabled={loading}
                      title="Remove make"
                      className="p-1 text-red-400 hover:text-red-600 disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  ) : null}
                </div>
                {modelEntries.length > 0 ? (
                  <div className="mt-2 space-y-1 pl-3 border-l border-gray-200 dark:border-gray-600">
                    {modelEntries
                      .sort((a, b) => (a.model ?? '').localeCompare(b.model ?? ''))
                      .map((entry) => (
                        <div
                          key={entry.id}
                          className="flex items-center justify-between"
                        >
                          <span className="text-sm text-gray-600 dark:text-gray-300">
                            {entry.model}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDelete(entry.id)}
                            disabled={loading}
                            title="Remove model"
                            className="p-1 text-red-400 hover:text-red-600 disabled:opacity-50"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}

      {error ? (
        <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>
      ) : null}
    </div>
  );
};
