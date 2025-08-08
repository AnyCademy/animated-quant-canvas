# 💰 Manual Split Revenue Implementation Plan
**AnyCademy Platform | Development Stage | Centralized Payment Model**

---

## 📋 Executive Summary

### Current Situation
- Platform is in **development stage** (not production)
- Currently uses **instructor-centric Midtrans accounts** (each instructor has own payment settings)
- Need to transition to **centralized platform account** with manual revenue splitting
- Perfect timing to implement changes before going live

### Proposed Solution
Implement a centralized payment system where:
- Single platform Midtrans account handles all payments
- Automatic revenue split calculation (e.g., 90% instructor, 10% platform)
- Manual payout processing to instructors
- Complete revenue tracking and analytics

---

## 🎯 Implementation Strategy

### Phase 1: Foundation Setup (Week 1-2)

#### 1.1 Database Schema Enhancement
Since we're in development, we can safely modify the database structure:

```sql
-- New tables for revenue management
CREATE TABLE revenue_splits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID REFERENCES payments(id),
  instructor_id UUID REFERENCES auth.users(id),
  course_id UUID REFERENCES courses(id),
  total_amount DECIMAL(10,2),
  platform_fee_percentage DECIMAL(5,2),
  platform_fee_amount DECIMAL(10,2),
  instructor_share DECIMAL(10,2),
  status TEXT DEFAULT 'pending', -- pending, calculated, paid_out
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE payout_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID REFERENCES auth.users(id),
  total_amount DECIMAL(10,2),
  transaction_count INTEGER,
  payout_method TEXT DEFAULT 'manual_transfer',
  status TEXT DEFAULT 'pending', -- pending, processing, completed, failed
  scheduled_date DATE,
  processed_at TIMESTAMP,
  batch_reference TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE platform_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Modify existing instructor_payment_settings table
ALTER TABLE instructor_payment_settings 
ADD COLUMN migration_status TEXT DEFAULT 'legacy';
-- legacy, migrated, disabled

-- Insert platform-wide Midtrans configuration
INSERT INTO platform_settings (setting_key, setting_value, description) VALUES 
('midtrans_config', '{
  "client_key": "SB-Mid-client-YOUR_PLATFORM_KEY",
  "server_key": "SB-Mid-server-YOUR_PLATFORM_KEY",
  "is_production": false,
  "is_active": true
}', 'Platform-wide Midtrans payment configuration'),

('revenue_split_config', '{
  "default_platform_fee_percentage": 10,
  "minimum_payout_amount": 50000,
  "payout_schedule": "monthly",
  "fee_tiers": [
    {"min_amount": 0, "max_amount": 100000, "fee_percentage": 5},
    {"min_amount": 100001, "max_amount": 500000, "fee_percentage": 10},
    {"min_amount": 500001, "max_amount": 999999999, "fee_percentage": 15}
  ]
}', 'Revenue splitting configuration and fee structure');
```

#### 1.2 Core Service Creation
Create new services to handle centralized payments and revenue splitting:

**File Structure:**
```
src/lib/
├── platformPayment.ts      # Centralized payment processing
├── revenueSplit.ts         # Revenue calculation logic
├── payoutManager.ts        # Payout batch management
└── platformSettings.ts     # Platform configuration management
```

### Phase 2: Payment Flow Transition (Week 3)

#### 2.1 Migration from Instructor-Centric to Platform-Centric

Since we're in development, we can implement this transition gradually:

##### Option A: Complete Migration (Recommended for Development)
- Disable all instructor payment settings
- Use single platform Midtrans account for all new payments
- Keep instructor settings table for future reference

##### Option B: Hybrid Approach (If needed for testing)
- Allow both systems to coexist temporarily
- Add flag to determine which payment method to use per transaction

#### 2.2 Updated Payment Processing Flow

**New Payment Flow:**
```
Student Enrolls → Payment Page → Platform Midtrans Account → 
Payment Success → Revenue Split Calculation → Instructor Earning Record → 
Course Enrollment
```

**Modified Files:**
- `src/lib/midtrans.ts` - Update to use platform settings
- `src/components/PaymentPage.tsx` - Remove instructor-specific logic
- `src/lib/midtrans-instructor.ts` - Deprecate or repurpose

### Phase 3: Revenue Management System (Week 4-5)

#### 3.1 Revenue Split Calculator

```typescript
// Example split calculation logic
interface SplitResult {
  totalAmount: number;
  platformFee: number;
  instructorShare: number;
  feePercentage: number;
}

function calculateRevenueSplit(
  coursePrice: number, 
  instructorId: string,
  customFeePercentage?: number
): SplitResult {
  // Get platform settings or use custom percentage
  const feeConfig = getPlatformFeeConfig();
  const applicableTier = feeConfig.fee_tiers.find(tier => 
    coursePrice >= tier.min_amount && coursePrice <= tier.max_amount
  );
  
  const feePercentage = customFeePercentage || applicableTier.fee_percentage;
  const platformFee = Math.round(coursePrice * feePercentage / 100);
  const instructorShare = coursePrice - platformFee;
  
  return {
    totalAmount: coursePrice,
    platformFee,
    instructorShare,
    feePercentage
  };
}
```

