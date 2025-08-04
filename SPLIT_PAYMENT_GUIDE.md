# Split Payment Implementation Guide

## Overview

This implementation adds split billing functionality to your course platform, where each payment is automatically divided between the instructor and the platform. The platform takes a configurable percentage fee from each transaction.

## How It Works

### Payment Flow
1. **Student Purchase**: Student buys a course for the full price
2. **Split Calculation**: System calculates platform fee and instructor share
3. **Payment Processing**: Payment is processed through platform's main Midtrans account
4. **Automatic Split**: Revenue is tracked separately for platform and instructor
5. **Settlement**: Platform can later transfer instructor's share or handle manual payouts

### Example Transaction
- Course Price: 100,000 IDR
- Platform Fee (10%): 10,000 IDR
- Instructor Share: 90,000 IDR
- **Student pays**: 100,000 IDR (full price)
- **Platform receives**: 10,000 IDR automatically
- **Instructor earns**: 90,000 IDR (to be transferred later)

## Setup Instructions

### 1. Database Migration
First, run the database migration to add split payment fields:

```sql
-- Run this in your Supabase SQL editor
-- See: database_migration_split_payment.sql
```

### 2. Environment Configuration
Copy the example environment file and configure your settings:

```bash
cp .env.split-payment.example .env.local
```

Edit `.env.local` and set:
- `VITE_PLATFORM_MIDTRANS_CLIENT_KEY`: Your platform's Midtrans client key
- `VITE_PLATFORM_MIDTRANS_SERVER_KEY`: Your platform's Midtrans server key
- `VITE_PLATFORM_FEE_PERCENTAGE`: Percentage fee (e.g., 10 for 10%)
- `VITE_ENABLE_SPLIT_PAYMENT`: Set to `true` to enable split payments

### 3. Replace Payment Component
Update your course enrollment flow to use the new split payment component:

```typescript
// Instead of importing PaymentPage
import SplitPaymentPage from '@/components/SplitPaymentPage';

// Use in your component
<SplitPaymentPage
  course={course}
  onPaymentSuccess={handlePaymentSuccess}
  onPaymentCancel={handlePaymentCancel}
/>
```

### 4. Backend Update
The backend has been updated with a new endpoint `/api/create-split-payment-token` that handles split payment token creation.

## Configuration Options

### Platform Fee Settings
- **Percentage Fee**: `VITE_PLATFORM_FEE_PERCENTAGE` (default: 10%)
- **Fixed Fee**: `VITE_PLATFORM_FEE_FIXED` (additional fixed amount in IDR)
- **Maximum Fee**: Automatically capped at 50% of course price

### Split Payment Controls
- **Enable/Disable**: `VITE_ENABLE_SPLIT_PAYMENT`
- **Minimum Amount**: `VITE_MINIMUM_SPLIT_AMOUNT` (minimum transaction amount for split payment)

### Fallback Behavior
When split payment is not available (missing platform credentials, below minimum amount, etc.), the system falls back to direct instructor payment.

## Features

### ✅ Implemented
- Automatic split payment calculation
- Platform fee percentage configuration
- Database tracking of split amounts
- Fallback to direct instructor payment
- Payment breakdown display to users
- Enhanced payment security information
- Revenue analytics views

### 🚀 Recommended Enhancements
- Automatic instructor payout system
- Dashboard for platform earnings
- Instructor earnings reports
- Fee adjustment per instructor/course
- Webhook integration for real-time settlement

## Database Schema

### New Columns Added to `payments` table:
- `split_payment_enabled`: Boolean flag
- `platform_fee`: Amount going to platform
- `instructor_share`: Amount going to instructor
- `platform_fee_percentage`: Fee percentage used

### New Views Created:
- `platform_earnings_view`: Platform revenue analytics
- `instructor_earnings_view`: Instructor earnings by course

## Security Considerations

1. **Credential Management**: Platform Midtrans credentials should be kept secure
2. **Fee Validation**: System validates that splits don't exceed course price
3. **Audit Trail**: All split payment transactions are logged
4. **Fallback Safety**: System gracefully handles missing configurations

## Testing Split Payment Functionality

### Prerequisites for Testing
1. **Database Migration Applied**: Ensure `database_migration_split_payment.sql` has been run
2. **Environment Variables Set**: Configure all platform split payment settings in `.env`
3. **Backend Running**: Start the backend server with `npm start` in `/backend` directory
4. **Frontend Running**: Start the frontend with `npm run dev` in `/frontend` directory

### 1. Sandbox Testing Setup

