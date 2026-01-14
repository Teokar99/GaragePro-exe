import { invoke } from '@tauri-apps/api/tauri';
import {
  ServiceInput,
  TauriServiceRecord,
  TauriServiceRecordWithDetails,
  TauriPaginatedResult
} from '../../types/tauri';

export interface ServiceFilter {
  vehicle_id?: string;
  customer_id?: string;
  mechanic_id?: string;
  date_from?: string;
  date_to?: string;
}

export const servicesRepository = {
  async listServices(
    search: string = '',
    filter: ServiceFilter = {},
    page: number = 1,
    perPage: number = 20
  ): Promise<TauriPaginatedResult<TauriServiceRecordWithDetails>> {
    return await invoke<TauriPaginatedResult<TauriServiceRecordWithDetails>>('list_services', {
      search,
      vehicleId: filter.vehicle_id || null,
      customerId: filter.customer_id || null,
      mechanicId: filter.mechanic_id || null,
      dateFrom: filter.date_from || null,
      dateTo: filter.date_to || null,
      page,
      perPage,
    });
  },

  async getService(id: string): Promise<TauriServiceRecordWithDetails> {
    return await invoke<TauriServiceRecordWithDetails>('get_service', {
      id,
    });
  },

  async createService(data: ServiceInput): Promise<TauriServiceRecord> {
    return await invoke<TauriServiceRecord>('create_service', {
      serviceData: data,
    });
  },

  async updateService(id: string, data: ServiceInput): Promise<TauriServiceRecord> {
    return await invoke<TauriServiceRecord>('update_service', {
      id,
      serviceData: data,
    });
  },

  async deleteService(id: string): Promise<void> {
    return await invoke<void>('delete_service', {
      id,
    });
  },
};
