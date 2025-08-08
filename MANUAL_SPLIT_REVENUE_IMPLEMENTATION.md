# Manual Split Revenue Implementation Guide

This implementation provides a comprehensive manual split revenue system for the AnyCademy platform, transitioning from instructor-centric to platform-centric payment processing.

## 📋 Overview

The system implements:
- **Centralized Payment Processing**: Single platform Midtrans account for all transactions
- **Automated Revenue Splitting**: Configurable fee structures and automatic calculations
- **Manual Payout System**: Admin-controlled instructor payouts with verification
- **Comprehensive Dashboard**: Earnings tracking for instructors and payout management for admins

## 🚀 Implementation Status

### ✅ Completed Components

1. **Database Schema** (`database_migration_manual_split_revenue.sql`)
   - Revenue splits tracking
   - Payout batches management
   - Platform settings configuration
   - Instructor bank accounts
   - Complete RLS policies and triggers

2. **Core Services**
   - `platformSettings.ts` - Platform configuration management
   - `platformPayment.ts` - Centralized payment processing
   - `revenueSplit.ts` - Revenue calculation and tracking
   - `payoutManager.ts` - Payout batch management
   - `revenueSplitTemp.ts` - Temporary implementation for demo

3. **User Interface Components**
   - `InstructorEarnings.tsx` - Instructor earnings dashboard
   - `BankAccountManagement.tsx` - Bank account setup and verification
   - `AdminPayouts.tsx` - Admin payout management interface
   - `PlatformPaymentPage.tsx` - Centralized payment processing UI

### 🔄 Implementation Steps

## Step 1: Database Setup

1. **Run the Database Migration**
   ```sql
   -- Execute the contents of database_migration_manual_split_revenue.sql
   -- in your Supabase SQL editor
   ```

2. **Verify Tables Created**
   - `revenue_splits`
   - `payout_batches`
   - `platform_settings`
   - `instructor_bank_accounts`
   - `payout_batch_items`

## Step 2: Platform Configuration

1. **Update Platform Settings**
   ```typescript
   // Update the Midtrans configuration in platform_settings table
   UPDATE platform_settings 
   SET setting_value = '{
     "client_key": "YOUR_PLATFORM_CLIENT_KEY",
     "server_key": "YOUR_PLATFORM_SERVER_KEY",
     "is_production": false,
     "is_active": true
   }'
   WHERE setting_key = 'midtrans_config';
   ```

2. **Configure Revenue Split Rules**
   ```typescript
   // The default configuration is already set, but you can customize:
   // - Platform fee percentages by course price tiers
   // - Special rates for featured instructors
   // - Minimum payout amounts
   // - Payout schedules
   ```

## Step 3: Disable Legacy System

1. **Migrate Instructor Payment Settings**
   ```sql
   -- Disable all instructor payment settings
   UPDATE instructor_payment_settings 
   SET is_active = false, 
       migration_status = 'migrated'
   WHERE is_active = true;
   ```

## Step 4: Update Application Routes

1. **Add New Routes** (in your routing configuration)
   ```typescript
   // Add these routes to your application
   {
     path: '/instructor/earnings',
     component: InstructorEarnings,
     protected: true,
     role: 'instructor'
   },
   {
     path: '/instructor/bank-account',
     component: BankAccountManagement,
     protected: true,
     role: 'instructor'
   },
   {
     path: '/admin/payouts',
     component: AdminPayouts,
     protected: true,
     role: 'admin'
   }
   ```

2. **Update Payment Flow**
   ```typescript
   // Replace PaymentPage with PlatformPaymentPage
   import PlatformPaymentPage from '@/components/PlatformPaymentPage';
   
   // Use in your course enrollment flow
   <PlatformPaymentPage 
     course={course}
     onPaymentSuccess={() => {/* handle success */}}
     onPaymentCancel={() => {/* handle cancel */}}
   />
   ```

## Step 5: Navigation Updates

1. **Add Instructor Menu Items**
   ```typescript
   // Add to instructor dashboard navigation
   {
     title: "Earnings",
     href: "/instructor/earnings",
     icon: DollarSign
   },
   {
     title: "Bank Account",
     href: "/instructor/bank-account", 
     icon: CreditCard
   }
   ```

2. **Add Admin Menu Items**
   ```typescript
   // Add to admin dashboard navigation
   {
     title: "Payout Management",
     href: "/admin/payouts",
     icon: Users
   }
   ```

## 🔧 Configuration Options

### Revenue Split Configuration