#### Step 1: Configure Sandbox Credentials
Update your `.env` file with sandbox credentials:
```bash
# Platform credentials (your main account)
VITE_PLATFORM_MIDTRANS_CLIENT_KEY=SB-Mid-client-YOUR_PLATFORM_KEY
VITE_PLATFORM_MIDTRANS_SERVER_KEY=SB-Mid-server-YOUR_PLATFORM_KEY
VITE_PLATFORM_MIDTRANS_IS_PRODUCTION=false

# Test instructor credentials (separate sandbox account)
VITE_MIDTRANS_CLIENT_KEY=SB-Mid-client-INSTRUCTOR_TEST_KEY
VITE_MIDTRANS_SERVER_KEY=SB-Mid-server-INSTRUCTOR_TEST_KEY
VITE_MIDTRANS_IS_PRODUCTION=false
```

#### Step 2: Test Midtrans Connection
```bash
# Test platform credentials
curl -X POST http://localhost:3001/api/test-midtrans-connection \
  -H "Content-Type: application/json" \
  -d '{
    "serverKey": "SB-Mid-server-YOUR_PLATFORM_KEY",
    "isProduction": false
  }'
```

### 2. Test Scenarios & Expected Results

#### Scenario 1: Split Payment Enabled (Above Minimum Amount)
**Setup:**
- Course price: 100,000 IDR (above 50,000 minimum)
- Platform fee: 10%
- Valid platform and instructor credentials

**Expected Behavior:**
1. Payment uses platform Midtrans account
2. Database records show:
   ```sql
   SELECT 
     split_payment_enabled,
     platform_fee,
     instructor_share,
     platform_fee_percentage
   FROM payments 
   WHERE midtrans_order_id = 'your-order-id';
   ```
3. Results should be:
   - `split_payment_enabled`: `true`
   - `platform_fee`: `10000.00`
   - `instructor_share`: `90000.00`
   - `platform_fee_percentage`: `10.00`

#### Scenario 2: Below Minimum Amount (Direct Payment)
**Setup:**
- Course price: 30,000 IDR (below 50,000 minimum)
- All other settings valid

**Expected Behavior:**
1. Payment uses instructor's Midtrans account directly
2. Database records:
   - `split_payment_enabled`: `false`
   - `platform_fee`: `0.00`
   - `instructor_share`: `0.00`

#### Scenario 3: Split Payment Disabled
**Setup:**
- Set `VITE_ENABLE_SPLIT_PAYMENT=false`
- Course price above minimum

**Expected Behavior:**
1. Payment goes directly to instructor
2. No platform fee collected
3. `split_payment_enabled`: `false`

#### Scenario 4: Missing Platform Credentials
**Setup:**
- Remove or invalidate platform credentials
- Valid instructor credentials

**Expected Behavior:**
1. System falls back to instructor direct payment
2. Warning logged in console
3. No split payment occurs

### 3. Testing with Real Payment Methods

#### Using Sandbox Test Cards
When testing in sandbox mode, use these test cards:

**Successful Payment:**
- Card: 4811 1111 1111 1114
- CVV: 123
- Expiry: Any future date

**Failed Payment:**
- Card: 4411 1111 1111 1118
- CVV: 123
- Expiry: Any future date

#### Complete Payment Flow Test
1. **Navigate to Course**: Go to a paid course page
2. **Click Enroll**: Click "Enroll Now" button
3. **Verify Split Details**: Check that split payment breakdown is shown
4. **Complete Payment**: Use sandbox test card
5. **Verify Results**: Check database and enrollment status

### 4. Database Verification

#### Check Payment Records
```sql
-- View recent split payments
SELECT 
  p.*,
  c.title as course_title,
  u.email as user_email
FROM payments p
JOIN courses c ON p.course_id = c.id
JOIN auth.users u ON p.user_id = u.id
WHERE p.split_payment_enabled = true
ORDER BY p.created_at DESC
LIMIT 10;
```

#### Verify Platform Earnings
```sql
-- Check platform earnings view
SELECT * FROM platform_earnings_view 
WHERE date >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY date DESC;
```

#### Check Instructor Earnings
```sql
-- View instructor earnings
SELECT * FROM instructor_earnings_view 
ORDER BY total_instructor_earnings DESC
LIMIT 10;
```

### 5. Browser Console Debugging

#### Enable Debug Logging
Open browser DevTools (F12) and watch for these log messages:

**Split Payment Enabled:**
```
Creating split payment with breakdown: {
  totalAmount: 100000,
  platformFee: 10000,
  instructorShare: 90000,
  platformFeePercentage: 10
}
```

**Split Payment Disabled:**
```
Creating direct payment to instructor (no split)
```

