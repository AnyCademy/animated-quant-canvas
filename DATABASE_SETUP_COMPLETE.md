# 🚀 Manual Split Revenue System - Database Setup Complete

Great! The database migration has been executed successfully. Now let's finalize the implementation with the actual database tables.

## 📝 Current Status

✅ **Database Tables Created**
- `revenue_splits` - Revenue splitting records
- `payout_batches` - Payout management
- `platform_settings` - Configuration
- `instructor_bank_accounts` - Bank details
- `payout_batch_items` - Payout line items

✅ **Core Services Implemented**
- Platform payment processing
- Revenue split calculation
- Payout management
- Bank account management

✅ **User Interface Components**
- Instructor earnings dashboard
- Admin payout management
- Bank account setup
- Platform payment page

## 🔧 Next Steps to Complete Implementation

### 1. Update Supabase Types (Required)

The TypeScript types need to be regenerated to include the new tables:

```bash
# In your Supabase project, regenerate types
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/integrations/supabase/types.ts
```

### 2. Update Environment Variables

Add platform Midtrans credentials to your environment:

```env
# Platform Midtrans Configuration
VITE_PLATFORM_MIDTRANS_CLIENT_KEY=SB-Mid-client-YOUR_PLATFORM_KEY
VITE_PLATFORM_MIDTRANS_SERVER_KEY=SB-Mid-server-YOUR_PLATFORM_KEY
VITE_PLATFORM_MIDTRANS_IS_PRODUCTION=false
```

### 3. Update Platform Settings

Run this SQL to update the platform configuration with your actual keys:

```sql
UPDATE platform_settings 
SET setting_value = jsonb_set(
  setting_value,
  '{client_key}',
  '"SB-Mid-client-YOUR_ACTUAL_KEY"'
)
WHERE setting_key = 'midtrans_config';

UPDATE platform_settings 
SET setting_value = jsonb_set(
  setting_value,
  '{server_key}',
  '"SB-Mid-server-YOUR_ACTUAL_KEY"'
)
WHERE setting_key = 'midtrans_config';
```

### 4. Add Routes to Your Application

Update your router to include the new pages:

```tsx
// In your main router file
import InstructorEarnings from '@/pages/InstructorEarnings';
import AdminPayouts from '@/pages/AdminPayouts';
import BankAccountManagement from '@/components/BankAccountManagement';
import PlatformPaymentPage from '@/components/PlatformPaymentPage';

// Add these routes:
// /instructor/earnings - InstructorEarnings
// /instructor/bank-account - BankAccountManagement  
// /admin/payouts - AdminPayouts
// Update payment flow to use PlatformPaymentPage
```

### 5. Test the System

#### For Instructors:
1. Navigate to `/instructor/bank-account` and add bank details
2. View earnings at `/instructor/earnings`
3. Request payouts when available

#### For Admins:
1. Navigate to `/admin/payouts` to manage requests
2. Approve/reject payout requests
3. Process batch payouts

#### For Payment Flow:
1. Replace existing PaymentPage with PlatformPaymentPage
2. Test course purchases
3. Verify revenue splits are calculated correctly

## 🔧 Quick Fix for Type Issues

Since the types haven't been regenerated yet, here's a helper function to use the new tables:

```typescript
// Add this to a new file: src/lib/databaseHelpers.ts
import { supabase } from '@/integrations/supabase/client';

export const insertRevenueSplit = async (splitData: any) => {
  const { data, error } = await supabase
    .from('revenue_splits' as any)
    .insert(splitData)
    .select();
  
  return { data, error };
};

export const getInstructorRevenueSplits = async (instructorId: string) => {
  const { data, error } = await supabase
    .from('revenue_splits' as any)
    .select('*')
    .eq('instructor_id', instructorId)
    .order('created_at', { ascending: false });
  
  return { data, error };
};

export const insertPayoutBatch = async (payoutData: any) => {
  const { data, error } = await supabase
    .from('payout_batches' as any)
    .insert(payoutData)
    .select();
  
  return { data, error };
};

export const getPendingPayouts = async () => {
  const { data, error } = await supabase
    .from('payout_batches' as any)
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false });
  
  return { data, error };
};
```

## 🎯 Migration from Current System

### Disable Old Payment System

Update instructor payment settings to migrate to platform system:

```sql
-- Mark all instructor accounts as migrated
UPDATE instructor_payment_settings 
SET migration_status = 'migrated', is_active = false;
```

### Update Payment Flow

Replace references to the old payment system:

```tsx
// Replace in your course pages:
// OLD: import PaymentPage from '@/components/PaymentPage';
// NEW: import PlatformPaymentPage from '@/components/PlatformPaymentPage';

// OLD: <PaymentPage course={course} ... />
// NEW: <PlatformPaymentPage course={course} ... />
```

## 📊 Verification Steps

1. **Check Database Tables**:
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name LIKE '%revenue%' OR table_name LIKE '%payout%';
   ```

2. **Verify Platform Settings**:
   ```sql
   SELECT setting_key, setting_value->'default_platform_fee_percentage' as fee_rate 
   FROM platform_settings;
   ```

3. **Test Revenue Calculation**:
   ```sql
   SELECT calculate_revenue_split(100000, null, null);
   ```

## 🚨 Important Notes

- **Type Safety**: Regenerate Supabase types before production
- **Security**: Update RLS policies if needed for your user roles  
- **Testing**: Test all payment flows in sandbox before production
- **Monitoring**: Set up monitoring for payment failures and revenue splits

The system is now ready for testing and can handle the full revenue splitting workflow as designed in your plan!
