/*
  # Add mileage and notes fields to service_records

  1. New Fields
    - `mileage` (integer) - Vehicle mileage at time of service
    - `notes` (text) - Additional notes for the service record

  2. Changes
    - Add mileage column with default 0
    - Add notes column for additional service information
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_records' AND column_name = 'mileage'
  ) THEN
    ALTER TABLE service_records ADD COLUMN mileage integer DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_records' AND column_name = 'notes'
  ) THEN
    ALTER TABLE service_records ADD COLUMN notes text DEFAULT '';
  END IF;
END $$;