export interface TauriUser {
  id: string;
  full_name: string;
  role: string;
  email: string | null;
}

export interface AuthResponse {
  success: boolean;
  user: TauriUser | null;
  error?: string | null;
  message?: string | null;
}

export interface TauriCustomer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  afm: string | null;
  created_at: string;
  updated_at: string;
}

export interface TauriCustomerWithVehicleCount extends TauriCustomer {
  vehicle_count: number;
}

export interface TauriVehicle {
  id: string;
  customer_id: string;
  make: string;
  model: string;
  year: number;
  license_plate: string | null;
  vin: string | null;
  created_at: string;
  updated_at: string;
}

export interface TauriVehicleWithCustomer extends TauriVehicle {
  customer_name: string;
}

export interface TauriCustomerWithVehicles extends TauriCustomer {
  vehicles: TauriVehicle[];
}

export interface TauriServiceItem {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface TauriServiceRecord {
  id: string;
  vehicle_id: string;
  mechanic_id: string | null;
  date: string;
  description: string | null;
  mileage: number | null;
  subtotal: number;
  vat: number;
  total: number;
  notes: string | null;
  services: TauriServiceItem[];
  created_at: string;
  updated_at: string;
}

export interface TauriServiceRecordWithDetails extends TauriServiceRecord {
  customer_id: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  vehicle_make: string;
  vehicle_model: string;
  vehicle_year: number;
  vehicle_license_plate: string | null;
  mechanic_name: string | null;
}

export interface TauriDashboardStats {
  customers_count: number;
  vehicles_count: number;
  monthly_services: number;
  total_revenue: number;
}

export interface TauriPaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface ServiceInput {
  vehicle_id: string;
  mechanic_id: string | null;
  date: string;
  description: string | null;
  mileage: number | null;
  notes: string | null;
  services: TauriServiceItem[];
  subtotal: number;
  vat: number;
  total: number;
}

export interface BackupInfo {
  filename: string;
  path: string;
  created_at: string;
  size: number;
}
