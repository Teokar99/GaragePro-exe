export interface ServiceLine {
  description: string;
  quantity: number;
  unit_price: number;
}

export interface ServiceRecord {
  id: string;
  vehicle_id: string;
  mechanic_id: string | null;
  date: string;
  mileage: number;
  notes?: string;
  description?: string;
  services?: ServiceLine[];
  subtotal: number;
  vat: number;
  total: number;
  created_at: string;
  quantity?: number;
  unit_price?: number;
}
