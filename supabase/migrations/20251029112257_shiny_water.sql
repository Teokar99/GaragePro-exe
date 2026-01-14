/*
  # Fix profiles table RLS policies

  1. Security Updates
    - Drop existing restrictive policies that prevent profile creation
    - Create proper RLS policies for authenticated users to manage their own profiles
    - Allow users to SELECT, INSERT, and UPDATE their own profile data

  2. Changes
    - Enable RLS on profiles table (if not already enabled)
    - Create policy for users to read their own profile
    - Create policy for users to create their own profile  
    - Create policy for users to update their own profile
*/

-- Ensure RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies that might be causing issues
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Create new policies that allow authenticated users to manage their own profiles
CREATE POLICY "Allow authenticated users to view their own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Allow authenticated users to create their own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow authenticated users to update their own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);