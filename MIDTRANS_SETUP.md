# Midtrans Payment Integration Setup Guide

## Overview
This implementation adds Midtrans payment gateway integration to your course platform, allowing users to purchase individual courses securely.

## Features Implemented
- ✅ Individual course payment pages
- ✅ Secure Midtrans Snap payment integration
- ✅ Payment status tracking in database
- ✅ Automatic enrollment after successful payment
- ✅ Payment result pages (success, pending, failed)
- ✅ Support for multiple payment methods (Credit Card, Bank Transfer, E-Wallets, etc.)

## Setup Instructions

### 1. Midtrans Account Setup
1. Create a Midtrans account at https://midtrans.com/
2. Get your credentials from the Midtrans dashboard:
   - **Client Key**: Used for frontend
   - **Server Key**: Used for backend API calls
3. For development, use Sandbox credentials

### 2. Environment Configuration
1. Copy `.env.example` to `.env`
2. Replace the placeholder values with your actual Midtrans credentials:

```bash
# For Sandbox (Development)
VITE_MIDTRANS_CLIENT_KEY=SB-Mid-client-YOUR_ACTUAL_CLIENT_KEY
VITE_MIDTRANS_SERVER_KEY=SB-Mid-server-YOUR_ACTUAL_SERVER_KEY
VITE_MIDTRANS_IS_PRODUCTION=false

# For Production
# VITE_MIDTRANS_CLIENT_KEY=Mid-client-YOUR_ACTUAL_CLIENT_KEY
# VITE_MIDTRANS_SERVER_KEY=Mid-server-YOUR_ACTUAL_SERVER_KEY
# VITE_MIDTRANS_IS_PRODUCTION=true
```

### 3. Database Schema
The payment system uses the existing `payments` table in your Supabase database with these fields:
- `id`: Primary key
- `user_id`: Reference to the user making the payment
- `course_id`: Reference to the course being purchased
- `amount`: Payment amount in IDR
- `currency`: Currency code (default: IDR)
- `midtrans_order_id`: Unique order identifier for Midtrans
- `midtrans_transaction_id`: Transaction ID from Midtrans
- `status`: Payment status (pending, paid, failed, expired)
- `payment_method`: Payment method used
- `paid_at`: Timestamp when payment was completed
- `created_at`, `updated_at`: Timestamps

### 4. How It Works

#### Payment Flow:
1. User clicks "Enroll" on a paid course
2. System shows the payment page with course details
3. User clicks "Pay" button
4. Payment record is created in database
5. Midtrans Snap token is generated
6. Midtrans payment modal opens
7. User completes payment using their preferred method
8. Payment status is updated in database
9. If successful, user is automatically enrolled in the course
10. User is redirected to appropriate result page

#### Payment Methods Supported:
- Credit/Debit Cards (Visa, MasterCard, JCB, Amex)
- Bank Transfer (All major Indonesian banks)
- E-Wallets (GoPay, ShopeePay, Dana, LinkAja, etc.)
- Convenience Store payments (Indomaret, Alfamart)
- Installment options

### 5. Testing

#### Sandbox Test Cards:
```
# Successful Payment
Card Number: 4811 1111 1111 1114
CVV: 123
Exp: 01/25

# Failed Payment
Card Number: 4911 1111 1111 1113
CVV: 123
Exp: 01/25
```

### 6. Production Deployment
1. Change environment variables to production values
2. Set `VITE_MIDTRANS_IS_PRODUCTION=true`
3. Update callback URLs in your Midtrans dashboard to your production domain
4. Test with real payment methods

### 7. Security Considerations
- Server keys are exposed in frontend (acceptable for this implementation)
- For enhanced security, consider moving token generation to a backend service
- All payments are secured by Midtrans with 256-bit SSL encryption
- Payment status verification can be enhanced with webhook notifications

### 8. Customization Options
- Modify payment page styling in `src/components/PaymentPage.tsx`
- Add more payment method icons or remove unsupported ones
- Customize payment success/failure messages
- Add additional payment validation logic
- Implement subscription-based payments for course bundles

### 9. Monitoring & Analytics
- Monitor payment success/failure rates in Midtrans dashboard
- Track payment metrics in your Supabase database
- Set up notifications for failed payments
- Implement payment retry logic for failed transactions

### 10. Support & Troubleshooting
- Check Midtrans documentation: https://docs.midtrans.com/
- Monitor browser console for payment-related errors
- Verify webhook notifications are properly handled
- Test different payment methods in sandbox environment

## File Structure
```
src/
├── lib/
│   └── midtrans.ts          # Midtrans service utilities
├── components/
│   └── PaymentPage.tsx      # Payment page component
├── pages/
│   ├── Course.tsx           # Updated with payment integration
│   └── PaymentResult.tsx    # Payment result pages
└── App.tsx                  # Updated with payment routes
```

## Next Steps
1. Set up your Midtrans credentials
2. Test payments in sandbox environment
3. Customize payment page design to match your brand
4. Add webhook handling for real-time payment status updates
5. Implement email notifications for payment confirmations
6. Add payment analytics and reporting features