#### 3.2 Instructor Revenue Dashboard

Create new pages and components:
- `src/pages/InstructorEarnings.tsx` - Revenue overview for instructors
- `src/components/EarningsChart.tsx` - Visual earnings representation
- `src/components/PayoutHistory.tsx` - Track payout status

#### 3.3 Admin Payout Management

- `src/pages/AdminPayouts.tsx` - Admin interface for managing payouts
- `src/components/PayoutBatchCreator.tsx` - Create payout batches
- `src/components/PayoutApproval.tsx` - Approve/reject payouts

### Phase 4: Manual Payout System (Week 6)

#### 4.1 Payout Request Flow

**Instructor Side:**
1. View pending earnings in dashboard
2. Request payout when minimum threshold met
3. Provide/update bank account details
4. Track payout status

**Admin Side:**
1. Review payout requests
2. Create payout batches (weekly/monthly)
3. Process manual bank transfers
4. Mark payouts as completed
5. Generate payout reports

#### 4.2 Bank Account Management

```sql
-- New table for instructor bank details
CREATE TABLE instructor_bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID REFERENCES auth.users(id) UNIQUE,
  bank_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  account_holder_name TEXT NOT NULL,
  bank_code TEXT,
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🔄 Migration Strategy (Development Stage)

### Advantage of Being in Development
Since the platform isn't in production yet, we have several advantages:
- No existing instructor revenue to worry about
- Can make breaking changes safely
- No user expectations to manage
- Complete freedom to restructure

### Recommended Migration Approach

#### Step 1: Immediate Transition (Week 1)
```sql
-- Disable all instructor payment settings
UPDATE instructor_payment_settings 
SET is_active = false, 
    migration_status = 'migrated'
WHERE is_active = true;

-- This ensures no new payments use instructor accounts
```

#### Step 2: Clean Slate Implementation (Week 2-3)
- Implement centralized payment system from scratch
- Use platform Midtrans account for all transactions
- Build revenue splitting from ground up

#### Step 3: Testing Phase (Week 4-5)
- Test with sandbox transactions
- Verify revenue calculations
- Test payout workflows
- Validate all edge cases

#### Step 4: Documentation & Onboarding (Week 6)
- Create instructor onboarding materials
- Document payout processes
- Prepare support materials

---

## 💼 Business Logic Configuration

### Revenue Split Rules

#### Default Configuration
```json
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

#### Customizable Rules
- Platform fee percentage by course price tier
- Special rates for featured instructors
- Promotional rates for new instructors
- Volume-based discounts for high-earning instructors

### Payout Configuration
```json
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

---

## 🛠️ Technical Implementation Details

### File Modifications Required

#### 1. Update Payment Processing
**`src/lib/midtrans.ts`**
```typescript
// Remove instructor-specific payment settings
// Replace with platform-wide settings

export const getPlatformPaymentSettings = async () => {
  const { data } = await supabase
    .from('platform_settings')
    .select('setting_value')
    .eq('setting_key', 'midtrans_config')
    .single();
    
  return data.setting_value;
};

// Update createSnapToken to use platform settings
export const createSnapToken = async (paymentData, courseId, instructorId) => {
  const platformSettings = await getPlatformPaymentSettings();
  
  // Create payment with platform account
  const token = await callMidtransAPI(paymentData, platformSettings);
  
  // Calculate and store revenue split
  await calculateAndStoreRevenueSplit(paymentData, courseId, instructorId);
  
  return token;
};
```

#### 2. Update Payment Success Handler
**`src/lib/midtrans.ts`** - `updatePaymentStatus` function
```typescript
// After successful payment
if (status === 'paid') {
  // Existing enrollment logic...
  
  // NEW: Process revenue split
  await processRevenueSplit(orderId);
}

