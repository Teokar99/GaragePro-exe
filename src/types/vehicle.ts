import type { Customer } from './customer';
import type { ServiceRecord } from './service';

export interface Vehicle {
  id: string;
  customer_id: string;
  make: string;
  model: string;
  year: number;
  vin: string;
  license_plate: string;
  created_at: string;
  customer?: Customer;
  service_records?: ServiceRecord[];
}
