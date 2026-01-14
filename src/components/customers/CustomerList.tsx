import React, { useState } from 'react';
import { User, CreditCard as Edit3, Trash2, Car, ChevronDown, ChevronUp } from 'lucide-react';
import type { Customer } from '../../types';

interface CustomerListProps {
  customers: Customer[];
  onEdit: (customer: Customer) => void;
  onDelete: (customerId: string) => void;
  canEdit?: boolean;
}

export const CustomerList: React.FC<CustomerListProps> = ({
  customers,
  onEdit,
  onDelete,
  canEdit = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const INITIAL_DISPLAY_COUNT = 3;
  const displayedCustomers = isExpanded ? customers : customers.slice(0, INITIAL_DISPLAY_COUNT);
  const hasMore = customers.length > INITIAL_DISPLAY_COUNT;

  if (customers.length === 0) {
    return (
      <div className="text-center py-12">
        <User className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No customers found</h3>
        <p className="mt-1 text-sm text-gray-500">
          Get started by adding your first customer.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-600 overflow-hidden">
      <div className={`divide-y divide-gray-200 dark:divide-gray-600 ${isExpanded ? 'max-h-[600px] overflow-y-auto' : ''}`}>
        {displayedCustomers.map((customer) => {
          const customerVehicles = customer.vehicles || [];
          return (
            <div key={customer.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{customer.name}</h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400 mt-1">
                        <span>{customer.email}</span>
                        <span>{customer.phone}</span>
                      </div>
                      {customer.address && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{customer.address}</p>
                      )}
                    </div>
                  </div>

                  {customerVehicles.length > 0 && (
                    <div className="mt-4 ml-0 pl-0">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Vehicles:</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {customerVehicles.map((vehicle) => (
                          <div key={vehicle.id} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                            <div className="flex items-center space-x-2 mb-2">
                              <Car className="w-4 h-4 text-gray-400" />
                              <span className="text-sm font-medium dark:text-gray-200">
                                {vehicle.year} {vehicle.make} {vehicle.model}
                              </span>
                            </div>

                            {vehicle.license_plate && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                                License: {vehicle.license_plate}
                              </p>
                            )}
                            {vehicle.vin && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                                VIN: {vehicle.vin.substring(0, 8)}...
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {customerVehicles.length === 0 && (
                    <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Car className="w-4 h-4 text-yellow-600" />
                        <span className="text-sm text-yellow-700 dark:text-yellow-400">No vehicles registered</span>
                      </div>
                    </div>
                  )}
                </div>

                {canEdit && (
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => onEdit(customer)}
                      className="text-blue-600 hover:text-blue-900 p-1 rounded"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(customer.id)}
                      className="text-red-600 hover:text-red-900 p-1 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {hasMore && (
        <div className="border-t border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full py-4 px-6 flex items-center justify-center space-x-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors font-medium"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-5 h-5" />
                <span>Show Less</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-5 h-5" />
                <span>Show All ({customers.length - INITIAL_DISPLAY_COUNT} more)</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
