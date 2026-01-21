import type { Customer } from "./customer";
import type { ServiceRecord } from "./service";

export interface Vehicle {
  id: string;
  customer_id: string;
  make: string;
  model: string;
  year: number;
  vin?: string | null;
  license_plate?: string | null;
  created_at: string;
  customer?: Customer;
  service_records?: ServiceRecord[];
}
