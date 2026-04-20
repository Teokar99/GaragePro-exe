import React, { useMemo, useState } from "react";
import { vehiclesRepository } from "../../lib/repositories/vehiclesRepository";
import { logError } from "../../utils/errorHandler";
import { SearchableSelect } from "../ui/SearchableSelect";
import {
  generateYearOptions,
  getAllMakes,
  getModelsForMake,
} from "../../data/car-data";

export type VehicleInput = {
  customer_id: string;
  make: string;
  model: string;
  year: number;
  license_plate?: string | null;
  vin?: string | null;
  engine_code?: string | null;
};

interface VehicleFormProps {
  customerId: string;
  onClose: () => void;
  onSave: () => void;
}

export const VehicleForm: React.FC<VehicleFormProps> = ({
  customerId,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    make: "",
    model: "",
    year: new Date().getFullYear(),
    license_plate: "",
    vin: "",
    engine_code: "",
  });

  const makeOptions = useMemo(() => getAllMakes(), []);
  const yearOptions = useMemo(() => generateYearOptions(), []);

  const modelOptions = useMemo(() => {
    return getModelsForMake(formData.make);
  }, [formData.make]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await vehiclesRepository.createVehicle({
        customer_id: customerId,
        make: formData.make,
        model: formData.model,
        year: formData.year,
        license_plate: formData.license_plate || null,
        vin: reminderOrNull(formData.vin),
        engine_code: reminderOrNull(formData.engine_code),
      });

      setFormData({
        make: "",
        model: "",
        year: new Date().getFullYear(),
        license_plate: "",
        vin: "",
        engine_code: "",
      });
      onSave();
      onClose();
    } catch (error) {
      logError("Error adding vehicle", error);
      alert("Error adding vehicle");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <SearchableSelect
          label="Make"
          required
          value={formData.make}
          onChange={(make) =>
            setFormData((prev) => ({
              ...prev,
              make,
              model: "", // reset model when make changes
            }))
          }
          options={makeOptions}
          placeholder="Select make..."
        />
      </div>

      <div>
        <SearchableSelect
          label="Model"
          required
          value={formData.model}
          onChange={(model) => setFormData((prev) => ({ ...prev, model }))}
          options={modelOptions}
          placeholder={formData.make ? "Select model..." : "Select make first"}
          disabled={!formData.make}
        />
        {!formData.make ? (
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Please select a make first
          </p>
        ) : null}
      </div>

      <div>
        <SearchableSelect
          label="Year"
          required
          value={String(formData.year)}
          onChange={(yearStr) =>
            setFormData((prev) => ({
              ...prev,
              year: Number.parseInt(yearStr, 10),
            }))
          }
          options={yearOptions}
          placeholder="Select year..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          License Plate
        </label>
        <input
          type="text"
          value={formData.license_plate}
          onChange={(e) =>
            setFormData({ ...formData, license_plate: e.target.value })
          }
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="e.g., ABC-1234"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          VIN
        </label>
        <input
          type="text"
          value={formData.vin}
          onChange={(e) => setFormData({ ...formData, vin: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="17-character VIN"
          maxLength={17}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Engine Code
        </label>
        <input
          type="text"
          value={formData.engine_code}
          onChange={(e) => setFormData({ ...formData, engine_code: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="e.g. 1NZ-FE, N47D20, M271"
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          type="submit"
          className="sm:flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
        >
          Add Vehicle
        </button>
        <button
          type="button"
          onClick={onClose}
          className="sm:flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

// μικρό helper για να μην αλλάζεις submit logic ουσιαστικά,
// απλά κάνει trim και null αν είναι άδειο
function reminderOrNull(v?: string | null) {
  const trimmed = (v ?? "").trim();
  return trimmed.length ? trimmed : null;
}
