/*
  # Fix Infinite Recursion in Profiles RLS Policies

  1. Problem
    - Admin policies query the profiles table to check role
    - This causes infinite recursion when trying to fetch profiles
  
  2. Solution
    - Keep simple user policies (users can always read their own profile)
    - Remove admin role-checking policies that cause recursion
    - Admins will be granted access at the application level
  
  3. Changes
    - Drop all existing policies
    - Add basic policies that allow users to manage their own profiles
    - These policies do NOT check roles in subqueries
*/

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Allow authenticated users to view their own profile" ON profiles;
DROP POLICY IF EXISTS "Allow authenticated users to update their own profile" ON profiles;
DROP POLICY IF EXISTS "Allow authenticated users to create their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;
DROP POLICY IF EXISTS "Admins can create profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;

-- Allow users to read their own profile (no recursion)
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Allow users to update their own profile (no recursion)
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow users to insert their own profile (no recursion)
CREATE POLICY "Users can create own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);