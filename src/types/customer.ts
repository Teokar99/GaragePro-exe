import type { Vehicle } from './vehicle';

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  afm?: string;
  created_at: string;
  vehicles?: Vehicle[];
}
