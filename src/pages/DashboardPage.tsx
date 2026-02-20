import { AlertTriangle, Car, Users, Wrench } from "lucide-react";
import React, { useEffect, useState } from "react";
import { usePermissions } from "../hooks/usePermissions";
import { dashboardRepository } from "../lib/repositories/dashboardRepository";
import { logError } from "../utils/errorHandler";

type UiStats = {
  customers: number;
  vehicles: number;
  monthlyServices: number;
};

export const DashboardPage: React.FC = () => {
  const permissions = usePermissions();

  const [stats, setStats] = useState<UiStats>({
    customers: 0,
    vehicles: 0,
    monthlyServices: 0,
  });

  const [recentServices, setRecentServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [rawStats, services] = await Promise.all([
        dashboardRepository.getDashboardStats(),
        dashboardRepository.getRecentServices(5),
      ]);

      console.log("SERVICES RAW", services[0]);

      setStats({
        customers: Number((rawStats as any).customers_count) || 0,
        vehicles: Number((rawStats as any).vehicles_count) || 0,
        totalRevenue: Number((rawStats as any).total_revenue) || 0,
        monthlyServices: Number((rawStats as any).monthly_services) || 0,
      });

      setRecentServices(Array.isArray(services) ? services : []);
    } catch (err) {
      logError("Error loading dashboard data", err);
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData().catch((err) => {
      logError("Dashboard loading failed", err);
      setError("Failed to load dashboard data");
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Loading your dashboard...
          </p>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
        <div className="text-center py-12">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            Unable to load dashboard
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Please check your connection and try refreshing the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Welcome to your auto repair shop management system
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-200 dark:border-slate-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Users className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Total Customers
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.customers}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-200 dark:border-slate-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <Car className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Total Vehicles
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.vehicles}
              </p>
            </div>
          </div>
        </div>
      </div>

{permissions.canViewFinancials && (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-200 dark:border-slate-700">
      <div className="flex items-center space-x-3 mb-4">
        <div className="p-2 bg-blue-500/20 rounded-lg">
          <Wrench className="w-6 h-6 text-blue-500" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Monthly Services
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Services this month
          </p>
        </div>
      </div>
      <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
        {stats.monthlyServices}
      </p>
    </div>
  </div>
)}

      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700">
          <div className="p-6 border-b border-gray-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Recent Services
            </h3>
          </div>
          <div className="p-6">
            {recentServices.length > 0 ? (
              <div className="space-y-4">
                {recentServices.map((service) => (
                  <div
                    key={service.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {service.vehicle_year} {service.vehicle_make}{" "}
                        {service.vehicle_model}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {service.customer_name} •{" "}
                        {service.date
                          ? new Date(service.date).toLocaleDateString()
                          : "-"}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {service.description ?? ""}
                      </p>
                    </div>

                    {permissions.canViewFinancials && (
                      <div className="text-right">
                        <p className="font-semibold text-gray-900 dark:text-white">
                          €{(Number(service.total) || 0).toFixed(2)}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                No recent services
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
