import React from 'react';
import { Calendar, Download, FileText, Plus, CreditCard as Edit3, Trash2 } from 'lucide-react';
import type { ServiceRecord, Vehicle } from '../../types';
import { formatDate } from '../../lib/utils/formatters';

interface ServiceListProps {
  vehicle: Vehicle;
  records: ServiceRecord[];
  onClose: () => void;
  onAddService: (vehicle: Vehicle) => void;
  onExportPDF: (vehicle: Vehicle, record: ServiceRecord) => void;
  onEditService: (record: ServiceRecord) => void;
  onDeleteService: (recordId: string) => void;
  onRefreshRecords: () => void;
}

export const ServiceList: React.FC<ServiceListProps> = ({
  vehicle,
  records,
  onClose,
  onAddService,
  onExportPDF,
  onEditService,
  onDeleteService,
  onRefreshRecords
}) => {
  const handleExportPDF = async (vehicle: Vehicle, record: ServiceRecord) => {
    // Refresh records to get latest data before export
    await onRefreshRecords();
    // Small delay to ensure state is updated
    setTimeout(() => {
      onExportPDF(vehicle, record);
    }, 100);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">
              Service Records - {vehicle.year} {vehicle.make} {vehicle.model}
            </h2>
            <div className="flex space-x-2">
              <button
                onClick={() => onAddService(vehicle)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Service</span>
              </button>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {records.length > 0 ? (
            <div className="space-y-4">
              {records.map((record) => (
                <div
                  key={record.id}
                  className="border border-gray-200 rounded-lg p-4 overflow-hidden"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-gray-900">
                          {formatDate(record.date)}
                        </span>
                        {record.mileage > 0 && (
                          <span className="text-sm text-gray-500">
                            • {record.mileage.toLocaleString()} km
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="ml-4 shrink-0 flex items-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onEditService(record);
                        }}
                        className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-1 transition-colors whitespace-nowrap"
                      >
                        <Edit3 className="w-4 h-4" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onDeleteService(record.id);
                        }}
                        className="bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 flex items-center space-x-1 transition-colors whitespace-nowrap"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Delete</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleExportPDF(vehicle, record);
                        }}
                        className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-1 transition-colors whitespace-nowrap"
                      >
                        <Download className="w-4 h-4" />
                        <span>Export PDF</span>
                      </button>
                    </div>
                  </div>

                  <p className="text-gray-700 mb-2 whitespace-pre-wrap break-words">
                    {record.description}
                  </p>

                  {record.notes && (
                    <p className="text-sm text-gray-500 italic whitespace-pre-wrap break-words">
                      Notes: {record.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No service records</h3>
              <p className="mt-1 text-sm text-gray-500">Add a service record to get started</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
