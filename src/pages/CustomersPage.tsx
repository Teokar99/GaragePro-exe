import {
  Car,
  Filter,
  MapPin,
  Phone,
  Plus,
  Search,
  Users,
  X,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { CustomerForm } from "../components/customers/CustomerForm";
import { CustomerList } from "../components/customers/CustomerList";
import { Modal } from "../components/ui/Modal";
import { VehicleForm } from "../components/vehicles/VehicleForm";
import { usePermissions } from "../hooks/usePermissions";
import { customersRepository } from "../lib/repositories/customersRepository";
import type { Customer } from "../types";
import { searchMatch } from "../utils/search";


export const CustomersPage: React.FC<{
  onNavigate: (page: string, data?: any) => void;
}> = ({ onNavigate }) => {
  const permissions = usePermissions();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [showVehicleForm, setShowVehicleForm] = useState(false);

  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(50);
  const [stats, setStats] = useState<CustomerStats | null>(null);
  const [totalRecords, setTotalRecords] = useState(0);
  const customerInputRef = useRef<HTMLInputElement>(null);
  
  type CustomerWithCount = Customer & { vehicle_count?: number };
  type CustomerStats = {
    total_customers: number;
    total_vehicles: number;
    multi_vehicle_customers?: number; // optional αν δεν το έχεις ακόμα στο Rust
  };
  const loadStats = async () => {
    try {
      const s = await customersRepository.getCustomerStats();
      setStats(s);
    } catch (e) {
      console.error("Failed to load stats", e);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => {
      setSearchTerm(searchInput);
    }, 400);

    return () => window.clearTimeout(id);
  }, [searchInput]);

  const [selectedCustomerForVehicle, setSelectedCustomerForVehicle] =
    useState<CustomerWithCount | null>(null);

  const [allCustomersForVehicleModal, setAllCustomersForVehicleModal] =
    useState<CustomerWithCount[]>([]);

  const [
    loadingAllCustomersForVehicleModal,
    setLoadingAllCustomersForVehicleModal,
  ] = useState(false);

  useEffect(() => {
    if (showVehicleForm) {
      setShowCustomerDropdown(true);
      setTimeout(() => customerInputRef.current?.focus(), 0);
    }
  }, [showVehicleForm]);
  useEffect(() => {
    console.log("CustomersPage MOUNT");
    return () => console.log("CustomersPage UNMOUNT");
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowCustomerDropdown(false);
      }
    };

    if (showCustomerDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showCustomerDropdown]);

  useEffect(() => {
    const loadData = async () => {
      try {
        await loadCustomers();
      } catch (error) {
        console.error("Error loading customers:", error);
        setLoading(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus]);

  useEffect(() => {
    loadCustomers();
  }, [currentPage, recordsPerPage, searchTerm, filterStatus]);

  const loadCustomers = async () => {
    try {
      setLoading(true);

      const result = await customersRepository.listCustomers(
        searchTerm,
        currentPage,
        recordsPerPage,
      );

      setTotalRecords(result.total);

      // ✅ DEFINE list PROPERLY (THIS FIXES THE ERROR)
      const list = (result as any).items ?? (result as any).data ?? [];

      const mappedCustomers = list.map((customer: any) => ({
        ...customer,
        vehicles: [], // never fill with nulls
        vehicle_count: Number(customer.vehicle_count) || 0,
      }));

      // Apply client-side filters
      let filteredData = mappedCustomers;

      if (filterStatus === "recent") {
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        filteredData = filteredData.filter(
          (customer: any) =>
            (customer.vehicle_count ?? (customer.vehicles?.length || 0)) > 1,
        );
      } else if (filterStatus === "multi-vehicle") {
        filteredData = filteredData.filter(
          (customer: any) => customer.vehicle_count > 1,
        );
      }

      setCustomers(filteredData);
    } catch (error) {
      console.error("Error loading customers:", error);
    } finally {
      setLoading(false);
    }
  };
  const fetchAllCustomersForVehicleModal = async () => {
    try {
      setLoadingAllCustomersForVehicleModal(true);

      // Φέρνουμε ΟΛΟΥΣ μέσω pagination (works τώρα, χωρίς νέο command)
      const perPage = 500;
      let page = 1;
      let all: CustomerWithCount[] = [];

      while (true) {
        const res = await customersRepository.listCustomers("", page, perPage);
        const items = Array.isArray((res as any)?.items)
          ? (res as any).items
          : [];

        const mapped = items.map((c: any) => ({
          ...c,
          vehicle_count: Number(c.vehicle_count) || 0,
          vehicles: c.vehicles ?? [],
        })) as CustomerWithCount[];

        all = all.concat(mapped);

        if (items.length < perPage) break;
        page += 1;
        if (page > 50) break; // safety
      }

      setAllCustomersForVehicleModal(all);
      console.log("ALL MODAL CUSTOMERS SAMPLE:", all.slice(0, 3));
    } catch (e) {
      console.error("Failed to load all customers for vehicle modal", e);
      setAllCustomersForVehicleModal([]);
    } finally {
      setLoadingAllCustomersForVehicleModal(false);
    }
  };

  const handleAddCustomer = () => {
    setEditingCustomer(null);
    setShowCustomerForm(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    setShowCustomerForm(true);
  };

  const handleCloseForm = () => {
    setShowCustomerForm(false);
    setEditingCustomer(null);
  };

  const handleSaveCustomer = () => {
    loadCustomers();
    loadStats();
    handleCloseForm();
  };

  const handleAddVehicle = async () => {
    await fetchAllCustomersForVehicleModal(); // ✅ φορτώνει όλους με vehicle_count
    setShowVehicleForm(true);
    setShowCustomerDropdown(true);
    setCustomerSearchTerm("");
    setSelectedCustomerForVehicle(null);
  };

  const handleCloseVehicleForm = () => {
    setShowVehicleForm(false);
    setSelectedCustomerForVehicle(null);
    setCustomerSearchTerm("");
    setShowCustomerDropdown(false);
  };

const filteredCustomersForVehicle =
  customerSearchTerm.trim() === ""
    ? allCustomersForVehicleModal
    : allCustomersForVehicleModal.filter((customer) =>
        searchMatch(
          customerSearchTerm,
          customer.name,
          customer.email,
          customer.phone
        )
      );

  

  const handleSaveVehicle = () => {
    loadCustomers();
    loadStats();
    handleCloseVehicleForm();
  };

  const handleDeleteCustomer = async (customerId: string) => {
    try {
      await customersRepository.deleteCustomer(customerId);
      await loadCustomers();
      await loadStats();
    } catch (error) {
      console.error("Error deleting customer:", error);
    }
  };

  const totalVehicles = customers.reduce(
    (sum, customer: any) =>
      sum + (customer.vehicle_count ?? (customer.vehicles?.length || 0)),
    0,
  );

  const customersWithMultipleVehicles = customers.filter(
    (customer: any) =>
      (customer.vehicle_count ?? (customer.vehicles?.length || 0)) > 1,
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Customers
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Manage your customer database
          </p>
        </div>
        {permissions.canEditCustomers && (
          <div className="flex space-x-3">
            <button
              onClick={handleAddVehicle}
              className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Car className="w-5 h-5" />
              <span>Add Vehicle</span>
            </button>
            <button
              onClick={handleAddCustomer}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>Add Customer</span>
            </button>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
                Total Vehicles
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats?.total_vehicles ?? 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-200 dark:border-slate-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <MapPin className="w-6 h-6 text-purple-500" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Multi-Vehicle
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {customersWithMultipleVehicles}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-200 dark:border-slate-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-500/20 rounded-lg">
              <Phone className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Avg. Vehicles
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats && stats.total_customers > 0
                  ? (stats.total_vehicles / stats.total_customers).toFixed(1)
                  : "0.0"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-200 dark:border-slate-700">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search customers..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Customers</option>
              <option value="recent">Recent</option>
              <option value="multi-vehicle">Multi-Vehicle</option>
            </select>
          </div>
        </div>
      </div>

      {/* Customers List */}
      <div className="relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/60 dark:bg-slate-800/60 z-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}

        <CustomerList
          customers={customers}
          onEdit={handleEditCustomer}
          onDelete={handleDeleteCustomer}
          canEdit={permissions.canEditCustomers}
        />
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
              {totalRecords} customers
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

      {/* Customer Form Modal */}
      <Modal
        isOpen={showCustomerForm}
        onClose={handleCloseForm}
        title={editingCustomer ? "Edit Customer" : "Add New Customer"}
        maxWidth="max-w-2xl"
      >
        <CustomerForm
          customer={editingCustomer}
          onClose={handleCloseForm}
          onSave={handleSaveCustomer}
        />
      </Modal>

      {/* Add Vehicle Modal */}
      {showVehicleForm && (
        <Modal
          isOpen={showVehicleForm}
          onClose={handleCloseVehicleForm}
          title="Add Vehicle to Customer"
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Customer *
              </label>
              <div className="relative" ref={dropdownRef}>
                <div className="relative">
                  <input
                    type="text"
                    value={customerSearchTerm}
                    onChange={(e) => {
                      const v = e.target.value;
                      setCustomerSearchTerm(v);
                      setShowCustomerDropdown(true);

                      // αν αρχίσεις να πληκτρολογείς ενώ έχεις επιλογή, καθάρισε την επιλογή
                      if (selectedCustomerForVehicle)
                        setSelectedCustomerForVehicle(null);
                    }}
                    onFocus={() => setShowCustomerDropdown(true)}
                    placeholder="Type customer name, email, or phone..."
                    className="w-full px-4 py-2.5 pr-10 rounded-xl border border-gray-300/60 dark:border-slate-600/60
bg-white dark:bg-slate-800 text-gray-900 dark:text-white
placeholder:text-gray-400 dark:placeholder:text-gray-400
shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500/60"
                  />

                  {selectedCustomerForVehicle && (
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setSelectedCustomerForVehicle(null);
                        setCustomerSearchTerm("");
                        setShowCustomerDropdown(false);
                      }}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                {showCustomerDropdown && (
                  <div className="absolute z-10 w-full mt-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl overflow-hidden">
                    <div className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-slate-700">
                      {loadingAllCustomersForVehicleModal
                        ? "Loading customers..."
                        : `${filteredCustomersForVehicle.length} results`}
                    </div>

                    <div className="max-h-72 overflow-y-auto py-1">
                      {/* Loading (χωρίς να αλλάζει όλο το tree) */}
                      {loadingAllCustomersForVehicleModal && (
                        <div className="px-3 py-3 text-sm text-gray-500 dark:text-gray-300">
                          Loading customers...
                        </div>
                      )}

                      {/* Results */}
                      {!loadingAllCustomersForVehicleModal &&
                        filteredCustomersForVehicle.length > 0 &&
                        filteredCustomersForVehicle
                          .sort((a, b) => a.name.localeCompare(b.name))
                          .map((customer) => (
                            <button
                              key={customer.id}
                              type="button"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                setSelectedCustomerForVehicle(customer);
                                setCustomerSearchTerm(
                                  `${customer.name}${customer.phone ? ` - ${customer.phone}` : ""}`,
                                );
                                setShowCustomerDropdown(false);
                              }}
                              className={`w-[calc(100%-0.5rem)] mx-1 my-1 text-left px-4 py-3 rounded-lg transition active:scale-[0.99]
            ${
              selectedCustomerForVehicle?.id === customer.id
                ? "bg-blue-100/70 dark:bg-blue-900/35 ring-1 ring-blue-500/30"
                : "hover:bg-blue-50 dark:hover:bg-blue-900/20"
            }`}
                            >
                              <div className="font-semibold leading-tight text-gray-900 dark:text-white">
                                {customer.name}
                              </div>

                              <div className="text-sm mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-gray-600 dark:text-gray-300">
                                <span className="font-medium text-gray-700 dark:text-gray-200">
                                  {customer.phone ?? "-"}
                                </span>
                                <span className="text-gray-400 dark:text-gray-500">
                                  •
                                </span>
                                <span className="text-gray-600 dark:text-gray-300">
                                  {customer.email ?? "-"}
                                </span>
                              </div>
                            </button>
                          ))}

                      {/* Empty state */}
                      {!loadingAllCustomersForVehicleModal &&
                        filteredCustomersForVehicle.length === 0 && (
                          <div className="px-3 py-3 text-sm text-gray-500 dark:text-gray-300">
                            No customers found
                          </div>
                        )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {selectedCustomerForVehicle && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                  Selected Customer:
                </h4>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>{selectedCustomerForVehicle.name}</strong>
                  <br />
                  {selectedCustomerForVehicle.phone} •{" "}
                  {selectedCustomerForVehicle.email}
                  {selectedCustomerForVehicle.address && (
                    <>
                      <br />
                      {selectedCustomerForVehicle.address}
                    </>
                  )}
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                  Current vehicles:{" "}
                  {selectedCustomerForVehicle?.vehicle_count ?? 0}
                </p>
              </div>
            )}

            {selectedCustomerForVehicle && (
              <>
                {console.log(
                  "Rendering VehicleForm for:",
                  selectedCustomerForVehicle.id,
                )}
                <VehicleForm
                  customerId={selectedCustomerForVehicle.id}
                  onClose={handleCloseVehicleForm}
                  onSave={() => {
                    console.log("VehicleForm onSave fired");
                    handleSaveVehicle();
                  }}
                />
              </>
            )}

            {!selectedCustomerForVehicle && (
              <div className="text-center py-8">
                <Car className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                  Select a Customer
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Choose a customer from the dropdown to add a vehicle to their
                  account.
                </p>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
