import React from 'react';
import { Car, Trash2, FileText, Download } from 'lucide-react';
import type { Vehicle } from '../../types';

interface VehicleCardProps {
  vehicle: Vehicle;
  serviceCount: number;
  onDelete: (vehicleId: string) => void;
  onViewServices: (vehicle: Vehicle) => void;
  onExportAll: (vehicle: Vehicle) => void;
}

export const VehicleCard: React.FC<VehicleCardProps> = ({
  vehicle,
  serviceCount,
  onDelete,
  onViewServices,
  onExportAll
}) => {
  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Car className="w-5 h-5 text-gray-400" />
          <div>
            <h3 className="font-medium text-gray-900">
              {vehicle.year} {vehicle.make} {vehicle.model}
            </h3>
            {vehicle.license_plate && (
              <p className="text-sm text-gray-500">{vehicle.license_plate}</p>
            )}
          </div>
        </div>
        <button
          onClick={() => onDelete(vehicle.id)}
          className="text-red-600 hover:text-red-800 p-1"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-2">
        <p className="text-sm text-gray-600">
          {serviceCount} service record{serviceCount !== 1 ? 's' : ''}
        </p>

        <div className="flex space-x-2">
          <button
            onClick={() => onViewServices(vehicle)}
            className="flex-1 bg-blue-100 text-blue-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors flex items-center justify-center space-x-1 border border-blue-200"
          >
            <FileText className="w-4 h-4" />
            <span>View Services</span>
          </button>
          <button
            onClick={() => onExportAll(vehicle)}
            disabled={serviceCount === 0}
            className="flex-1 bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-1"
          >
            <Download className="w-4 h-4" />
            <span>Export All</span>
          </button>
        </div>
      </div>
    </div>
  );
};
