# How to Test Split Payment Success - Quick Guide

## 🚀 Quick Start

### 1. Prerequisites Check
```bash
# Make sure backend is running
cd backend && npm start

# Make sure frontend is running  
cd frontend && npm run dev

# Run automated test
cd frontend && node test-split-payment.js
```

### 2. Test Split Payment Calculation
```bash
# Test with high price (should enable split)
curl -X POST http://localhost:3001/api/test-split-calculation \
  -H "Content-Type: application/json" \
  -d '{"coursePrice": 100000}'

# Test with low price (should disable split)
curl -X POST http://localhost:3001/api/test-split-calculation \
  -H "Content-Type: application/json" \
  -d '{"coursePrice": 30000}'
```

Expected high price response:
```json
{
  "status": "success",
  "splitPaymentEnabled": true,
  "breakdown": {
    "totalAmount": 100000,
    "platformFee": 10000,
    "instructorShare": 90000,
    "platformFeePercentage": 10
  }
}
```

### 3. Manual Payment Test

**Step-by-step:**
1. Go to a course with price > 50,000 IDR
2. Click "Enroll Now" 
3. Verify split payment breakdown is shown
4. Use test card: `4811 1111 1111 1114`
5. Complete payment
6. Check database for split payment record

### 4. Verify in Database
```sql
-- Check latest payment
SELECT 
  split_payment_enabled,
  platform_fee,
  instructor_share,
  platform_fee_percentage,
  status
FROM payments 
ORDER BY created_at DESC 
LIMIT 1;
```

**Success indicators:**
- `split_payment_enabled` = `true`  
- `platform_fee` = expected amount (e.g., 10,000 for 100k course)
- `instructor_share` = course price - platform fee
- `status` = `paid`

## ✅ Success Criteria

### Payment Flow Success
- [ ] Split payment breakdown shown on payment page
- [ ] Payment processes without errors
- [ ] Success message mentions split payment
- [ ] Course enrollment created
- [ ] Correct amounts in database

### Database Success  
- [ ] `split_payment_enabled` = `true` for qualifying payments
- [ ] Platform fee calculated correctly
- [ ] Instructor share calculated correctly
- [ ] Views (`platform_earnings_view`) return data

### Console Logs Success
Open browser DevTools and look for:
- [ ] "Creating split payment with breakdown"
- [ ] "Split payment token created successfully"  
- [ ] "Split payment settlement processed"

## 🐛 Common Issues & Solutions

### ❌ Split Payment Not Working
**Check:**
- `VITE_ENABLE_SPLIT_PAYMENT=true` in `.env`
- Course price above `VITE_MINIMUM_SPLIT_AMOUNT`
- Platform credentials configured
- Database migration applied

### ❌ Payment Token Creation Fails
**Check:**
- Backend server running on port 3001
- Valid Midtrans credentials
- Network connectivity
- Backend error logs

### ❌ Wrong Split Amounts
**Check:**
- `VITE_PLATFORM_FEE_PERCENTAGE` setting
- Test calculation endpoint results
- Database constraint errors

### ❌ Database Errors
**Check:**
- Migration applied: `database_migration_split_payment.sql`
- Column exists: `split_payment_enabled`
- Table permissions

## 📊 Testing with Different Amounts

```bash
# Test various course prices
for price in 30000 50000 100000 500000 1000000; do
  echo "Testing price: $price"
  curl -s -X POST http://localhost:3001/api/test-split-calculation \
    -H "Content-Type: application/json" \
    -d "{\"coursePrice\": $price}" | jq '.breakdown'
  echo "---"
done
```

## 🎯 Production Readiness Test

Before going live:
1. [ ] All sandbox tests pass
2. [ ] Test with production credentials (small amount)
3. [ ] Monitor first few real transactions
4. [ ] Verify actual money splits correctly in Midtrans dashboard
5. [ ] Have rollback plan ready

## 📈 Monitoring Split Payments

### Check Platform Revenue
```sql
SELECT * FROM platform_earnings_view 
WHERE date >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY date DESC;
```

### Check Instructor Earnings
```sql
SELECT * FROM instructor_earnings_view 
ORDER BY total_instructor_earnings DESC
LIMIT 10;
```

### Monitor Payment Status
```sql
SELECT 
  DATE(created_at) as date,
  COUNT(*) as total_payments,
  COUNT(*) FILTER (WHERE split_payment_enabled = true) as split_payments,
  SUM(platform_fee) as total_platform_revenue
FROM payments 
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

---

**🎉 Success!** If all tests pass, your split payment functionality is working correctly!
