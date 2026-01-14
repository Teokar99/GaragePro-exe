/*
  # Remove inventory-related tables

  This migration removes all inventory-related tables and their dependencies:
  1. Drop stock_movements table (depends on parts)
  2. Drop parts table
  3. Clean up any remaining references

  ## Security
  - This will permanently delete all inventory data
  - Make sure to backup data if needed before running
*/

-- Drop stock_movements table first (has foreign key to parts)
DROP TABLE IF EXISTS stock_movements CASCADE;

-- Drop parts table
DROP TABLE IF EXISTS parts CASCADE;

-- Drop the update_updated_at_column function if it's no longer used
-- (keeping it as it might be used by other tables like profiles)
-- DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;