/*
  # Add missing full_name column to profiles table

  1. Changes
    - Add `full_name` column to `profiles` table (text, nullable)
  
  2. Security
    - No changes to existing RLS policies needed
*/

-- Add full_name column to profiles table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'full_name'
  ) THEN
    ALTER TABLE profiles ADD COLUMN full_name text;
  END IF;
END $$;