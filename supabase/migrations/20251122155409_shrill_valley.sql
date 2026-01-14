/*
  # Add full_name column to profiles table

  1. Schema Changes
    - Add `full_name` column to `profiles` table
    - Column is nullable to handle existing records
    - Default value is empty string for consistency

  2. Data Migration
    - Existing records will have null full_name initially
    - Frontend handles null/empty values gracefully

  3. Security
    - No changes to RLS policies needed
    - Existing policies cover the new column
*/

-- Add full_name column to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'full_name'
  ) THEN
    ALTER TABLE profiles ADD COLUMN full_name text DEFAULT '';
  END IF;
END $$;

-- Update the trigger function to handle updated_at for profiles
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Ensure the trigger exists for profiles table
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();