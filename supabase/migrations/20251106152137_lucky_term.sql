/*
  # Add JSON services and totals columns to service_records

  1. New Columns
    - `services` (jsonb) - Array of service lines with description, quantity, unit_price
    - `subtotal` (numeric) - Calculated subtotal before VAT
    - `vat` (numeric) - VAT amount (24%)
    - `total` (numeric) - Final total including VAT

  2. Changes
    - Each service_record now represents one complete work order
    - Multiple work lines stored as JSON array in services column
    - Pre-calculated totals stored for consistency
*/

ALTER TABLE service_records
  ADD COLUMN IF NOT EXISTS services jsonb,
  ADD COLUMN IF NOT EXISTS subtotal numeric,
  ADD COLUMN IF NOT EXISTS vat numeric,
  ADD COLUMN IF NOT EXISTS total numeric;