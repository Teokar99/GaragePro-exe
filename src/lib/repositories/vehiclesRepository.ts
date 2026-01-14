import { invoke } from '@tauri-apps/api/tauri';
import { TauriVehicle, TauriVehicleWithCustomer } from '../../types/tauri';

export interface VehicleInput {
  customer_id: string;
  make: string;
  model: string;
  year: number;
  license_plate?: string | null;
  vin?: string | null;
}

export const vehiclesRepository = {
  async createVehicle(data: VehicleInput): Promise<TauriVehicle> {
    return await invoke<TauriVehicle>('create_vehicle', {
      customerId: data.customer_id,
      make: data.make,
      model: data.model,
      year: data.year,
      licensePlate: data.license_plate || null,
      vin: data.vin || null,
    });
  },

  async listVehiclesByCustomer(customerId: string): Promise<TauriVehicle[]> {
    return await invoke<TauriVehicle[]>('list_vehicles_by_customer', {
      customerId,
    });
  },

  async updateVehicle(id: string, data: VehicleInput): Promise<TauriVehicle> {
    return await invoke<TauriVehicle>('update_vehicle', {
      id,
      customerId: data.customer_id,
      make: data.make,
      model: data.model,
      year: data.year,
      licensePlate: data.license_plate || null,
      vin: data.vin || null,
    });
  },

  async deleteVehicle(id: string): Promise<void> {
    return await invoke<void>('delete_vehicle', {
      id,
    });
  },

  async getVehicleWithCustomer(id: string): Promise<TauriVehicleWithCustomer> {
    return await invoke<TauriVehicleWithCustomer>('get_vehicle_with_customer', {
      id,
    });
  },
};
