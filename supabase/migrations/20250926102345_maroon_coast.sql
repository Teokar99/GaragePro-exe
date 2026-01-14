/*
  # Add part_number column to parts table

  1. Changes
    - Add `part_number` column to `parts` table
    - Set it as TEXT type with UNIQUE constraint
    - Add NOT NULL constraint for data integrity

  2. Notes
    - This fixes the schema mismatch between the application code and database
    - The part_number field is used for inventory tracking and identification
*/

-- Add the missing part_number column to the parts table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'parts' AND column_name = 'part_number'
  ) THEN
    ALTER TABLE parts ADD COLUMN part_number text;
    
    -- Add unique constraint for part numbers
    ALTER TABLE parts ADD CONSTRAINT parts_part_number_unique UNIQUE (part_number);
    
    -- Update existing records with placeholder part numbers if any exist
    UPDATE parts SET part_number = 'PART-' || id WHERE part_number IS NULL;
    
    -- Make the column NOT NULL after updating existing records
    ALTER TABLE parts ALTER COLUMN part_number SET NOT NULL;
  END IF;
END $$;