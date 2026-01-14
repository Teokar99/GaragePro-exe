/*
  # Admin-Only Database Access
  
  1. Security Model
    - ONLY admin users can access the database
    - All other roles (mechanic, secretary) have NO database access
    - Regular users cannot read or write any data
  
  2. Tables Affected
    - customers
    - vehicles
    - service_records
    - profiles (already configured)
  
  3. Changes
    - Drop all existing permissive policies on all tables
    - Create admin-only policies using the is_admin() function
    - Admins get full CRUD access to all tables
*/

-- ============================================
-- CUSTOMERS TABLE - Admin Only
-- ============================================

-- Drop any existing policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON customers;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON customers;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON customers;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON customers;

-- Admin-only policies
CREATE POLICY "Admins can read customers"
  ON customers FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can create customers"
  ON customers FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update customers"
  ON customers FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete customers"
  ON customers FOR DELETE
  TO authenticated
  USING (is_admin());

-- ============================================
-- VEHICLES TABLE - Admin Only
-- ============================================

-- Drop any existing policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON vehicles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON vehicles;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON vehicles;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON vehicles;

-- Admin-only policies
CREATE POLICY "Admins can read vehicles"
  ON vehicles FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can create vehicles"
  ON vehicles FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update vehicles"
  ON vehicles FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete vehicles"
  ON vehicles FOR DELETE
  TO authenticated
  USING (is_admin());

-- ============================================
-- SERVICE_RECORDS TABLE - Admin Only
-- ============================================

-- Drop any existing policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON service_records;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON service_records;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON service_records;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON service_records;

-- Admin-only policies
CREATE POLICY "Admins can read service records"
  ON service_records FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can create service records"
  ON service_records FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update service records"
  ON service_records FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete service records"
  ON service_records FOR DELETE
  TO authenticated
  USING (is_admin());