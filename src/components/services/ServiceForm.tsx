/* eslint-disable @typescript-eslint/no-explicit-any */
import { ChevronDown, Plus, Trash2, X } from "lucide-react";
import React, { useState } from "react";
import { servicesRepository } from "../../lib/repositories/servicesRepository";
import { vehiclesRepository } from "../../lib/repositories/vehiclesRepository";
import type { Customer, Vehicle } from "../../types";
import { getErrorMessage, logError } from "../../utils/errorHandler";
import { normalize } from "../../utils/search";
import { VehicleForm } from "../vehicles/VehicleForm";

interface ServiceLine {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
}
type ServiceFormEditingRecord = {
  id: string;
  vehicle_id: string;
  date: string;
  mileage: number;
  notes?: string;
  description?: string;
  total?: number;
  services?: { description: string; quantity: number; unit_price: number }[];
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
};
interface ServiceFormProps {
  vehicles: Vehicle[];
  customers: Customer[]; // 👈 ΠΡΟΣΘΗΚΗ
  editingRecord?: ServiceFormEditingRecord | null;
  selectedVehicle?: Vehicle | null;
  lockCustomerVehicle?: boolean;
  onClose: () => void;
  onSave: () => void;
  onVehiclesChanged: (customerId: string) => Promise<void> | void;
}

export const ServiceForm: React.FC<ServiceFormProps> = ({

  selectedVehicle,
  customers,
  editingRecord,
  lockCustomerVehicle = false,
  onVehiclesChanged,
  onClose,
  onSave,
}) => {
  const formatVehicleLabel = (vehicle?: {
    year?: number | null;
    make?: string | null;
    model?: string | null;
    license_plate?: string | null;
  } | null) => {
    if (!vehicle) return "";

    const main = [vehicle.year, vehicle.make, vehicle.model]
      .filter((part) => part !== undefined && part !== null && `${part}`.trim() !== "")
      .join(" ");

    if (vehicle.license_plate) {
      return main ? `${main} - ${vehicle.license_plate}` : vehicle.license_plate;
    }

    return main;
  };

  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [formData, setFormData] = useState({
    vehicle_id: editingRecord?.vehicle_id || selectedVehicle?.id || "",
    date:
      editingRecord?.date.split("T")[0] ||
      new Date().toISOString().split("T")[0],
    mileage: editingRecord?.mileage || 0,
    notes: editingRecord?.notes || "",
    services: [
      {
        id: crypto.randomUUID(),
        description: "",
        quantity: 1,
        unit_price: 0,
      },
    ] as ServiceLine[],
  });
  const [allCustomers, setAllCustomers] = useState<any[]>([]);
  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [vehicleSearchInput, setVehicleSearchInput] = useState("");
  const [showVehicleDropdown, setShowVehicleDropdown] = useState(false);
  const [customerSearchInput, setCustomerSearchInput] = useState("");
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [customerVehicles, setCustomerVehicles] = useState<Vehicle[]>([]);

  // παίρνει customers από props
  React.useEffect(() => {
    setAllCustomers(customers ?? []);
  }, [customers]);

  React.useEffect(() => {
    if (!selectedCustomerId || customerSearchInput.trim() !== "") return;

    const matchedCustomer = customers.find(
      (customer) => customer.id === selectedCustomerId,
    );

    if (matchedCustomer?.name) {
      setCustomerSearchInput(matchedCustomer.name);
    }
  }, [customerSearchInput, customers, selectedCustomerId]);

  React.useEffect(() => {
    console.log("ServiceForm customers prop:", customers?.length);
    console.log("ServiceForm allCustomers:", allCustomers.length);
  }, [customers, allCustomers]);

  // Fetch vehicles for the selected customer
  React.useEffect(() => {
    const loadCustomerVehicles = async () => {
      if (!selectedCustomerId) {
        setCustomerVehicles([]);
        return;
      }

      try {
        const fetchedVehicles =
          await vehiclesRepository.listVehiclesByCustomer(selectedCustomerId);

        const mappedVehicles: Vehicle[] = fetchedVehicles.map(
          (vehicle: any) => ({
            id: vehicle.id,
            customer_id: vehicle.customer_id,
            make: vehicle.make,
            model: vehicle.model,
            year: vehicle.year,
            license_plate: vehicle.license_plate,
            vin: vehicle.vin,
            created_at: vehicle.created_at ?? new Date().toISOString(),
          }),
        );

        setCustomerVehicles(mappedVehicles);
      } catch (error) {
        logError("Error loading customer vehicles", error);
        setCustomerVehicles([]);
      }
    };

    loadCustomerVehicles();
  }, [selectedCustomerId]);

  // Filter customers by search input
  const filteredCustomers = allCustomers.filter((customer) => {
    const q = normalize(customerSearchInput);
    const customerDisplay = normalize(
      `${customer.name} ${customer.phone || ""} ${customer.email || ""}`
    );
    return customerDisplay.includes(q);
  });

  // Filter vehicles by search input
  const filteredVehicles = customerVehicles.filter((vehicle) => {
    const q = normalize(vehicleSearchInput);
    const vehicleDisplay = normalize(
      `${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.license_plate || ""}`
    );
    return vehicleDisplay.includes(q);
  });

  // Initialize form data when editing
  React.useEffect(() => {
    if (!editingRecord) return;
    console.log(
      "EDIT SERVICES DEBUG:",
      typeof editingRecord.services,
      editingRecord.services,
    );
    let editServices: ServiceLine[] = [];

    if (Array.isArray(editingRecord.services)) {
    editServices = editingRecord.services.map((service) => ({
    id: crypto.randomUUID(),
    description: service.description || '',
    quantity: service.quantity || 1,
    unit_price: service.unit_price || 0,
}));

    } else if (typeof (editingRecord as any).services === "string") {
      try {
        const parsed = JSON.parse((editingRecord as any).services);
        if (Array.isArray(parsed)) {
          editServices = parsed.map((s: any, index: number) => ({
            id: s.id ?? Date.now() + index,
            description: s.description ?? "",
            quantity: Number(s.quantity ?? 1),
            unit_price: Number(s.unit_price ?? 0),
          }));
        }
      } catch {
        editServices = [];
      }
    }

if (editServices.length === 0) {
  editServices = [
    { id: crypto.randomUUID(), description: "", quantity: 1, unit_price: 0 },
  ];
}


    setFormData({
      vehicle_id: editingRecord.vehicle_id ?? "",
      date: (editingRecord.date ?? new Date().toISOString()).split("T")[0],
      mileage: editingRecord.mileage ?? 0,
      notes: editingRecord.notes ?? "",
      services: editServices,
    });

    const customer = editingRecord.vehicle?.customer;
    const vehicle = editingRecord.vehicle;

    setSelectedCustomerId(customer?.id ?? "");
    setCustomerSearchInput(customer?.name ?? "");
    setVehicleSearchInput(formatVehicleLabel(vehicle));
  }, [editingRecord]);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest("[data-vehicle-dropdown]")) {
        setShowVehicleDropdown(false);
      }
      if (!target.closest("[data-customer-dropdown]")) {
        setShowCustomerDropdown(false);
      }
    };

    if (showVehicleDropdown || showCustomerDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showVehicleDropdown, showCustomerDropdown]);

  const addServiceLine = () => {
    setFormData((prev) => ({
      ...prev,
      services: [
        ...prev.services,
        {
          id: crypto.randomUUID(),
          description: "",
          quantity: 1,
          unit_price: 0,
        },
      ],
    }));
  };

  const removeServiceLine = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      services: prev.services.filter((s) => s.id !== id),
    }));
  };

