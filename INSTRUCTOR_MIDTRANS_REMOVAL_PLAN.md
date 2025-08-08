# 🚫 Complete Instructor Midtrans Removal Plan
**Transition to Platform-Only Payment Processing with Disbursement Payouts**

---

## 📋 Executive Summary

### Current State
- Instructors have individual Midtrans accounts and API credentials
- Each instructor manages their own payment settings
- Payments flow directly to instructor accounts
- Platform tracks but doesn't process payments

### Target State
- **Single platform Midtrans account** handles all payments
- **Zero instructor Midtrans access** - complete removal
- **Platform-only disbursement API** for instructor payouts
- **Centralized revenue management** with automatic splitting

---

## 🗑️ Complete Removal Steps

### Phase 1: Database Cleanup

#### 1.1 Deprecate Instructor Payment Settings
```sql
-- Step 1: Mark all existing instructor settings as deprecated
UPDATE instructor_payment_settings 
SET migration_status = 'deprecated',
    is_active = false,
    updated_at = NOW()
WHERE migration_status != 'deprecated';

-- Step 2: Remove sensitive credential data
UPDATE instructor_payment_settings 
SET midtrans_client_key = 'REMOVED',
    midtrans_server_key = 'REMOVED'
WHERE migration_status = 'deprecated';

-- Step 3: Add deprecation notice
ALTER TABLE instructor_payment_settings 
ADD COLUMN deprecation_notice TEXT DEFAULT 'This table is deprecated. Platform now uses centralized payment processing.';
```

#### 1.2 Setup Platform-Only Configuration
```sql
-- Ensure platform settings exist for centralized payment
INSERT INTO platform_settings (setting_key, setting_value, description) VALUES 
('midtrans_config', '{
  "client_key": "YOUR_PLATFORM_CLIENT_KEY",
  "server_key": "YOUR_PLATFORM_SERVER_KEY", 
  "is_production": false,
  "is_active": true,
  "disbursement_enabled": true
}', 'Platform-only Midtrans configuration with disbursement'),

('disbursement_config', '{
  "bank_transfer_enabled": true,
  "minimum_payout": 50000,
  "maximum_payout": 50000000,
  "processing_fee": 2500,
  "supported_banks": ["bca", "mandiri", "bni", "bri", "cimb", "permata"]
}', 'Midtrans disbursement configuration for instructor payouts');
```

### Phase 2: Code Removal

#### 2.1 Remove Instructor Payment Settings Page
```bash
# Delete the entire instructor payment settings page
rm src/pages/InstructorPaymentSettings.tsx
```

#### 2.2 Remove Instructor-Specific Midtrans Libraries
```bash
# Delete instructor-specific Midtrans integration
rm src/lib/midtrans-instructor.ts
# Keep only platform midtrans for reference, but we'll modify it
```

#### 2.3 Update Navigation
Remove all references to instructor payment settings from:
- Navigation menus
- Dashboard links  
- Route configurations

### Phase 3: Service Layer Updates

#### 3.1 Create Platform-Only Payment Service
```typescript
// src/lib/platformPayment.ts
export interface PlatformMidtransConfig {
  client_key: string;
  server_key: string;
  is_production: boolean;
  is_active: boolean;
  disbursement_enabled: boolean;
}

// Only platform can access Midtrans
export const getPlatformMidtransConfig = async (): Promise<PlatformMidtransConfig | null> => {
  const { data } = await supabase
    .from('platform_settings')
    .select('setting_value')
    .eq('setting_key', 'midtrans_config')
    .single();
    
  return data?.setting_value || null;
};
```

