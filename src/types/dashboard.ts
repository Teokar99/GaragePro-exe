import type { Part } from './part';

export interface DashboardStats {
  lowStockItems: number;
  totalCustomers: number;
  lowStockParts: Part[];
}