```typescript
// Default fee structure (configurable in platform_settings)
{
  "default_platform_fee_percentage": 10,
  "minimum_payout_amount": 50000,
  "payout_schedule": "monthly",
  "fee_tiers": [
    {
      "min_amount": 0,
      "max_amount": 100000,
      "fee_percentage": 5,
      "description": "Budget courses"
    },
    {
      "min_amount": 100001,
      "max_amount": 500000,
      "fee_percentage": 10,
      "description": "Standard courses"
    },
    {
      "min_amount": 500001,
      "max_amount": 999999999,
      "fee_percentage": 15,
      "description": "Premium courses"
    }
  ],
  "special_instructor_rates": {
    "featured_instructors": 5,
    "new_instructors": 8,
    "top_performers": 7
  }
}
```

### Payout Configuration

```typescript
{
  "payout_methods": ["manual_transfer", "bank_api", "digital_wallet"],
  "payout_schedules": ["weekly", "bi_weekly", "monthly"],
  "minimum_amounts": {
    "manual_transfer": 50000,
    "bank_api": 25000,
    "digital_wallet": 10000
  },
  "processing_fees": {
    "manual_transfer": 0,
    "bank_api": 2500,
    "digital_wallet": 1000
  }
}
```

## 📊 User Workflows

### For Instructors

1. **Set Up Bank Account**
   - Navigate to `/instructor/bank-account`
   - Enter bank details for payouts
   - Wait for admin verification

2. **Track Earnings**
   - View earnings dashboard at `/instructor/earnings`
   - Monitor pending and paid earnings
   - Request payouts when minimum threshold is met

3. **Request Payouts**
   - Click "Request Payout" when available
   - System creates payout request for admin approval
   - Receive email notifications on status updates

### For Admins

1. **Monitor Payout Requests**
   - Access admin dashboard at `/admin/payouts`
   - Review pending payout requests
   - Verify instructor bank account details

2. **Process Payouts**
   - Approve individual requests or create batch payouts
   - Add batch references for tracking
   - Mark as completed after bank transfer

3. **Financial Oversight**
   - Monitor platform revenue and instructor payments
   - Generate reports and analytics
   - Manage fee structures and special rates

## 🔒 Security Features

- **Bank Account Verification**: All bank accounts require admin verification
- **Dual Authorization**: Large payouts require additional approval
- **Audit Trail**: Complete logging of all financial transactions
- **Encrypted Storage**: All financial data encrypted at rest
- **Access Control**: Role-based permissions for financial data

## 🚨 Important Notes

### Data Migration
- Current implementation uses localStorage for demonstration
- In production, all data will be stored in Supabase tables
- Existing instructor payment settings are preserved but disabled

### Testing
- Use Midtrans sandbox environment for testing
- Test revenue split calculations with various amounts
- Verify payout workflows with test bank accounts

### Production Deployment
1. Update Midtrans configuration to production credentials
2. Set `is_production: true` in platform settings
3. Configure real bank account verification process
4. Set up email notifications for payout status updates

## 📈 Future Enhancements

### Phase 2 Features (Optional)
- **Automated Payouts**: Integration with banking APIs
- **Advanced Analytics**: Detailed financial reporting
- **Tax Integration**: Automatic tax document generation
- **Multi-currency Support**: International instructor support

### Phase 3 Features (Optional)
- **Real-time Payouts**: Instant payout options
- **Revenue Sharing**: Collaborative course revenue splits
- **Financial Planning**: Earnings forecasting tools

## 🆘 Support

### Common Issues

1. **Payment Configuration Errors**
   - Verify platform Midtrans credentials
   - Check platform_settings table values
   - Ensure all required tables are created

2. **Revenue Split Calculation Issues**
   - Verify fee tier configuration
   - Check special instructor rates
   - Test with various course amounts

3. **Payout Request Problems**
   - Ensure bank account is verified
   - Check minimum payout amounts
   - Verify instructor has pending earnings

### Contact
For implementation support or questions, please refer to the development team or create an issue in the project repository.

## 📝 Conclusion

This manual split revenue system provides a comprehensive solution for transitioning from instructor-centric to platform-centric payment processing. The implementation prioritizes:

- **Simplicity**: Easy-to-understand revenue sharing
- **Transparency**: Clear earnings tracking for instructors
- **Scalability**: System that grows with the platform
- **Security**: Robust financial controls and audit trails
- **User Experience**: Intuitive interfaces for all stakeholders

The system is ready for production deployment after completing the database migration and configuration steps outlined above.
