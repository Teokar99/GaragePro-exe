/*
  # Restrict Database Access to Admins Only

  1. Problem
    - Need to allow only admins to manage profiles
    - Previous approach caused infinite recursion
  
  2. Solution
    - Create a security definer function to check admin role (bypasses RLS)
    - Use this function in RLS policies to prevent recursion
    - Regular users can only read their own profile
    - Only admins can read/update/delete ALL profiles
  
  3. Security
    - RLS enabled on profiles table
    - Function uses SECURITY DEFINER to bypass RLS when checking role
    - Policies enforce admin-only access for management operations
*/

-- Create a function to check if current user is admin (bypasses RLS to prevent recursion)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can create own profile" ON profiles;

-- Allow users to read their own profile
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Allow admins to read ALL profiles (no recursion via security definer function)
CREATE POLICY "Admins can read all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (is_admin());

-- Allow admins to insert new profiles
CREATE POLICY "Admins can create profiles"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

-- Allow admins to update ANY profile
CREATE POLICY "Admins can update any profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Allow admins to delete profiles
CREATE POLICY "Admins can delete profiles"
  ON profiles FOR DELETE
  TO authenticated
  USING (is_admin());