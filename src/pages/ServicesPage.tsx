import {
  Calendar,
  Car,
  Download,
  CreditCard as Edit,
  Euro,
  Filter,
  Plus,
  Search,
  Trash2,
  User,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { ServiceForm } from "../components/services/ServiceForm";
import { usePermissions } from "../hooks/usePermissions";
import { exportWorkOrderPdf } from "../lib/pdf/exportWorkOrder";
import { customersRepository } from "../lib/repositories/customersRepository";
import { servicesRepository } from "../lib/repositories/servicesRepository";
import { vehiclesRepository } from "../lib/repositories/vehiclesRepository";
import type { Customer, Vehicle } from "../types";
import { logError } from "../utils/errorHandler";

interface ServiceRecord {
  id: string;
  vehicle_id: string;
  date: string;
  description: string;
  mileage: number;
  notes: string;
  total: number;
  match_field?: string | null;
  vehicle?: {
    id: string;
    make: string;
    model: string;
    year: number;
    license_plate?: string | null;
    customer?: {
      id: string;
      name: string;
      email?: string | null;
      phone?: string | null;
    };
  };
}

export function ServicesPage() {
  const permissions = usePermissions();
  const [services, setServices] = useState<ServiceRecord[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ServiceRecord | null>(
    null,
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [searchField, setSearchField] = useState("all");
  const [filterBy, setFilterBy] = useState("all");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(50);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const handleSaveService = async () => {
    setShowForm(false);
    setEditingRecord(null);

    await fetchServices(); // ✅ refresh list immediately
  };

  const handleVehiclesChanged = async (customerId: string) => {
    const items = await vehiclesRepository.listVehiclesByCustomer(customerId);
    setVehicles(items);
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([fetchServices(), fetchVehicles(), fetchCustomers()]);
      } catch (error) {
        console.error("Error loading services data:", error);
        setLoading(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (loading) return;
    setCurrentPage(1);
  }, [searchTerm, searchField, filterBy]);

  useEffect(() => {
    if (loading) return;
    fetchServices();
  }, [currentPage, recordsPerPage, searchTerm, searchField, filterBy]);

  const fetchServices = async () => {
    try {
      setError(null);

      const result = await servicesRepository.listServices(
        searchTerm,
        {},
        currentPage,
        recordsPerPage,
      );

      const data = Array.isArray((result as any)?.items)
        ? (result as any).items
        : [];
      console.log("SERVICE SAMPLE:", data[0]);
      const total =
        typeof (result as any)?.total === "number" ? (result as any).total : 0;

      setTotalRecords(total);

      const parseServiceLines = (service: any) => {
        // 1) αν έρχεται ήδη array
        if (Array.isArray(service.services)) return service.services;

        // 2) αν έρχεται JSON string
        const raw =
          typeof service.services_json === "string"
            ? service.services_json
            : typeof service.servicesJson === "string"
              ? service.servicesJson
              : typeof service.services === "string"
                ? service.services
                : null;

        if (!raw) return [];

        try {
          const parsed = JSON.parse(raw);
          return Array.isArray(parsed) ? parsed : [];
        } catch {
          return [];
        }
      };

      const mappedServices: ServiceRecord[] = data.map((service: any) => {
        const parseLines = (service: any) => {
          // δοκίμασε σε σειρά πιθανών πεδίων
          const candidates = [
            service.services_json,
            service.servicesJson,
            service.services,
            service.services_json_text,
            service.services_json_string,
          ];

          const raw = candidates.find((x) => x !== undefined && x !== null);

          if (!raw) return [];

          if (Array.isArray(raw)) return raw;

          if (typeof raw === "string") {
            try {
              const parsed = JSON.parse(raw);
              return Array.isArray(parsed) ? parsed : [];
            } catch {
              return [];
            }
          }

          return [];
        };

        const linesRaw = parseServiceLines(service);

        if (linesRaw.length === 0) {
          console.log("NO LINES FOR SERVICE:", service.id, service);
        }

        const servicesLines = linesRaw.map((l: any, idx: number) => ({
          id: l.id ?? Date.now() + idx,
          description: l.description ?? "",
          quantity: Number(l.quantity ?? 1),
          unit_price: Number(l.unit_price ?? 0),
        }));

        const subtotal =
          typeof service.subtotal === "number"
            ? service.subtotal
            : servicesLines.reduce(
                (sum: number, l: any) =>
                  sum + (Number(l.quantity) || 0) * (Number(l.unit_price) || 0),
                0,
              );

        const vat =
          typeof service.vat === "number" ? service.vat : subtotal * 0.24;

        const total =
          typeof service.total === "number" ? service.total : subtotal + vat;

        return {
          id: service.id,
          vehicle_id: service.vehicle_id,
          date: service.date,
          description: service.description,
          mileage: service.mileage,
          notes: service.notes,

          // ✅ ΝΕΑ: για να δουλέψει σωστά το Edit modal
          services: servicesLines,
          subtotal,
          vat,
          total,

          vehicle: service.vehicle_id
            ? {
                id: service.vehicle_id,
                make: service.vehicle_make,
                model: service.vehicle_model,
                year: service.vehicle_year,
                license_plate: service.vehicle_license_plate,
                customer: service.customer_id
                  ? {
                      id: service.customer_id,
                      name: service.customer_name,
                      email: service.customer_email,
                      phone: service.customer_phone,
                    }
                  : undefined,
              }
            : undefined,
        };
      });

      setServices(mappedServices);

      const revenue = data.reduce(
        (sum: number, service: any) => sum + (service.total ?? 0),
        0,
      );
      setTotalRevenue(revenue);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load service records";

      console.error("Error fetching services:", err);
      setError(errorMessage);
      setServices([]); // ΠΟΤΕ undefined
      setTotalRecords(0);
      setTotalRevenue(0);

      logError("Failed to load service records", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchVehicles = async (): Promise<void> => {
    // intentionally empty – vehicles loaded dynamically
    return;
  };

  const fetchCustomers = async () => {
    try {
      const result = await customersRepository.listCustomers("", 1, 10000);

      const items = Array.isArray((result as any)?.items)
        ? (result as any).items
        : [];

      console.log("ServicesPage customers loaded:", items.length);

      const mappedCustomers = items.map((customer: any) => ({
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      afm: customer.afm ?? null,
      created_at: customer.created_at,
      updated_at: customer.updated_at ?? customer.created_at,
      user_id: customer.user_id ?? "",
}));

setCustomers(mappedCustomers);
    } catch (err) {
      console.error("Error fetching customers (ServicesPage):", err);
      setCustomers([]);
    }
  };

  const handleExportPDF = async (service: ServiceRecord) => {
    try {
      const customerId = service.vehicle?.customer?.id;

      const customer = customers.find((c) => c.id === customerId);
      if (!customerId || !customer) {
        alert("Customer information not found");
        return;
      }

      // Πάρε full vehicle από repository (μέσω customer)
      // Πάρε full vehicle από repository (μέσω customer)
      const customerVehicles =
        await vehiclesRepository.listVehiclesByCustomer(customerId);

      const found = customerVehicles.find(
        (v: any) => v.id === service.vehicle_id,
      );

      if (!found) {
        alert("Vehicle information not found");
        return;
      }

      const normalizedVehicle: Vehicle = {
        id: found.id ?? service.vehicle_id,
        customer_id: found.customer_id ?? customerId,
        make: found.make ?? "",
        model: found.model ?? "",
        year: found.year ?? 0,
        license_plate: found.license_plate ?? "",
        vin: found.vin ?? "",
        created_at: found.created_at ?? new Date().toISOString(),
      };

      await exportWorkOrderPdf(customer, normalizedVehicle, service.id);
    } catch (error) {
      logError("Error exporting PDF", error);
      alert("Error exporting PDF");
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    if (!confirm("Are you sure you want to delete this service record?")) {
      return;
    }

    try {
      await servicesRepository.deleteService(serviceId);
      await fetchServices();
    } catch (error) {
      logError("Error deleting service", error);
      alert("Error deleting service record");
    }
  };

  const handleEdit = (service: ServiceRecord) => {
    setEditingRecord(service);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingRecord(null);
  };

  const handleSave = () => {
    setCurrentPage(1);
    fetchServices();
    handleCloseForm();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                Error Loading Services
              </h3>
              <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                {error}
              </p>
              <button
                onClick={() => {
                  setError(null);
                  fetchServices();
                }}
                className="mt-2 text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-500 dark:hover:text-red-300"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Services
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage service records and work orders
          </p>
        </div>
        {permissions.canEditServices && (
          <button
            onClick={async () => {
              await fetchCustomers(); // φόρτωσε customers
              setEditingRecord(null); // ✅ καθάρισε edit mode
              setShowForm(true); // άνοιξε modal
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>New Service</span>
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-200 dark:border-slate-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Calendar className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Total Services
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {totalRecords}
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
                This Month
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {
                  services.filter(
                    (s) =>
                      new Date(s.date).getMonth() === new Date().getMonth(),
                  ).length
                }
              </p>
            </div>
          </div>
        </div>

        {permissions.canViewFinancials && (
          <>
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-200 dark:border-slate-700">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <Euro className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Total Revenue
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    €{totalRevenue.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-200 dark:border-slate-700">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-orange-500/20 rounded-lg">
                  <User className="w-6 h-6 text-orange-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Avg per Service
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    €
                    {totalRecords > 0
                      ? (totalRevenue / totalRecords).toFixed(2)
                      : "0.00"}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-200 dark:border-slate-700">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder={
                  searchField === "customer"
                    ? "Search by customer name..."
                    : searchField === "vehicle"
                      ? "Search by vehicle make/model..."
                      : searchField === "license_plate"
                        ? "Search by license plate..."
                        : searchField === "description"
                          ? "Search by description/notes..."
                          : "Search by customer, vehicle, license plate, or description..."
                }
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  title="Clear search"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <select
                value={searchField}
                onChange={(e) => setSearchField(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                title="Select search field"
              >
                <option value="all">All Fields</option>
                <option value="customer">Customer Only</option>
                <option value="vehicle">Vehicle Only</option>
                <option value="license_plate">License Plate Only</option>
                <option value="description">Description Only</option>
              </select>
              <select
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Services</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="high-value">High Value (€500+)</option>
              </select>
            </div>
          </div>
          {searchTerm && (
            <div className="flex items-center justify-between text-sm">
              <div className="text-gray-600 dark:text-gray-400">
                <Filter className="w-4 h-4 inline mr-2" />
                Found{" "}
                <span className="font-semibold text-gray-900 dark:text-white">
                  {totalRecords}
                </span>{" "}
                {totalRecords === 1 ? "record" : "records"} matching "
                {searchTerm}"
                {searchField !== "all" && (
                  <span className="ml-1">
                    in{" "}
                    <span className="font-semibold">
                      {searchField === "customer"
                        ? "customer names"
                        : searchField === "vehicle"
                          ? "vehicles"
                          : searchField === "license_plate"
                            ? "license plates"
                            : "descriptions"}
                    </span>
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Services Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-slate-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Vehicle
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Description
                </th>
                {permissions.canViewFinancials && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Total
                  </th>
                )}
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
              {services.map((service) => (
                <tr
                  key={service.id}
                  className="hover:bg-gray-50 dark:hover:bg-slate-700"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    <div className="flex items-center gap-2">
                      <span>{new Date(service.date).toLocaleDateString()}</span>
                      {searchTerm && service.match_field && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          {service.match_field === "customer" && "Customer"}
                          {service.match_field === "vehicle" && "Vehicle"}
                          {service.match_field === "license_plate" && "Plate"}
                          {service.match_field === "description" &&
                            "Description"}
                          {service.match_field === "notes" && "Notes"}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {service.vehicle ? (
                      <div>
                        <div className="font-medium">
                          {service.vehicle.year} {service.vehicle.make}{" "}
                          {service.vehicle.model}
                        </div>
                        {service.vehicle.license_plate && (
                          <div className="text-gray-500 dark:text-gray-400">
                            {service.vehicle.license_plate}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-500 dark:text-gray-400">
                        Unknown Vehicle
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {service.vehicle?.customer?.name || "Unknown Customer"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    <div
                      className="max-w-xs truncate"
                      title={service.description}
                    >
                      {service.description}
                    </div>
                  </td>
                  {permissions.canViewFinancials && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      €{service.total?.toFixed(2) || "0.00"}
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center justify-center space-x-2">
                      {permissions.canEditServices && (
                        <button
                          onClick={() => handleEdit(service)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 p-1 rounded"
                          title="Edit Service"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleExportPDF(service)}
                        className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 p-1 rounded"
                        title="Export PDF"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      {permissions.canEditServices && (
                        <button
                          onClick={() => handleDeleteService(service.id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 p-1 rounded"
                          title="Delete Service"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {services.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              No services found
            </h3>
            <p className="mt-1 text-gray-500 dark:text-gray-400">
              {searchTerm || filterBy !== "all"
                ? "Try adjusting your search or filters."
                : "Get started by creating a new service record."}
            </p>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {totalRecords > 0 && (
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-200 dark:border-slate-700">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Records per page selector */}
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-600 dark:text-gray-400">
                Records per page:
              </label>
              <select
                value={recordsPerPage}
                onChange={(e) => {
                  setRecordsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-3 py-1 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={250}>250</option>
                <option value={500}>500</option>
              </select>
            </div>

            {/* Page info */}
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Showing {(currentPage - 1) * recordsPerPage + 1} to{" "}
              {Math.min(currentPage * recordsPerPage, totalRecords)} of{" "}
              {totalRecords} records
            </div>

            {/* Page navigation */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-slate-600"
              >
                First
              </button>
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-slate-600"
              >
                Previous
              </button>

              {/* Page numbers */}
              <div className="flex items-center space-x-1">
                {Array.from(
                  {
                    length: Math.min(
                      5,
                      Math.ceil(totalRecords / recordsPerPage),
                    ),
                  },
                  (_, i) => {
                    const totalPages = Math.ceil(totalRecords / recordsPerPage);
                    let pageNum;

                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-1 border rounded-lg ${
                          currentPage === pageNum
                            ? "bg-blue-600 text-white border-blue-600"
                            : "border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-600"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  },
                )}
              </div>

              <button
                onClick={() =>
                  setCurrentPage((prev) =>
                    Math.min(
                      Math.ceil(totalRecords / recordsPerPage),
                      prev + 1,
                    ),
                  )
                }
                disabled={
                  currentPage >= Math.ceil(totalRecords / recordsPerPage)
                }
                className="px-3 py-1 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-slate-600"
              >
                Next
              </button>
              <button
                onClick={() =>
                  setCurrentPage(Math.ceil(totalRecords / recordsPerPage))
                }
                disabled={
                  currentPage >= Math.ceil(totalRecords / recordsPerPage)
                }
                className="px-3 py-1 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-slate-600"
              >
                Last
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Service Form Modal */}
      {showForm && (
        <ServiceForm
          key={editingRecord ? editingRecord.id : "new"}
          vehicles={vehicles}
          customers={customers}
          editingRecord={editingRecord}
          onClose={() => setShowForm(false)}
          onSave={handleSaveService}
          onVehiclesChanged={handleVehiclesChanged}
        />
      )}
    </div>
  );
}
