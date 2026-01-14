/*
  # Remove Authentication System
  
  1. Changes
    - Drop profiles table
    - Make user_id nullable in customers table (for backward compatibility)
    - Remove all RLS policies
    - Disable RLS on all tables for open access
    
  2. Notes
    - This reverts to an open-access system suitable for internal tools
    - No authentication required
*/

-- Drop profiles table
DROP TABLE IF EXISTS profiles CASCADE;

-- Make user_id nullable in customers (don't drop it to preserve existing data)
ALTER TABLE customers ALTER COLUMN user_id DROP NOT NULL;

-- Disable Row Level Security on all tables
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles DISABLE ROW LEVEL SECURITY;
ALTER TABLE parts DISABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements DISABLE ROW LEVEL SECURITY;
ALTER TABLE service_records DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT schemaname, tablename, policyname 
              FROM pg_policies 
              WHERE schemaname = 'public') 
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
                      r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$;
