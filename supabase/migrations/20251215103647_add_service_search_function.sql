/*
  # Add Service Search Function

  1. New Functions
    - `search_service_records` - Full-text search function for service records
      - Searches across description, vehicle make/model/plate, and customer name
      - Returns service records with joined vehicle and customer data
      - Supports pagination and ordering
  
  2. Purpose
    - Enable efficient server-side searching across related tables
    - Improve performance by avoiding client-side filtering
    - Support pagination with accurate total counts
*/

-- Drop function if exists
DROP FUNCTION IF EXISTS search_service_records;

-- Create function to search service records across all relevant fields
CREATE OR REPLACE FUNCTION search_service_records(
  search_term TEXT DEFAULT NULL,
  filter_type TEXT DEFAULT 'all',
  from_index INT DEFAULT 0,
  to_index INT DEFAULT 49
)
RETURNS TABLE (
  id UUID,
  date TIMESTAMPTZ,
  description TEXT,
  mileage BIGINT,
  labor_cost NUMERIC,
  parts_cost NUMERIC,
  total NUMERIC,
  vehicle_id UUID,
  created_at TIMESTAMPTZ,
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
    sr.date,
    sr.description,
    sr.mileage,
    sr.labor_cost,
    sr.parts_cost,
    sr.total,
    sr.vehicle_id,
    sr.created_at,
    v_total_count as total_count
  FROM service_records sr
  INNER JOIN vehicles v ON sr.vehicle_id = v.id
  INNER JOIN customers c ON v.customer_id = c.id
  WHERE 
    (search_term IS NULL OR 
     sr.description ILIKE '%' || search_term || '%' OR
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