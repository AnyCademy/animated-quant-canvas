# Split Payment Testing Checklist

Use this checklist to manually verify that split payment functionality is working correctly.

## Pre-Testing Setup

### ✅ Environment Setup
- [ ] Database migration applied (`database_migration_split_payment.sql`)
- [ ] Environment variables configured in `.env`
- [ ] Backend server running (`npm start` in `/backend`)
- [ ] Frontend running (`npm run dev` in `/frontend`)
- [ ] Valid Midtrans sandbox credentials configured

### ✅ Test Data Setup
- [ ] At least one course with price > 50,000 IDR exists
- [ ] At least one course with price < 50,000 IDR exists
- [ ] Instructor payment settings configured in database
- [ ] Test user account created

## Automated Testing

### ✅ Run Test Script
```bash
cd frontend
node test-split-payment.js
```
- [ ] All tests pass
- [ ] No critical errors reported
- [ ] Warnings addressed if any

## Manual Testing Scenarios

### Scenario 1: Split Payment Success (High Price Course)

**Course:** Price = 100,000 IDR (above minimum)

**Steps:**
1. [ ] Navigate to course page
2. [ ] Click "Enroll Now" button
3. [ ] Verify payment page shows split breakdown:
   - [ ] Total: 100,000 IDR
   - [ ] Platform fee (10%): 10,000 IDR
   - [ ] Instructor share: 90,000 IDR
4. [ ] Click "Pay" button
5. [ ] Complete payment with test card: `4811 1111 1111 1114`
6. [ ] Verify success message mentions platform fee split
7. [ ] Verify course enrollment successful

**Database Verification:**
```sql
SELECT 
  split_payment_enabled,
  platform_fee,
  instructor_share,
  platform_fee_percentage,
  status
FROM payments 
WHERE midtrans_order_id LIKE 'ord-%'
ORDER BY created_at DESC 
LIMIT 1;
```

**Expected Results:**
- [ ] `split_payment_enabled` = `true`
- [ ] `platform_fee` = `10000.00`
- [ ] `instructor_share` = `90000.00`
- [ ] `platform_fee_percentage` = `10.00`
- [ ] `status` = `paid`

### Scenario 2: Direct Payment (Low Price Course)

**Course:** Price = 30,000 IDR (below minimum)

**Steps:**
1. [ ] Navigate to low-price course page
2. [ ] Click "Enroll Now" button
3. [ ] Verify payment page does NOT show split breakdown
4. [ ] Complete payment
5. [ ] Verify success without split payment mention

**Database Verification:**
- [ ] `split_payment_enabled` = `false`
- [ ] `platform_fee` = `0.00`
- [ ] `instructor_share` = `0.00`

### Scenario 3: Split Payment Disabled

**Steps:**
1. [ ] Set `VITE_ENABLE_SPLIT_PAYMENT=false` in `.env`
2. [ ] Restart frontend
3. [ ] Try purchasing high-price course
4. [ ] Verify no split payment occurs

**Expected:**
- [ ] Payment goes directly to instructor
- [ ] No platform fee collected
- [ ] `split_payment_enabled` = `false`

### Scenario 4: Payment Failure Handling

**Steps:**
1. [ ] Use failing test card: `4411 1111 1111 1118`
2. [ ] Verify graceful error handling
3. [ ] Check that no enrollment is created
4. [ ] Verify payment status remains 'pending' or 'failed'

## Console Log Verification

### ✅ Browser DevTools
Open DevTools (F12) and check console for:

**Split Payment Enabled:**
- [ ] "Creating split payment with breakdown" message
- [ ] Breakdown shows correct amounts
- [ ] "Split payment token created successfully"

**Split Payment Disabled:**
- [ ] "Creating direct payment to instructor (no split)" message

**Payment Success:**
- [ ] "Split payment settlement processed" message
- [ ] Correct amounts logged

## Analytics Dashboard Testing

### ✅ Platform Earnings Dashboard
If dashboard component exists:
1. [ ] Navigate to platform earnings dashboard
2. [ ] Verify split payment transactions appear
3. [ ] Check summary statistics are correct
4. [ ] Verify date filtering works

### ✅ Database Views
```sql
-- Platform earnings view
SELECT * FROM platform_earnings_view 
WHERE date >= CURRENT_DATE - INTERVAL '7 days';

-- Instructor earnings view  
SELECT * FROM instructor_earnings_view 
LIMIT 5;
```

- [ ] Views return data without errors
- [ ] Amounts match individual payment records
- [ ] Calculations are correct

## Error Testing

### ✅ Network Issues
1. [ ] Disconnect network during payment
2. [ ] Verify appropriate error message
3. [ ] Check payment status handling

### ✅ Invalid Credentials
1. [ ] Temporarily use invalid Midtrans keys
2. [ ] Verify graceful fallback to instructor payment
3. [ ] Check error logging

### ✅ Missing Instructor Settings
1. [ ] Remove instructor payment settings
2. [ ] Verify appropriate error message
3. [ ] No payment processing occurs

## Production Readiness

### ✅ Pre-Production Checklist
- [ ] All sandbox tests pass
- [ ] Production Midtrans accounts set up
- [ ] Production environment variables ready
- [ ] Monitoring and alerting configured
- [ ] Backup plan in place

### ✅ Go-Live Test
1. [ ] Test with small real amount (e.g., 10,000 IDR)
2. [ ] Verify real money split correctly
3. [ ] Check actual Midtrans dashboard for transaction
4. [ ] Verify database records are correct

## Common Issues Troubleshooting

### Payment Token Creation Fails
- [ ] Check Midtrans credentials format
- [ ] Verify backend server is running
- [ ] Check network connectivity
- [ ] Review backend error logs

### Split Amounts Incorrect
- [ ] Verify platform fee percentage setting
- [ ] Check minimum split amount configuration
- [ ] Review split calculation logic

### Database Errors
- [ ] Confirm migration was applied
- [ ] Check table permissions
- [ ] Verify view creation

### No Split Payment Occurring
- [ ] Check `VITE_ENABLE_SPLIT_PAYMENT` setting
- [ ] Verify course price above minimum
- [ ] Confirm platform credentials exist
- [ ] Review browser console logs

---

## Test Results Summary

**Date:** _______________
**Tester:** _______________

**Results:**
- [ ] All automated tests pass
- [ ] All manual scenarios work correctly  
- [ ] Database records accurate
- [ ] Console logs show correct behavior
- [ ] Error handling works properly

**Issues Found:**
_________________________________________________
_________________________________________________
_________________________________________________

**Ready for Production:** [ ] YES / [ ] NO

**Next Steps:**
_________________________________________________
_________________________________________________