#### 3.2 Create Disbursement Service
```typescript
// src/lib/disbursementService.ts
export interface DisbursementRequest {
  instructor_id: string;
  amount: number;
  bank_account: {
    bank: string;
    account_number: string;
    account_holder_name: string;
  };
  description: string;
}

export const processDisbursement = async (request: DisbursementRequest) => {
  const config = await getPlatformMidtransConfig();
  
  const disbursementPayload = {
    payouts: [{
      beneficiary_name: request.bank_account.account_holder_name,
      beneficiary_account: request.bank_account.account_number,
      beneficiary_bank: request.bank_account.bank,
      amount: request.amount,
      notes: request.description
    }]
  };

  // Use platform Midtrans disbursement API
  const response = await fetch('https://api.midtrans.com/v1/payouts', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Basic ${btoa(config.server_key + ':')}`
    },
    body: JSON.stringify(disbursementPayload)
  });
  
  return await response.json();
};
```

### Phase 4: UI Component Removal & Updates

#### 4.1 Remove Instructor Payment Settings UI
- Delete `InstructorPaymentSettings.tsx` completely
- Remove navigation links to payment settings
- Update dashboard to remove payment configuration options

#### 4.2 Update Payment Pages
Replace instructor-specific payment with platform-only:

```typescript
// src/components/PlatformPaymentPage.tsx (already created)
// This uses only platform Midtrans credentials
// No instructor-specific configuration needed
```

#### 4.3 Create Bank Account Management
```typescript
// src/components/InstructorBankAccount.tsx (already created)
// This replaces Midtrans settings with simple bank account info
// Used only for disbursement purposes
```

### Phase 5: Route and Navigation Cleanup

#### 5.1 Remove Routes
```typescript
// In App.tsx, remove:
// <Route path="/instructor/payment-settings" element={<InstructorPaymentSettings />} />

// Replace with bank account management:
// <Route path="/instructor/bank-account" element={<BankAccountManagement />} />
```

#### 5.2 Update Navigation
```typescript
// In Navbar.tsx, remove any payment settings links
// Replace with bank account or earnings links
```

---

## 🔧 Implementation Commands

### Step 1: Remove Files
```bash
# Remove instructor-specific payment files
rm src/pages/InstructorPaymentSettings.tsx
rm src/lib/midtrans-instructor.ts

# Remove documentation about instructor Midtrans
rm MIDTRANS_SETUP.md
rm PAYMENT_TROUBLESHOOTING.md
```

### Step 2: Database Migration
```sql
-- Run in Supabase SQL Editor
-- Disable all instructor payment settings
UPDATE instructor_payment_settings 
SET is_active = false, 
    migration_status = 'deprecated',
    midtrans_client_key = 'REMOVED_BY_PLATFORM',
    midtrans_server_key = 'REMOVED_BY_PLATFORM'
WHERE is_active = true;

-- Ensure platform settings exist
INSERT INTO platform_settings (setting_key, setting_value, description) VALUES 
('midtrans_disbursement', '{
  "enabled": true,
  "api_url": "https://api.midtrans.com/v1/payouts",
  "minimum_amount": 50000,
  "maximum_amount": 50000000,
  "fee_per_transaction": 2500
}', 'Midtrans disbursement API configuration')
ON CONFLICT (setting_key) DO UPDATE SET 
setting_value = EXCLUDED.setting_value,
updated_at = NOW();
```

### Step 3: Update Code
```bash
# Update routes to remove instructor payment settings
# Update navigation to remove payment settings links
# Ensure all payment processing uses platform credentials only
```

---

## 🚨 Important Notes

### 1. **Complete Instructor Isolation**
- Instructors will have **ZERO access** to Midtrans APIs
- No payment configuration options in instructor interface
- All payment processing handled by platform

### 2. **Disbursement-Only Payouts**
- Platform uses Midtrans Disbursement API for instructor payouts
- Instructors only provide bank account details
- Platform controls all payout timing and processing

### 3. **Revenue Control**
- Platform determines fee percentages
- Platform controls payout schedules
- Platform handles all financial reconciliation

### 4. **Security Benefits**
- Single point of Midtrans credential management
- No exposure of sensitive keys to instructors
- Centralized payment security monitoring

---

## ✅ Verification Checklist

After implementation, verify:

- [ ] No instructor can access Midtrans settings
- [ ] All payments use platform Midtrans account
- [ ] Instructor payment settings page is completely removed
- [ ] Navigation has no payment configuration links
- [ ] Only bank account management is available to instructors
- [ ] Disbursement API is working for payouts
- [ ] Revenue splitting is automatic and platform-controlled
- [ ] No instructor-specific Midtrans code remains

---

## 🎯 Result

**Complete instructor Midtrans removal achieved:**
- ✅ Zero instructor payment configuration
- ✅ Platform-only Midtrans processing  
- ✅ Disbursement-based instructor payouts
- ✅ Centralized revenue management
- ✅ Enhanced security and control
