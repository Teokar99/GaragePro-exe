/*
  # Add Secretary Role and Admin User Management

  1. Changes
    - Add 'secretary' role to the profiles table role constraint
    - Add policies for admin users to manage all profiles (create, read, update roles)
    - Add function to get user role for easy permission checking
  
  2. Roles Overview
    - **Admin**: Full access to everything including user management
    - **Mechanic**: Access to dashboard, customers, services with all financial data
    - **Secretary**: Access to customers and services only, NO financial information
  
  3. Security
    - Only admins can create new user profiles
    - Only admins can update user roles
    - All authenticated users can view all profiles (for user selection in UI)
    - Users can still view and update their own profile details (name, etc.)
*/

-- Drop the old check constraint on role
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Add the new constraint with secretary role
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('admin', 'mechanic', 'secretary'));

-- Add policy for admins to read all profiles
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
CREATE POLICY "Admins can read all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Add policy for admins to create profiles
DROP POLICY IF EXISTS "Admins can create profiles" ON profiles;
CREATE POLICY "Admins can create profiles"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Add policy for admins to update any profile
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;
CREATE POLICY "Admins can update any profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Add policy for admins to delete profiles
DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;
CREATE POLICY "Admins can delete profiles"
  ON profiles
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create helper function to get current user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS text AS $$
BEGIN
  RETURN (
    SELECT role FROM profiles
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Create helper function to check if user has permission
CREATE OR REPLACE FUNCTION has_permission(required_role text)
RETURNS boolean AS $$
BEGIN
  RETURN (
    SELECT CASE 
      WHEN required_role = 'admin' THEN role = 'admin'
      WHEN required_role = 'mechanic' THEN role IN ('admin', 'mechanic')
      WHEN required_role = 'secretary' THEN role IN ('admin', 'mechanic', 'secretary')
      ELSE false
    END
    FROM profiles
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
