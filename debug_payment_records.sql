-- First, check if the payment record exists at all
SELECT 
  midtrans_order_id,
  amount,
  status,
  created_at,
  -- Check if split payment columns exist
  CASE 
    WHEN split_payment_enabled IS NULL THEN 'Column missing'
    ELSE split_payment_enabled::text
  END as split_enabled_status
FROM payments 
WHERE midtrans_order_id LIKE 'ord-c7c162e6%'
ORDER BY created_at DESC;

-- Check recent payments (any payments)
SELECT 
  midtrans_order_id,
  amount,
  status,
  created_at
FROM payments 
ORDER BY created_at DESC 
LIMIT 10;

-- Check table structure to see if split payment columns exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'payments' 
  AND column_name IN ('split_payment_enabled', 'platform_fee', 'instructor_share', 'platform_fee_percentage')
ORDER BY column_name;
