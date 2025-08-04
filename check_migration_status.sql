-- Check if the split payment migration was applied
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'payments' 
  AND column_name IN (
    'split_payment_enabled', 
    'platform_fee', 
    'instructor_share', 
    'platform_fee_percentage'
  )
ORDER BY column_name;

-- If columns exist, check the most recent payment record (without filtering)
SELECT 
  midtrans_order_id,
  amount,
  status,
  created_at,
  -- Check if these columns exist and have values
  split_payment_enabled,
  platform_fee,
  instructor_share,
  platform_fee_percentage
FROM payments 
ORDER BY created_at DESC 
LIMIT 5;
