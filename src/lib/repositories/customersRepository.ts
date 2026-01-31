import { invoke } from "@tauri-apps/api/tauri";
import {
  TauriCustomer,
  TauriCustomerWithVehicleCount,
  TauriCustomerWithVehicles,
  TauriPaginatedResult,
} from "../../types/tauri";

export type CustomerStats = {
  total_customers: number;
  total_vehicles: number;
};

export interface CustomerInput {
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  afm?: string | null;
}

export const customersRepository = {
  async listCustomers(
    search: string = "",
    page: number = 1,
    perPage: number = 20,
  ): Promise<TauriPaginatedResult<TauriCustomerWithVehicleCount>> {
    return await invoke<TauriPaginatedResult<TauriCustomerWithVehicleCount>>(
      "list_customers",
      {
        search,
        page,
        perPage,
      },
    );
  },

  async listAllCustomers(): Promise<TauriCustomer[]> {
    return await invoke<TauriCustomer[]>("list_all_customers", {});
  },

  async getCustomerWithVehicles(
    customerId: string,
  ): Promise<TauriCustomerWithVehicles> {
    return await invoke<TauriCustomerWithVehicles>(
      "get_customer_with_vehicles",
      {
        customerId,
      },
    );
  },

  async createCustomer(data: CustomerInput): Promise<TauriCustomer> {
    return await invoke<TauriCustomer>("create_customer", {
      name: data.name,
      email: data.email || null,
      phone: data.phone || null,
      address: data.address || null,
      afm: data.afm || null,
    });
  },

  async updateCustomer(
    id: string,
    data: CustomerInput,
  ): Promise<TauriCustomer> {
    return await invoke<TauriCustomer>("update_customer", {
      id,
      name: data.name,
      email: data.email || null,
      phone: data.phone || null,
      address: data.address || null,
      afm: data.afm || null,
    });
  },

  async deleteCustomer(id: string): Promise<void> {
    return await invoke<void>("delete_customer", {
      id,
    });
  },

  async listAllCustomersWithVehicleCount(): Promise<
    TauriCustomerWithVehicleCount[]
  > {
    return await invoke<TauriCustomerWithVehicleCount[]>(
      "list_all_customers_with_vehicle_count",
      {},
    );
  },
  async getCustomerStats(): Promise<CustomerStats> {
    return await invoke<CustomerStats>("get_customer_stats", {});
  },
};
