/*
  # Complete Garage Management System Schema

  1. New Tables
    - `profiles` - User profiles with role management
    - Update existing tables to ensure proper relationships
    
  2. Security
    - Enable RLS on all tables
    - Add comprehensive policies for data access
    
  3. Functions
    - Add trigger functions for automatic profile creation
    
  4. Indexes
    - Add performance indexes for common queries
*/

-- Create profiles table for user management
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  role text NOT NULL DEFAULT 'mechanic' CHECK (role IN ('admin', 'mechanic')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Ensure customers table has proper structure
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES profiles(id) ON DELETE SET NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers(user_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_customer_id ON vehicles(customer_id);
CREATE INDEX IF NOT EXISTS idx_service_records_vehicle_id ON service_records(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_part_id ON stock_movements(part_id);
CREATE INDEX IF NOT EXISTS idx_parts_category ON parts(category);
CREATE INDEX IF NOT EXISTS idx_parts_stock_level ON parts(stock_quantity, min_stock_level);

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_records ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Customers policies
CREATE POLICY "Users can read all customers"
  ON customers
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create customers"
  ON customers
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update customers"
  ON customers
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Users can delete customers"
  ON customers
  FOR DELETE
  TO authenticated
  USING (true);

-- Vehicles policies
CREATE POLICY "Users can read all vehicles"
  ON vehicles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create vehicles"
  ON vehicles
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update vehicles"
  ON vehicles
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Users can delete vehicles"
  ON vehicles
  FOR DELETE
  TO authenticated
  USING (true);

-- Parts policies
CREATE POLICY "Users can read all parts"
  ON parts
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create parts"
  ON parts
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update parts"
  ON parts
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Users can delete parts"
  ON parts
  FOR DELETE
  TO authenticated
  USING (true);

-- Stock movements policies
CREATE POLICY "Users can read all stock movements"
  ON stock_movements
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create stock movements"
  ON stock_movements
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Service records policies
CREATE POLICY "Users can read all service records"
  ON service_records
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create service records"
  ON service_records
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update service records"
  ON service_records
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Users can delete service records"
  ON service_records
  FOR DELETE
  TO authenticated
  USING (true);

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'mechanic'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function on user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers where needed
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_parts_updated_at ON parts;
CREATE TRIGGER update_parts_updated_at
  BEFORE UPDATE ON parts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();