async function processRevenueSplit(orderId: string) {
  const paymentData = await getPaymentData(orderId);
  const splitResult = calculateRevenueSplit(
    paymentData.amount, 
    paymentData.instructor_id
  );
  
  await supabase.from('revenue_splits').insert({
    payment_id: paymentData.id,
    instructor_id: paymentData.instructor_id,
    course_id: paymentData.course_id,
    total_amount: splitResult.totalAmount,
    platform_fee_percentage: splitResult.feePercentage,
    platform_fee_amount: splitResult.platformFee,
    instructor_share: splitResult.instructorShare,
    status: 'calculated'
  });
}
```

#### 3. New Components to Create

**`src/pages/InstructorEarnings.tsx`**
- Revenue overview dashboard
- Earnings charts and analytics
- Payout request interface
- Transaction history

**`src/pages/AdminPayouts.tsx`**
- Pending payout requests
- Batch payout creation
- Payout approval workflow
- Financial reporting

**`src/components/PayoutRequestForm.tsx`**
- Bank account information form
- Payout amount selection
- Request submission

---

## 📊 User Experience Flow

### Instructor Experience

#### 1. Earnings Dashboard
```
Dashboard → Earnings Tab → 
├── Total Earnings: IDR 2,500,000
├── Pending Payouts: IDR 450,000
├── This Month: IDR 650,000
└── Payout History: [List of previous payouts]
```

#### 2. Payout Request
```
Earnings → Request Payout → 
├── Available Amount: IDR 450,000
├── Bank Account: [Saved/New]
├── Request Amount: [Input]
└── Submit Request
```

#### 3. Transaction Details
```
Each Course Sale Shows:
├── Course: "Advanced React"
├── Sale Price: IDR 500,000
├── Platform Fee (10%): IDR 50,000
├── Your Share: IDR 450,000
└── Status: Paid to You / Pending
```

### Admin Experience

#### 1. Payout Management Dashboard
```
Admin → Payouts → 
├── Pending Requests: 15 instructors
├── Total Amount: IDR 12,500,000
├── Create Batch Payout
└── Payout History
```

#### 2. Revenue Analytics
```
Admin → Analytics → 
├── Total Platform Revenue: IDR 1,250,000
├── Total Instructor Payments: IDR 11,250,000
├── Monthly Growth: +25%
└── Top Earning Instructors
```

---

## 🔒 Security & Compliance

### Financial Security
- **Dual Authorization**: Admin approval required for payouts > IDR 1,000,000
- **Audit Trail**: Complete logging of all financial transactions
- **Bank Verification**: Validate instructor bank details before first payout
- **Fraud Detection**: Monitor unusual patterns in earnings

### Data Protection
- **Encryption**: All financial data encrypted at rest
- **Access Control**: Role-based permissions for financial information
- **Audit Logs**: Track all access to financial data
- **Backup**: Regular backups of financial records

### Compliance Considerations
- **Tax Reporting**: Generate tax documents for instructors
- **Record Keeping**: Maintain detailed transaction records
- **Regulatory Compliance**: Follow Indonesian financial regulations
- **Data Retention**: Appropriate data retention policies

---

## 📅 Implementation Timeline

### Week 1-2: Foundation
- [ ] Database schema creation
- [ ] Platform settings configuration
- [ ] Core service development
- [ ] Basic revenue split calculator

### Week 3: Payment System Migration
- [ ] Disable instructor payment settings
- [ ] Implement centralized payment processing
- [ ] Update payment flow logic
- [ ] Testing with sandbox transactions

### Week 4-5: User Interface Development
- [ ] Instructor earnings dashboard
- [ ] Admin payout management interface
- [ ] Payout request forms
- [ ] Revenue analytics charts

### Week 6: Testing & Documentation
- [ ] End-to-end testing
- [ ] Security testing
- [ ] Documentation creation
- [ ] Instructor onboarding materials

### Week 7: Deployment Preparation
- [ ] Production environment setup
- [ ] Final testing
- [ ] Staff training
- [ ] Go-live preparation

---

## 🎯 Success Metrics

### Financial Metrics
- **Revenue Split Accuracy**: 100% accurate calculations
- **Payout Processing Time**: < 5 business days
- **Financial Reconciliation**: Daily balance matching
- **Platform Revenue Growth**: Month-over-month tracking

### User Experience Metrics
- **Instructor Satisfaction**: Survey scores > 4.5/5
- **Payout Request Success Rate**: > 99%
- **Dashboard Usage**: Regular engagement with earnings interface
- **Support Ticket Reduction**: Fewer payment-related issues

### Technical Metrics
- **System Uptime**: > 99.9%
- **Payment Processing Success**: > 98%
- **Data Integrity**: Zero discrepancies in financial records
- **Performance**: Dashboard load times < 2 seconds

---

## 🚀 Post-Implementation Roadmap

### Phase 2 Enhancements (Month 2-3)
- **Automated Payouts**: Integration with banking APIs
- **Advanced Analytics**: Detailed financial reporting
- **Instructor Tools**: Revenue optimization suggestions
- **Tax Integration**: Automatic tax document generation

### Phase 3 Advanced Features (Month 4-6)
- **Real-time Payouts**: Instant payout options
- **Multi-currency Support**: International instructor support
- **Revenue Sharing**: Collaborative course revenue splits
- **Financial Planning**: Earnings forecasting tools

---

## 📝 Conclusion

This manual split revenue implementation plan provides a comprehensive roadmap for transitioning from the current instructor-centric payment model to a centralized platform-managed system. The timing is perfect since the platform is still in development, allowing for clean implementation without disrupting existing users.

The approach prioritizes:
- **Simplicity**: Easy-to-understand revenue sharing
- **Transparency**: Clear earnings tracking for instructors  
- **Scalability**: System that grows with the platform
- **Security**: Robust financial controls and audit trails
- **User Experience**: Intuitive interfaces for all stakeholders

By following this plan, AnyCademy will have a professional, scalable revenue management system ready for launch and future growth.
