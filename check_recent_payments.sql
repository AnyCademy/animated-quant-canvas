-- Check recent payment records to see if split payment data is being saved
SELECT 
  midtrans_order_id,
  amount,
  status,
  split_payment_enabled,
  platform_fee,
  instructor_share,
  platform_fee_percentage,
  created_at
FROM payments 
ORDER BY created_at DESC 
LIMIT 10;

-- Check if your specific order exists
SELECT 
  midtrans_order_id,
  amount,
  status,
  split_payment_enabled,
  platform_fee,
  instructor_share,
  platform_fee_percentage,
  created_at
FROM payments 
WHERE midtrans_order_id LIKE '%c7c162e6%' 
   OR midtrans_order_id LIKE '%1754283636438%'
ORDER BY created_at DESC;
