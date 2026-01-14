/*
  # Initial Database Schema without Authentication

  1. New Tables
    - `customers` - Customer information (id, name, email, phone, address, created_at)
    - `vehicles` - Vehicle registration linked to customers (id, customer_id, make, model, year, license_plate, vin, created_at)
    - `parts` - Inventory parts with stock tracking (id, name, description, part_number, category, supplier, cost_price, selling_price, stock_quantity, min_stock_level, created_at, updated_at)
    - `stock_movements` - Audit trail for inventory changes (id, part_id, movement_type, quantity, reference_type, reference_id, notes, created_at)
    - `service_records` - Service history for vehicles (id, vehicle_id, date, description, created_at)

  2. Security
    - No RLS policies - open access for all operations
    - Suitable for internal tools or development

  3. Sample Data
    - Sample customers, parts for testing
*/

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  phone text,
  address text,
  created_at timestamptz DEFAULT now()
);

-- Create vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  make text NOT NULL,
  model text NOT NULL,
  year integer NOT NULL,
  license_plate text,
  vin text,
  created_at timestamptz DEFAULT now()
);

-- Create parts table
CREATE TABLE IF NOT EXISTS parts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  part_number text UNIQUE NOT NULL,
  category text NOT NULL,
  supplier text,
  cost_price decimal(10,2) NOT NULL DEFAULT 0,
  selling_price decimal(10,2) NOT NULL DEFAULT 0,
  stock_quantity integer NOT NULL DEFAULT 0,
  min_stock_level integer NOT NULL DEFAULT 5,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create stock_movements table for audit trail
CREATE TABLE IF NOT EXISTS stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  part_id uuid REFERENCES parts(id) ON DELETE CASCADE,
  movement_type text NOT NULL CHECK (movement_type IN ('in', 'out', 'adjustment')),
  quantity integer NOT NULL,
  reference_type text CHECK (reference_type IN ('purchase', 'adjustment', 'return')),
  reference_id uuid,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Create service_records table
CREATE TABLE IF NOT EXISTS service_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid REFERENCES vehicles(id) ON DELETE CASCADE NOT NULL,
  mechanic_id uuid,
  date timestamptz DEFAULT now(),
  description text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Insert sample customers
INSERT INTO customers (name, email, phone, address) VALUES
  ('John Smith', 'john.smith@email.com', '555-0101', '123 Main St, Anytown, ST 12345'),
  ('Sarah Johnson', 'sarah.j@email.com', '555-0102', '456 Oak Ave, Somewhere, ST 67890'),
  ('Mike Wilson', 'mike.wilson@email.com', '555-0103', '789 Pine Rd, Elsewhere, ST 54321')
ON CONFLICT DO NOTHING;

-- Insert sample parts
INSERT INTO parts (name, description, part_number, category, supplier, cost_price, selling_price, stock_quantity, min_stock_level) VALUES
  ('Engine Oil 5W-30', 'Premium synthetic engine oil', 'EO-5W30-001', 'Fluids', 'Mobil', 8.50, 15.99, 24, 10),
  ('Oil Filter', 'Standard oil filter for most vehicles', 'OF-STD-001', 'Filters', 'Fram', 4.25, 12.99, 15, 5),
  ('Air Filter', 'High-performance air filter', 'AF-HP-001', 'Filters', 'K&N', 12.00, 24.99, 8, 5),
  ('Brake Pads Front', 'Ceramic brake pads - front set', 'BP-FRONT-001', 'Brakes', 'Brembo', 45.00, 89.99, 6, 3),
  ('Brake Pads Rear', 'Ceramic brake pads - rear set', 'BP-REAR-001', 'Brakes', 'Brembo', 35.00, 69.99, 4, 3),
  ('Spark Plugs', 'Iridium spark plugs (set of 4)', 'SP-IR-001', 'Engine', 'NGK', 16.00, 32.99, 12, 8),
  ('Transmission Fluid', 'ATF transmission fluid', 'TF-ATF-001', 'Fluids', 'Valvoline', 6.75, 13.99, 18, 6),
  ('Coolant', 'Extended life coolant', 'CL-EXT-001', 'Fluids', 'Prestone', 5.50, 11.99, 20, 8)
ON CONFLICT (part_number) DO NOTHING;