**Payment Success:**
```
Split payment settlement processed: {
  orderId: "ord-...",
  transactionId: "...",
  totalAmount: 100000,
  platformFee: 10000,
  instructorShare: 90000
}
```

### 6. Analytics Dashboard Testing

#### Access Platform Dashboard
1. Navigate to platform earnings dashboard (if implemented)
2. Verify that split payment transactions appear
3. Check summary statistics:
   - Total platform revenue
   - Total instructor payments
   - Transaction count

#### Test Revenue Calculations
```sql
-- Manual verification of totals
SELECT 
  SUM(platform_fee) as total_platform_revenue,
  SUM(instructor_share) as total_instructor_payments,
  COUNT(*) as total_transactions
FROM payments 
WHERE split_payment_enabled = true 
  AND status = 'paid';
```

### 7. Error Testing

#### Test Invalid Credentials
1. Use invalid Midtrans keys
2. Verify graceful fallback to instructor payment
3. Check error messages in console

#### Test Network Issues
1. Disconnect network during payment
2. Verify payment status handling
3. Test payment retry functionality

### 8. Production Testing Checklist

Before going live with split payments:

- [ ] **Sandbox Testing Complete**: All scenarios tested successfully
- [ ] **Production Credentials**: Valid production Midtrans accounts set up
- [ ] **Database Migration**: Applied to production database
- [ ] **Environment Variables**: Updated with production values
- [ ] **Small Amount Test**: Test with small real money amount first
- [ ] **Monitoring Setup**: Error tracking and notification system ready
- [ ] **Backup Plan**: Fallback to direct payments if issues occur

### 9. Common Issues & Solutions

#### Split Payment Not Working
```bash
# Check environment variables
echo $VITE_ENABLE_SPLIT_PAYMENT
echo $VITE_PLATFORM_MIDTRANS_CLIENT_KEY
echo $VITE_MINIMUM_SPLIT_AMOUNT
```

#### Database Errors
```sql
-- Check if migration was applied
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'payments' 
  AND column_name IN ('split_payment_enabled', 'platform_fee', 'instructor_share');
```

#### Payment Token Creation Fails
Check backend logs for detailed error messages:
```bash
# In backend directory
npm start
# Watch for error logs during payment
```

### 10. Automated Testing (Future Enhancement)

Consider implementing automated tests:

```javascript
// Example test structure
describe('Split Payment', () => {
  test('should calculate correct split amounts', () => {
    const breakdown = calculateSplitPaymentBreakdown(100000);
    expect(breakdown.platformFee).toBe(10000);
    expect(breakdown.instructorShare).toBe(90000);
  });

  test('should disable split for amounts below minimum', () => {
    const shouldSplit = shouldEnableSplitPayment(30000, mockInstructorSettings);
    expect(shouldSplit).toBe(false);
  });
});
```

## Production Deployment

### Prerequisites
1. Valid production Midtrans account for platform
2. Updated environment variables with production credentials
3. Database migration applied
4. Thorough testing completed

### Deployment Steps
1. Set `VITE_PLATFORM_MIDTRANS_IS_PRODUCTION=true`
2. Update all Midtrans credentials to production values
3. Deploy and monitor first few transactions carefully
4. Set up monitoring for failed split payments

## Monitoring & Analytics

### Platform Revenue Tracking
```sql
-- View platform earnings by date
SELECT * FROM platform_earnings_view 
WHERE date >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY date DESC;
```

### Instructor Earnings
```sql
-- View instructor earnings
SELECT * FROM instructor_earnings_view 
WHERE instructor_id = 'your-instructor-id'
ORDER BY total_instructor_earnings DESC;
```

## Troubleshooting

### Common Issues
1. **Split payment not enabled**: Check platform credentials and minimum amount settings
2. **Payment fails**: Verify Midtrans account status and credentials
3. **Incorrect split amounts**: Check platform fee percentage configuration
4. **Database errors**: Ensure migration has been applied

### Debug Information
The system logs detailed information about:
- Whether split payment is enabled for each transaction
- Split payment calculations
- Fallback reasons when split payment is not used
- Midtrans API responses

## Support

For issues with this implementation:
1. Check the browser console for detailed error messages
2. Verify environment variable configuration
3. Test with Midtrans sandbox credentials first
4. Review the payment diagnostics logs

## Revenue Settlement

### Manual Settlement (Current)
The platform operator needs to manually transfer instructor shares based on the `instructor_earnings_view`.

### Future Automated Settlement
Consider implementing:
- Scheduled automatic transfers to instructor bank accounts
- Midtrans marketplace features for automatic splits
- Integration with banking APIs for direct transfers
- Escrow system for dispute handling
