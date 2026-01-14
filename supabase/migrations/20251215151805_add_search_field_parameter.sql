/*
  # Add Search Field Parameter to Service Search Function

  1. Changes
    - Add `search_field` parameter to control which fields to search
    - Support searching specific fields: 'customer', 'vehicle', 'description', 'license_plate', 'all'
    - Improve search precision by allowing users to narrow search scope
    - Prioritize customer name matches when searching 'all' fields
  
  2. Search Field Options
    - 'all': Search across all fields (customer, vehicle, description, notes, license plate)
    - 'customer': Search only customer name
    - 'vehicle': Search only vehicle make and model
    - 'description': Search only service description and notes
    - 'license_plate': Search only license plate
  
  3. Purpose
    - Fix pagination issue where broad searches return too many irrelevant results
    - Allow users to find specific customer records without wading through unrelated matches
    - Maintain backwards compatibility with existing searches (defaults to 'all')
*/

-- Drop existing function
DROP FUNCTION IF EXISTS search_service_records;

-- Create updated function with search_field parameter
CREATE OR REPLACE FUNCTION search_service_records(
  search_term TEXT DEFAULT NULL,
  filter_type TEXT DEFAULT 'all',
  search_field TEXT DEFAULT 'all',
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
  total_count BIGINT,
  match_field TEXT
) AS $$
DECLARE
  v_total_count BIGINT;
BEGIN
  -- Get total count first with field-specific search
  SELECT COUNT(*) INTO v_total_count
  FROM service_records sr
  INNER JOIN vehicles v ON sr.vehicle_id = v.id
  INNER JOIN customers c ON v.customer_id = c.id
  WHERE 
    (search_term IS NULL OR 
      CASE 
        WHEN search_field = 'customer' THEN
          c.name ILIKE '%' || search_term || '%'
        WHEN search_field = 'vehicle' THEN
          v.make ILIKE '%' || search_term || '%' OR
          v.model ILIKE '%' || search_term || '%'
        WHEN search_field = 'description' THEN
          sr.description ILIKE '%' || search_term || '%' OR
          sr.notes ILIKE '%' || search_term || '%'
        WHEN search_field = 'license_plate' THEN
          v.license_plate ILIKE '%' || search_term || '%'
        ELSE
          -- 'all' - search everything
          sr.description ILIKE '%' || search_term || '%' OR
          sr.notes ILIKE '%' || search_term || '%' OR
          v.make ILIKE '%' || search_term || '%' OR
          v.model ILIKE '%' || search_term || '%' OR
          v.license_plate ILIKE '%' || search_term || '%' OR
          c.name ILIKE '%' || search_term || '%'
      END
    )
    AND (
      filter_type = 'all' OR
      (filter_type = 'today' AND DATE(sr.date) = CURRENT_DATE) OR
      (filter_type = 'week' AND sr.date >= CURRENT_DATE - INTERVAL '7 days') OR
      (filter_type = 'month' AND DATE_TRUNC('month', sr.date) = DATE_TRUNC('month', CURRENT_DATE)) OR
      (filter_type = 'high-value' AND sr.total > 500)
    );

  -- Return paginated results with field-specific search and match indicator
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
    v_total_count as total_count,
    -- Determine which field matched
    CASE 
      WHEN search_term IS NULL THEN NULL
      WHEN c.name ILIKE '%' || search_term || '%' THEN 'customer'
      WHEN v.license_plate ILIKE '%' || search_term || '%' THEN 'license_plate'
      WHEN v.make ILIKE '%' || search_term || '%' OR v.model ILIKE '%' || search_term || '%' THEN 'vehicle'
      WHEN sr.description ILIKE '%' || search_term || '%' THEN 'description'
      WHEN sr.notes ILIKE '%' || search_term || '%' THEN 'notes'
      ELSE NULL
    END as match_field
  FROM service_records sr
  INNER JOIN vehicles v ON sr.vehicle_id = v.id
  INNER JOIN customers c ON v.customer_id = c.id
  WHERE 
    (search_term IS NULL OR 
      CASE 
        WHEN search_field = 'customer' THEN
          c.name ILIKE '%' || search_term || '%'
        WHEN search_field = 'vehicle' THEN
          v.make ILIKE '%' || search_term || '%' OR
          v.model ILIKE '%' || search_term || '%'
        WHEN search_field = 'description' THEN
          sr.description ILIKE '%' || search_term || '%' OR
          sr.notes ILIKE '%' || search_term || '%'
        WHEN search_field = 'license_plate' THEN
          v.license_plate ILIKE '%' || search_term || '%'
        ELSE
          -- 'all' - search everything
          sr.description ILIKE '%' || search_term || '%' OR
          sr.notes ILIKE '%' || search_term || '%' OR
          v.make ILIKE '%' || search_term || '%' OR
          v.model ILIKE '%' || search_term || '%' OR
          v.license_plate ILIKE '%' || search_term || '%' OR
          c.name ILIKE '%' || search_term || '%'
      END
    )
    AND (
      filter_type = 'all' OR
      (filter_type = 'today' AND DATE(sr.date) = CURRENT_DATE) OR
      (filter_type = 'week' AND sr.date >= CURRENT_DATE - INTERVAL '7 days') OR
      (filter_type = 'month' AND DATE_TRUNC('month', sr.date) = DATE_TRUNC('month', CURRENT_DATE)) OR
      (filter_type = 'high-value' AND sr.total > 500)
    )
  ORDER BY 
    -- Prioritize customer name matches when search_field is 'all'
    CASE 
      WHEN search_field = 'all' AND search_term IS NOT NULL AND c.name ILIKE '%' || search_term || '%' THEN 0
      ELSE 1
    END,
    sr.date DESC
  OFFSET from_index
  LIMIT (to_index - from_index + 1);
END;
$$ LANGUAGE plpgsql STABLE;
