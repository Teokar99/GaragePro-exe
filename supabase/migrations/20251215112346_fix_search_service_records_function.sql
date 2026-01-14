/*
  # Fix Service Search Function Schema

  1. Changes
    - Update search_service_records function to match actual service_records schema
    - Remove non-existent columns: labor_cost, parts_cost
    - Add actual columns: mechanic_id, notes, quantity, unit_price, services, subtotal, vat
  
  2. Purpose
    - Fix the 400 error caused by referencing non-existent columns
    - Ensure function returns all necessary service record data
*/

-- Drop existing function
DROP FUNCTION IF EXISTS search_service_records;

-- Create updated function with correct schema
CREATE OR REPLACE FUNCTION search_service_records(
  search_term TEXT DEFAULT NULL,
  filter_type TEXT DEFAULT 'all',
  from_index INT DEFAULT 0,
  to_index INT DEFAULT 49
)
RETURNS TABLE (
  id UUID,
  vehicle_id UUID,
  mechanic_id UUID,
  date TIMESTAMPTZ,
  description TEXT,
  created_at TIMESTAMPTZ,
  mileage INT,
  notes TEXT,
  quantity NUMERIC,
  unit_price NUMERIC,
  services JSONB,
  subtotal NUMERIC,
  vat NUMERIC,
  total NUMERIC,
  total_count BIGINT
) AS $$
DECLARE
  v_total_count BIGINT;
BEGIN
  -- Get total count first
  SELECT COUNT(*) INTO v_total_count
  FROM service_records sr
  INNER JOIN vehicles v ON sr.vehicle_id = v.id
  INNER JOIN customers c ON v.customer_id = c.id
  WHERE 
    (search_term IS NULL OR 
     sr.description ILIKE '%' || search_term || '%' OR
     sr.notes ILIKE '%' || search_term || '%' OR
     v.make ILIKE '%' || search_term || '%' OR
     v.model ILIKE '%' || search_term || '%' OR
     v.license_plate ILIKE '%' || search_term || '%' OR
     c.name ILIKE '%' || search_term || '%')
    AND (
      filter_type = 'all' OR
      (filter_type = 'today' AND DATE(sr.date) = CURRENT_DATE) OR
      (filter_type = 'week' AND sr.date >= CURRENT_DATE - INTERVAL '7 days') OR
      (filter_type = 'month' AND DATE_TRUNC('month', sr.date) = DATE_TRUNC('month', CURRENT_DATE)) OR
      (filter_type = 'high-value' AND sr.total > 500)
    );

  -- Return paginated results with total count
  RETURN QUERY
  SELECT 
    sr.id,
    sr.vehicle_id,
    sr.mechanic_id,
    sr.date,
    sr.description,
    sr.created_at,
    sr.mileage,
    sr.notes,
    sr.quantity,
    sr.unit_price,
    sr.services,
    sr.subtotal,
    sr.vat,
    sr.total,
    v_total_count as total_count
  FROM service_records sr
  INNER JOIN vehicles v ON sr.vehicle_id = v.id
  INNER JOIN customers c ON v.customer_id = c.id
  WHERE 
    (search_term IS NULL OR 
     sr.description ILIKE '%' || search_term || '%' OR
     sr.notes ILIKE '%' || search_term || '%' OR
     v.make ILIKE '%' || search_term || '%' OR
     v.model ILIKE '%' || search_term || '%' OR
     v.license_plate ILIKE '%' || search_term || '%' OR
     c.name ILIKE '%' || search_term || '%')
    AND (
      filter_type = 'all' OR
      (filter_type = 'today' AND DATE(sr.date) = CURRENT_DATE) OR
      (filter_type = 'week' AND sr.date >= CURRENT_DATE - INTERVAL '7 days') OR
      (filter_type = 'month' AND DATE_TRUNC('month', sr.date) = DATE_TRUNC('month', CURRENT_DATE)) OR
      (filter_type = 'high-value' AND sr.total > 500)
    )
  ORDER BY sr.date DESC
  OFFSET from_index
  LIMIT (to_index - from_index + 1);
END;
$$ LANGUAGE plpgsql STABLE;