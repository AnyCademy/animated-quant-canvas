-- Check if there are data type inconsistencies with course prices
SELECT 
  id,
  title,
  price,
  typeof(price) as price_type,
  status,
  instructor_id,
  created_at
FROM courses 
WHERE instructor_id IN (
  SELECT instructor_id 
  FROM instructor_payment_settings 
  WHERE is_active = true
)
ORDER BY created_at DESC 
LIMIT 5;

-- Check a specific course that was used in payments
SELECT 
  c.id,
  c.title,
  c.price,
  c.instructor_id,
  ips.is_active as payment_gateway_active,
  ips.midtrans_client_key IS NOT NULL as has_client_key,
  ips.midtrans_server_key IS NOT NULL as has_server_key
FROM courses c
LEFT JOIN instructor_payment_settings ips ON c.instructor_id = ips.instructor_id
WHERE c.id IN (
  SELECT DISTINCT course_id 
  FROM payments 
  WHERE created_at >= '2025-08-03'
)
ORDER BY c.created_at DESC;
