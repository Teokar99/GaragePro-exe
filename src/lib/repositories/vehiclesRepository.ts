import { invoke } from "@tauri-apps/api/tauri";
import {
  TauriPaginatedResult,
  TauriVehicle,
  TauriVehicleWithCustomer,
} from "../../types/tauri";
import type { Vehicle } from "../../types/vehicle";

const mapTauriVehicleToVehicle = (v: TauriVehicle): Vehicle => ({
  id: v.id,
  customer_id: v.customer_id,
  make: v.make,
  model: v.model,
  year: v.year,
  license_plate: v.license_plate ?? null,
  vin: v.vin ?? null,
  engine_code: v.engine_code ?? null,
  created_at: v.created_at ?? new Date().toISOString(),
});

export interface VehicleInput {
  customer_id: string;
  make: string;
  model: string;
  year: number;
  license_plate?: string | null;
  vin?: string | null;
  engine_code?: string | null;
}

export const vehiclesRepository = {
  async createVehicle(data: VehicleInput): Promise<Vehicle> {
    const created = await invoke<TauriVehicle>("create_vehicle", {
      customerId: data.customer_id,
      make: data.make,
      model: data.model,
      year: data.year,
      licensePlate: data.license_plate || null,
      vin: data.vin || null,
      engineCode: data.engine_code || null,
    });

    return mapTauriVehicleToVehicle(created);
  },

  async listVehiclesByCustomer(customerId: string): Promise<Vehicle[]> {
    const rows = await invoke<TauriVehicle[]>("list_vehicles_by_customer", {
      customerId,
    });

    return rows.map(mapTauriVehicleToVehicle);
  },

  async updateVehicle(id: string, data: VehicleInput): Promise<Vehicle> {
    const updated = await invoke<TauriVehicle>("update_vehicle", {
      id,
      customerId: data.customer_id,
      make: data.make,
      model: data.model,
      year: data.year,
      licensePlate: data.license_plate || null,
      vin: data.vin || null,
      engineCode: data.engine_code || null,
    });

    return mapTauriVehicleToVehicle(updated);
  },

  async deleteVehicle(id: string): Promise<void> {
    return await invoke<void>("delete_vehicle", { id });
  },

  async getVehicleWithCustomer(id: string): Promise<TauriVehicleWithCustomer> {
    return await invoke<TauriVehicleWithCustomer>("get_vehicle_with_customer", {
      id,
    });
  },

  async listVehicles(
    search: string = "",
    page: number = 1,
    perPage: number = 20,
  ): Promise<TauriPaginatedResult<TauriVehicleWithCustomer>> {
    return await invoke<TauriPaginatedResult<TauriVehicleWithCustomer>>(
      "list_vehicles",
      {
        search: search || null,
        page,
        perPage,
      },
    );
  },
};
