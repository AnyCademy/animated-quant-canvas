-- Database migration to add split payment support to payments table
-- Run this in your Supabase SQL editor

-- Add split payment columns to payments table
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS split_payment_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS platform_fee DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS instructor_share DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS platform_fee_percentage DECIMAL(5,2) DEFAULT 0;

-- Create index for split payment queries
CREATE INDEX IF NOT EXISTS idx_payments_split_payment_enabled 
ON payments(split_payment_enabled) 
WHERE split_payment_enabled = true;

-- Create a view for platform earnings analytics
CREATE OR REPLACE VIEW platform_earnings_view AS
SELECT 
  DATE_TRUNC('day', paid_at) as date,
  COUNT(*) as total_transactions,
  SUM(amount) as total_revenue,
  SUM(platform_fee) as total_platform_fees,
  SUM(instructor_share) as total_instructor_payments,
  AVG(platform_fee_percentage) as avg_fee_percentage
FROM payments 
WHERE status = 'paid' 
  AND split_payment_enabled = true 
  AND paid_at IS NOT NULL
GROUP BY DATE_TRUNC('day', paid_at)
ORDER BY date DESC;

-- Create a view for instructor earnings
CREATE OR REPLACE VIEW instructor_earnings_view AS
SELECT 
  c.instructor_id,
  p.course_id,
  c.title as course_title,
  COUNT(*) as total_sales,
  SUM(p.amount) as total_course_revenue,
  SUM(p.instructor_share) as total_instructor_earnings,
  SUM(p.platform_fee) as total_platform_fees_paid,
  AVG(p.platform_fee_percentage) as avg_fee_percentage
FROM payments p
JOIN courses c ON p.course_id = c.id
WHERE p.status = 'paid' 
  AND p.paid_at IS NOT NULL
GROUP BY c.instructor_id, p.course_id, c.title
ORDER BY total_instructor_earnings DESC;

-- Add comment to document the split payment feature
COMMENT ON COLUMN payments.split_payment_enabled IS 'Whether this payment uses split billing between instructor and platform';
COMMENT ON COLUMN payments.platform_fee IS 'Amount of the payment that goes to the platform (in the same currency as amount)';
COMMENT ON COLUMN payments.instructor_share IS 'Amount of the payment that goes to the instructor (in the same currency as amount)';
COMMENT ON COLUMN payments.platform_fee_percentage IS 'Percentage of the total amount taken as platform fee';

-- Add constraint to ensure platform_fee + instructor_share = amount (with some tolerance for rounding)
ALTER TABLE payments 
ADD CONSTRAINT check_split_payment_amounts 
CHECK (
  split_payment_enabled = false OR 
  (ABS(platform_fee + instructor_share - amount) < 0.01)
);

-- Grant necessary permissions for the views
GRANT SELECT ON platform_earnings_view TO authenticated;
GRANT SELECT ON instructor_earnings_view TO authenticated;

-- Add RLS policies for the new views if needed
-- (Note: Views inherit RLS from underlying tables, but you can add additional policies if needed)

-- Create function to calculate split payment breakdown (useful for consistency)
CREATE OR REPLACE FUNCTION calculate_split_payment(
  course_amount DECIMAL,
  fee_percentage DECIMAL DEFAULT 10,
  fixed_fee DECIMAL DEFAULT 0
) RETURNS TABLE(
  total_amount DECIMAL,
  platform_fee DECIMAL,
  instructor_share DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    course_amount as total_amount,
    LEAST((course_amount * fee_percentage / 100) + fixed_fee, course_amount * 0.5) as platform_fee,
    course_amount - LEAST((course_amount * fee_percentage / 100) + fixed_fee, course_amount * 0.5) as instructor_share;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Example usage of the function:
-- SELECT * FROM calculate_split_payment(100000, 10, 0); -- For 100k IDR with 10% fee
