import { invoke } from '@tauri-apps/api/tauri';
import { TauriDashboardStats, TauriServiceRecordWithDetails } from '../../types/tauri';

export const dashboardRepository = {
  async getDashboardStats(): Promise<TauriDashboardStats> {
    return await invoke<TauriDashboardStats>('get_dashboard_stats');
  },

  async getRecentServices(limit: number = 10): Promise<TauriServiceRecordWithDetails[]> {
    return await invoke<TauriServiceRecordWithDetails[]>('get_recent_services', {
      limit,
    });
  },
};
