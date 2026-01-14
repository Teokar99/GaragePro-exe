/*
  # Add quantity and unit_price columns to service_records

  1. New Columns
    - `quantity` (numeric, nullable) - Quantity of service/part used
    - `unit_price` (numeric, nullable) - Unit price for the service/part
  
  2. Purpose
    - Enable detailed service line items with quantities and pricing
    - Support invoice-style service records
    - Connect service modal data with PDF export functionality
*/

-- Add quantity and unit_price columns to service_records table
ALTER TABLE service_records 
  ADD COLUMN IF NOT EXISTS quantity numeric NULL,
  ADD COLUMN IF NOT EXISTS unit_price numeric NULL;