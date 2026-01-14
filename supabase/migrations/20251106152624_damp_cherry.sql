/*
  # Add JSON services support to service_records

  1. New Columns
    - `services` (jsonb) - Array of service lines with description, quantity, unit_price
    - `subtotal` (numeric) - Calculated subtotal before VAT
    - `vat` (numeric) - VAT amount (24%)
    - `total` (numeric) - Final total amount

  2. Changes
    - Each service record now represents one complete work order
    - Multiple service lines stored as JSON array instead of separate records
    - Pre-calculated totals stored for consistency with PDF export
*/

ALTER TABLE service_records
  ADD COLUMN IF NOT EXISTS services jsonb,
  ADD COLUMN IF NOT EXISTS subtotal numeric,
  ADD COLUMN IF NOT EXISTS vat numeric,
  ADD COLUMN IF NOT EXISTS total numeric;