/*
  # Allow Secretary and Mechanic Dashboard Access
  
  1. Access Model
    - Admins: Full CRUD access to all data
    - Secretaries & Mechanics: Read-only access to view dashboard and services
    - Revenue calculations: Admin-only (handled in frontend)
  
  2. Changes
    - Create helper function to check if user is staff (admin/secretary/mechanic)
    - Update policies to allow staff to read customers, vehicles, and service_records
    - Only admins can INSERT/UPDATE/DELETE
  
  3. Security
    - Read-only access for non-admin staff
    - Revenue data can be queried but frontend will hide it from non-admins
*/

-- Create a function to check if current user is staff (admin, secretary, or mechanic)
CREATE OR REPLACE FUNCTION is_staff()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'secretary', 'mechanic')
  );
END;
$$;

-- ============================================
-- CUSTOMERS TABLE - Staff can read, Admin can modify
-- ============================================

DROP POLICY IF EXISTS "Admins can read customers" ON customers;

-- Staff can read customers
CREATE POLICY "Staff can read customers"
  ON customers FOR SELECT
  TO authenticated
  USING (is_staff());

-- Admin policies for INSERT/UPDATE/DELETE remain unchanged
-- (Admins can create, update, delete customers)

-- ============================================
-- VEHICLES TABLE - Staff can read, Admin can modify
-- ============================================

DROP POLICY IF EXISTS "Admins can read vehicles" ON vehicles;

-- Staff can read vehicles
CREATE POLICY "Staff can read vehicles"
  ON vehicles FOR SELECT
  TO authenticated
  USING (is_staff());

-- Admin policies for INSERT/UPDATE/DELETE remain unchanged

-- ============================================
-- SERVICE_RECORDS TABLE - Staff can read, Admin can modify
-- ============================================

DROP POLICY IF EXISTS "Admins can read service records" ON service_records;

-- Staff can read service records
CREATE POLICY "Staff can read service records"
  ON service_records FOR SELECT
  TO authenticated
  USING (is_staff());

-- Admin policies for INSERT/UPDATE/DELETE remain unchanged

-- ============================================
-- PROFILES TABLE - Add staff read access
-- ============================================

-- Staff can read all profiles (to see mechanic names, etc.)
CREATE POLICY "Staff can read all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (is_staff());