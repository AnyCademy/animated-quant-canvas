-- Check the most recent split payment
SELECT 
  midtrans_order_id,
  amount,
  split_payment_enabled,
  platform_fee,
  instructor_share,
  platform_fee_percentage,
  status,
  created_at
FROM payments 
WHERE split_payment_enabled = true 
ORDER BY created_at DESC 
LIMIT 5;
