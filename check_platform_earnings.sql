-- Check platform earnings from split payments
SELECT 
  date,
  total_platform_fee,
  total_instructor_share,
  transaction_count
FROM platform_earnings_view 
WHERE date >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY date DESC;

-- Check specific transaction details
SELECT 
  p.midtrans_order_id,
  p.amount as total_amount,
  p.platform_fee,
  p.instructor_share,
  p.status,
  c.title as course_title,
  u.email as student_email
FROM payments p
JOIN courses c ON p.course_id = c.id
JOIN auth.users u ON p.user_id = u.id
WHERE p.midtrans_order_id = 'ord-c7c162e6-a284fc17-1754283636438'  -- Your order ID
OR p.created_at >= NOW() - INTERVAL '1 hour';
