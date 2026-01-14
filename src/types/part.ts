export interface Part {
  id: string;
  name: string;
  description: string;
  part_number: string;
  category: string;
  supplier: string;
  cost_price: number;
  selling_price: number;
  stock_quantity: number;
  min_stock_level: number;
  created_at: string;
  updated_at: string;
}

export interface StockMovement {
  id: string;
  part_id: string;
  movement_type: 'in' | 'out' | 'adjustment';
  quantity: number;
  reference_type: 'purchase' | 'adjustment' | 'return';
  reference_id: string;
  notes: string;
  created_at: string;
  part?: Part;
}