const updateServiceLine = (id: string, field: string, value: any) => {
  setFormData((prev) => ({
    ...prev,
    services: prev.services.map((s) =>
      s.id === id ? { ...s, [field]: value } : s
    ),
  }));
};

  const subtotal = React.useMemo(() => {
    return formData.services.reduce((sum, line) => {
      const qty = Number(line.quantity) || 0;
      const price = Number(line.unit_price) || 0;
      return sum + qty * price;
    }, 0);
  }, [formData.services]);

  const vat = 0;
  const total = subtotal;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.vehicle_id || formData.services.length === 0) {
      alert("Please select a vehicle and add at least one service line.");
      return;
    }

    const hasDescription = formData.services.some(
      (s) => s.description && s.description.trim() !== "",
    );
    if (!hasDescription) {
      alert("Please add a description in at least one line.");
      return;
    }

    const summaryDescription = formData.services
      .map((s) => s.description?.trim())
      .filter(Boolean)
      .join(" | ")
      .slice(0, 255);

    const payload = {
      vehicle_id: formData.vehicle_id,
      mechanic_id: null,
      date: formData.date,
      mileage: formData.mileage,
      notes: formData.notes,
      description: summaryDescription || "Service",
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      services: formData.services.map(({ id, ...rest }) => ({
        description: rest.description || "Service",
        quantity: rest.quantity || 1,
        unit_price: rest.unit_price || 0,
        total: (rest.quantity || 1) * (rest.unit_price || 0),
      })),
      subtotal,
      vat,
      total,
    };

    try {
      if (editingRecord) {
        await servicesRepository.updateService(editingRecord.id, payload);
      } else {
        await servicesRepository.createService(payload);
      }

      onSave();
      onClose();
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      logError("Error adding service", error);
      alert("Error adding service: " + errorMessage);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 dark:bg-black bg-opacity-75 dark:bg-opacity-70 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-6xl w-full my-8 max-h-[90vh] flex flex-col">
        <div className="flex-shrink-0 flex justify-between items-center p-6 pb-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {editingRecord ? "Edit Service" : "New Service"}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="Close modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Customer *
                </label>
                <div className="relative" data-customer-dropdown>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="🔍 Search customer (name, phone, email)..."
                      value={customerSearchInput}
                      onChange={(e) => setCustomerSearchInput(e.target.value)}
                      onFocus={() =>
                        !lockCustomerVehicle && setShowCustomerDropdown(true)
                      }
                      readOnly={lockCustomerVehicle}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white read-only:bg-gray-100 read-only:cursor-not-allowed"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>

                  {showCustomerDropdown && !lockCustomerVehicle && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                      {filteredCustomers.length > 0 ? (
                        filteredCustomers
                          .sort((a, b) => a.name.localeCompare(b.name))
                          .map((customer) => (
                            <button
                              key={customer.id}
                              type="button"
                              onClick={() => {
                                setSelectedCustomerId(customer.id);
                                setCustomerSearchInput(customer.name);
                                setFormData({ ...formData, vehicle_id: "" });
                                setVehicleSearchInput("");
                                setShowCustomerDropdown(false);
                              }}
                              className="w-full text-left px-3 py-2 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none transition-colors border-b border-gray-100 last:border-b-0"
                            >
                              <div className="font-medium text-sm text-gray-900">
                                👤 {customer.name}
                              </div>
                              <div className="text-xs text-gray-500">
                                {customer.phone && `📱 ${customer.phone}`}
                                {customer.email && ` • ${customer.email}`}
                              </div>
                            </button>
                          ))
                      ) : (
                        <div className="px-3 py-2 text-sm text-gray-500 text-center">
                          No customers found
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Vehicle *
                </label>
                <div className="relative" data-vehicle-dropdown>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder={
                        !selectedCustomerId
                          ? "🚫 Select customer first..."
                          : "🔍 Search vehicle (year, make, model, plate)..."
                      }
                      value={vehicleSearchInput}
                      onChange={(e) => setVehicleSearchInput(e.target.value)}
                      onFocus={() =>
                        !lockCustomerVehicle &&
                        selectedCustomerId &&
                        setShowVehicleDropdown(true)
                      }
                      readOnly={lockCustomerVehicle}
                      disabled={!selectedCustomerId}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white disabled:bg-gray-100 disabled:cursor-not-allowed read-only:bg-gray-100 read-only:cursor-not-allowed"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>

                  {showVehicleDropdown && selectedCustomerId && !lockCustomerVehicle && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                      {filteredVehicles.length > 0 ? (
                        filteredVehicles
                          .sort((a, b) =>
                            `${a.year} ${a.make} ${a.model}`.localeCompare(
                              `${b.year} ${b.make} ${b.model}`,
                            ),
                          )
                          .map((vehicle) => (
                            <button
                              key={vehicle.id}
                              type="button"
                              onClick={() => {
                                setFormData({
                                  ...formData,
                                  vehicle_id: vehicle.id,
                                });
                                setVehicleSearchInput(formatVehicleLabel(vehicle));
                                setShowVehicleDropdown(false);
                              }}
                              className="w-full text-left px-3 py-2 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none transition-colors border-b border-gray-100 last:border-b-0"
                            >
                              <div className="font-medium text-sm text-gray-900">
                                🚙 {vehicle.year} {vehicle.make} {vehicle.model}
                              </div>
                              <div className="text-xs text-gray-500">
                                {vehicle.license_plate &&
                                  `🏷️ ${vehicle.license_plate}`}
                                {vehicle.vin &&
                                  ` • VIN: ${vehicle.vin.substring(0, 8)}...`}
                              </div>
                            </button>
                          ))
                      ) : (
                        <div className="px-3 py-2 text-sm text-gray-500 text-center">
                          No vehicles found
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {formData.vehicle_id && (
                  <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                    <div className="text-sm text-green-800">
                      <strong>Selected:</strong>{" "}
                      {(() => {
                        const vehicle =
                          filteredVehicles.find((v) => v.id === formData.vehicle_id) ??
                          (editingRecord?.vehicle?.id === formData.vehicle_id
                            ? editingRecord.vehicle
                            : undefined);
                        return formatVehicleLabel(vehicle);
                      })()}
                    </div>
                  </div>
                )}
                {selectedCustomerId && customerVehicles.length > 0 && !lockCustomerVehicle && (
                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-sm text-green-600 flex items-center">
                      <svg
                        className="w-4 h-4 mr-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      {customerVehicles.length} vehicle
                      {customerVehicles.length !== 1 ? "s" : ""} available
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowVehicleForm(true)}
                      className="text-blue-600 hover:text-blue-800 underline font-medium text-sm flex items-center space-x-1"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                      <span>Add Another Vehicle</span>
                    </button>
                  </div>
                )}
                {!selectedCustomerId && !lockCustomerVehicle && (
                  <p className="text-sm text-amber-600 mt-2 flex items-center">
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                      />
                    </svg>
                    Please select a customer first
                  </p>
                )}
                {selectedCustomerId && customerVehicles.length === 0 && !lockCustomerVehicle && (
                  <p className="text-sm text-orange-600 mt-2 flex items-center">
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                      />
                    </svg>
                    This customer has no vehicles.
                    <button
                      type="button"
                      onClick={() => setShowVehicleForm(true)}
                      className="ml-2 text-blue-600 hover:text-blue-800 underline font-medium"
                    >
                      Add Vehicle
                    </button>
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Services
              </label>
              <div className="border border-gray-300 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="border border-gray-300 px-2 py-2 text-xs font-medium text-gray-500 uppercase">
                        A/A
                      </th>
                      <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Description
                      </th>
                      <th className="border border-gray-300 px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                        Qty
                      </th>
                      <th className="border border-gray-300 px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                        Price
                      </th>
                      <th className="border border-gray-300 px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                        Total
                      </th>
                      <th className="border border-gray-300 px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {formData.services.map((service, index) => {
                      const lineTotal =
                        Number(service.quantity) * Number(service.unit_price);
                      return (
                        <tr key={service.id} className="hover:bg-gray-50">
                          <td className="border border-gray-300 px-2 py-2 text-center text-sm text-gray-900">
                            {index + 1}
                          </td>
                          <td className="border border-gray-300 px-3 py-2">
                            <input
                              type="text"
                              value={service.description}
                              onChange={(e) =>
                                updateServiceLine(
                                  service.id,
                                  "description",
                                  e.target.value,
                                )
                              }
                              className="w-full px-2 py-1 text-sm border-0 focus:ring-0 bg-transparent"
                              placeholder="Service description..."
                            />
                          </td>
                          <td className="border border-gray-300 px-3 py-2">
                            <input
                              type="number"
                              min={0.01}
                              step="0.01"
                              value={service.quantity}
                              onFocus={(e) => e.target.select()}
                              onChange={(e) =>
                                updateServiceLine(
                                  service.id,
                                  "quantity",
                                  isNaN(parseFloat(e.target.value)) ? 1 : parseFloat(e.target.value),
                                )
                              }
                              className="w-full px-2 py-1 text-sm border-0 focus:ring-0 bg-transparent text-center"
                            />
                          </td>
                          <td className="border border-gray-300 px-3 py-2">
                            <input
                              type="number"
                              min={0}
                              step="0.01"
                              value={service.unit_price}
                              onFocus={(e) => e.target.select()}
                              onChange={(e) =>
                                updateServiceLine(
                                  service.id,
                                  "unit_price",
                                  isNaN(parseFloat(e.target.value)) ? 0 : parseFloat(e.target.value),
                                )
                              }
                              className="w-full px-2 py-1 text-sm border-0 focus:ring-0 bg-transparent text-right"
                              placeholder="0.00"
                            />
                          </td>
                          <td className="border border-gray-300 px-3 py-2 text-right text-sm font-medium">
                            {lineTotal.toFixed(2)}€
                          </td>
                          <td className="border border-gray-300 px-2 py-2 text-center">
                            {formData.services.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeServiceLine(service.id)}
                                className="text-red-600 hover:text-red-800 text-sm"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between items-start">
                <button
                  type="button"
                  onClick={addServiceLine}
                  className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Line</span>
                </button>

                <div className="bg-gray-50 p-4 rounded-lg min-w-64 text-sm">
                  <div className="flex justify-between font-semibold text-base">
                    <span>TOTAL:</span>
                    <span>{total.toFixed(2)}€</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Mileage
                </label>
                <input
                  type="number"
                  min={0}
                  value={formData.mileage}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      mileage: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  rows={3}
                  maxLength={500}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Additional notes..."
                />
                <div className="mt-1 text-xs text-gray-500 text-right">
                  {formData.notes.length}/500 characters
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={onClose}
                className="sm:flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="sm:flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingRecord ? "Update Service" : "Add Service"}
              </button>
            </div>
          </form>
        </div>

        {/* Vehicle Form Modal */}
        {showVehicleForm && selectedCustomerId && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Add New Vehicle
                </h3>
                <button
                  onClick={() => setShowVehicleForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <VehicleForm
                customerId={selectedCustomerId}
                onClose={() => setShowVehicleForm(false)}
                onSave={async () => {
                  setShowVehicleForm(false);
                  await onVehiclesChanged(selectedCustomerId); // ✅ refresh vehicles
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
