-- Check the most recent payment to verify split payment is working
SELECT 
  midtrans_order_id,
  amount,
  status,
  split_payment_enabled,
  platform_fee,
  instructor_share,
  platform_fee_percentage,
  created_at,
  updated_at
FROM payments 
WHERE midtrans_order_id = 'ord-f27aaf87-a284fc17-1754287319301'
   OR created_at >= '2025-08-04 13:00:00'
ORDER BY created_at DESC 
LIMIT 5;
