/* eslint-disable @typescript-eslint/no-explicit-any */
import { Car, Search } from "lucide-react";
import React, { useEffect, useState } from "react";
import { vehiclesRepository } from "../lib/repositories/vehiclesRepository";
import { TauriVehicleWithCustomer } from "../types/tauri";

export const VehiclesPage: React.FC<{
  onNavigate: (page: string, data?: any) => void;
  navData?: any;
}> = ({ onNavigate: _onNavigate }) => {
  const [vehicles, setVehicles] = useState<TauriVehicleWithCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 20;
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  useEffect(() => {
    const id = window.setTimeout(() => {
      setPage(1);
      setSearchTerm(searchInput);
    }, 400);
    return () => window.clearTimeout(id);
  }, [searchInput]);

  useEffect(() => {
    loadVehicles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, searchTerm]);

  const loadVehicles = async () => {
    try {
      setLoading(true);
      const result = await vehiclesRepository.listVehicles(searchTerm, page, perPage);
      const items: TauriVehicleWithCustomer[] = result.items ?? (result as any).data ?? [];
      setVehicles(items);
      setTotalPages(result.total_pages ?? 1);
      setTotalRecords(result.total ?? items.length);
    } catch (error) {
      console.error("Failed to load vehicles:", error);
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString();
    } catch {
      return "-";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Car className="w-6 h-6 text-green-500" />
            Vehicles
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {totalRecords} registered vehicle{totalRecords !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search owner, make, model, plate, VIN..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600
                       bg-white dark:bg-slate-800 text-gray-900 dark:text-white
                       placeholder-gray-400 dark:placeholder-gray-500
                       focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-slate-700/50 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <th className="px-4 py-3">Owner</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Vehicle</th>
                <th className="px-4 py-3">Year</th>
                <th className="px-4 py-3">Plate</th>
                <th className="px-4 py-3">VIN</th>
                <th className="px-4 py-3">Engine Code</th>
                <th className="px-4 py-3">Mileage</th>
                <th className="px-4 py-3">Registered</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center">
                    <div className="flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500" />
                      Loading vehicles...
                    </div>
                  </td>
                </tr>
              ) : vehicles.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-gray-500 dark:text-gray-400">
                    {searchTerm ? `No vehicles found for "${searchTerm}"` : "No vehicles registered yet"}
                  </td>
                </tr>
              ) : (
                vehicles.map((v) => (
                  <tr
                    key={v.id}
                    className="transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                      {v.customer_name}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      {v.customer_phone ?? "-"}
                    </td>
                    <td className="px-4 py-3 text-gray-900 dark:text-white">
                      {v.make} {v.model}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      {v.year}
                    </td>
                    <td className="px-4 py-3">
                      {v.license_plate ? (
                        <button
                          type="button"
                          onClick={async (e) => {
                            e.stopPropagation();
                            try {
                              await navigator.clipboard.writeText(v.license_plate!);
                            } catch {
                              // clipboard not available
                            }
                          }}
                          title={`Copy ${v.license_plate}`}
                          className="rounded-md border border-gray-300 dark:border-slate-500
                                     bg-white dark:bg-slate-800 px-2 py-0.5 text-xs font-semibold
                                     text-gray-700 dark:text-gray-200
                                     hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors"
                        >
                          {v.license_plate}
                        </button>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 font-mono text-xs">
                      {v.vin ?? "-"}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 font-mono text-xs">
                      {v.engine_code ?? "-"}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      {v.last_mileage != null
                        ? `${v.last_mileage.toLocaleString()} km`
                        : <span className="text-gray-400 dark:text-gray-500">-</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                      {formatDate(v.created_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600
                       text-sm font-medium text-gray-700 dark:text-gray-300
                       bg-white dark:bg-slate-800
                       hover:bg-gray-50 dark:hover:bg-slate-700
                       disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600
                       text-sm font-medium text-gray-700 dark:text-gray-300
                       bg-white dark:bg-slate-800
                       hover:bg-gray-50 dark:hover:bg-slate-700
                       disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};
