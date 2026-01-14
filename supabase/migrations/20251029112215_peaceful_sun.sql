/*
  # Fix profiles table INSERT policy

  1. Security Changes
    - Drop existing restrictive INSERT policy on profiles table
    - Add new INSERT policy that allows authenticated users to create their own profile
    - Ensure users can only insert profiles where the id matches their auth.uid()

  This fixes the "new row violates row-level security policy" error when users sign up.
*/

-- Drop the existing INSERT policy that's too restrictive
DROP POLICY IF EXISTS "Users can create profiles" ON profiles;

-- Create a new INSERT policy that allows users to create their own profile
CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);