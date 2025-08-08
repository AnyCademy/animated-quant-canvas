-- SQL script to implement manual split revenue system
-- Run this in your Supabase SQL editor after the instructor_payment_settings migration

-- =============================================
-- PHASE 1: Core Revenue Management Tables
-- =============================================

-- Table for tracking revenue splits per payment
CREATE TABLE IF NOT EXISTS revenue_splits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID REFERENCES payments(id) ON DELETE CASCADE,
  instructor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  total_amount DECIMAL(10,2) NOT NULL,
  platform_fee_percentage DECIMAL(5,2) NOT NULL,
  platform_fee_amount DECIMAL(10,2) NOT NULL,
  instructor_share DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'calculated', 'paid_out')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table for managing payout batches
CREATE TABLE IF NOT EXISTS payout_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  total_amount DECIMAL(10,2) NOT NULL,
  transaction_count INTEGER NOT NULL DEFAULT 0,
  payout_method TEXT DEFAULT 'manual_transfer' CHECK (payout_method IN ('manual_transfer', 'bank_api', 'digital_wallet')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  scheduled_date DATE,
  processed_at TIMESTAMP WITH TIME ZONE,
  batch_reference TEXT,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table for platform-wide settings
CREATE TABLE IF NOT EXISTS platform_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table for instructor bank account details
CREATE TABLE IF NOT EXISTS instructor_bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  bank_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  account_holder_name TEXT NOT NULL,
  bank_code TEXT,
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table for tracking payout batch items
CREATE TABLE IF NOT EXISTS payout_batch_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID REFERENCES payout_batches(id) ON DELETE CASCADE,
  revenue_split_id UUID REFERENCES revenue_splits(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =============================================
-- PHASE 2: Update existing tables
-- =============================================

-- Add migration status to instructor_payment_settings
ALTER TABLE instructor_payment_settings 
ADD COLUMN IF NOT EXISTS migration_status TEXT DEFAULT 'legacy' CHECK (migration_status IN ('legacy', 'migrated', 'disabled'));

-- =============================================
-- PHASE 3: Insert default platform settings
-- =============================================

-- Platform-wide Midtrans configuration
INSERT INTO platform_settings (setting_key, setting_value, description) VALUES 
('midtrans_config', '{
  "client_key": "SB-Mid-client-PLATFORM-KEY",
  "server_key": "SB-Mid-server-PLATFORM-KEY", 
  "is_production": false,
  "is_active": true
}', 'Platform-wide Midtrans payment configuration')
ON CONFLICT (setting_key) DO UPDATE SET 
  setting_value = EXCLUDED.setting_value,
  updated_at = timezone(''utc''::text, now());

-- Revenue split configuration
INSERT INTO platform_settings (setting_key, setting_value, description) VALUES 
('revenue_split_config', '{
  "default_platform_fee_percentage": 10,
  "minimum_payout_amount": 50000,
  "payout_schedule": "monthly",
  "fee_tiers": [
    {"min_amount": 0, "max_amount": 100000, "fee_percentage": 5, "description": "Budget courses"},
    {"min_amount": 100001, "max_amount": 500000, "fee_percentage": 10, "description": "Standard courses"},
    {"min_amount": 500001, "max_amount": 999999999, "fee_percentage": 15, "description": "Premium courses"}
  ],
  "special_instructor_rates": {
    "featured_instructors": 5,
    "new_instructors": 8,
    "top_performers": 7
  }
}', 'Revenue splitting configuration and fee structure')
ON CONFLICT (setting_key) DO UPDATE SET 
  setting_value = EXCLUDED.setting_value,
  updated_at = timezone(''utc''::text, now());

-- Payout configuration
INSERT INTO platform_settings (setting_key, setting_value, description) VALUES 
('payout_config', '{
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
}', 'Payout methods and configuration')
ON CONFLICT (setting_key) DO UPDATE SET 
  setting_value = EXCLUDED.setting_value,
  updated_at = timezone(''utc''::text, now());

-- =============================================
-- PHASE 4: Enable Row Level Security
-- =============================================

-- Revenue splits RLS
ALTER TABLE revenue_splits ENABLE ROW LEVEL SECURITY;

-- Instructors can view their own revenue splits
CREATE POLICY "Instructors can view their own revenue splits" 
  ON revenue_splits FOR SELECT 
  USING (auth.uid() = instructor_id);

-- Only authenticated users can view (admins handle via service role)
CREATE POLICY "Authenticated users can view revenue splits" 
  ON revenue_splits FOR SELECT 
  USING (auth.role() = 'authenticated');

-- Payout batches RLS
ALTER TABLE payout_batches ENABLE ROW LEVEL SECURITY;

-- Instructors can view their own payout batches
CREATE POLICY "Instructors can view their own payout batches" 
  ON payout_batches FOR SELECT 
  USING (auth.uid() = instructor_id);

-- Bank accounts RLS
ALTER TABLE instructor_bank_accounts ENABLE ROW LEVEL SECURITY;

-- Instructors can manage their own bank accounts
CREATE POLICY "Instructors can view their own bank accounts" 
  ON instructor_bank_accounts FOR SELECT 
  USING (auth.uid() = instructor_id);

CREATE POLICY "Instructors can insert their own bank accounts" 
  ON instructor_bank_accounts FOR INSERT 
  WITH CHECK (auth.uid() = instructor_id);

CREATE POLICY "Instructors can update their own bank accounts" 
  ON instructor_bank_accounts FOR UPDATE 
  USING (auth.uid() = instructor_id);

-- Platform settings RLS
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

-- Only service role can modify platform settings
-- Read access for authenticated users (for revenue calculations)
CREATE POLICY "Authenticated users can read platform settings" 
  ON platform_settings FOR SELECT 
  USING (auth.role() = 'authenticated');

-- Payout batch items RLS
ALTER TABLE payout_batch_items ENABLE ROW LEVEL SECURITY;

-- View access through batch relationship
CREATE POLICY "Users can view payout batch items through batch" 
  ON payout_batch_items FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM payout_batches pb 
      WHERE pb.id = payout_batch_items.batch_id 
      AND pb.instructor_id = auth.uid()
    )
  );

-- =============================================
-- PHASE 5: Create update triggers
-- =============================================

-- Function to update updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER trigger_revenue_splits_updated_at
  BEFORE UPDATE ON revenue_splits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_instructor_bank_accounts_updated_at
  BEFORE UPDATE ON instructor_bank_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_platform_settings_updated_at
  BEFORE UPDATE ON platform_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- PHASE 6: Create indexes for performance
-- =============================================

-- Revenue splits indexes
CREATE INDEX IF NOT EXISTS idx_revenue_splits_instructor_id ON revenue_splits(instructor_id);
CREATE INDEX IF NOT EXISTS idx_revenue_splits_payment_id ON revenue_splits(payment_id);
CREATE INDEX IF NOT EXISTS idx_revenue_splits_status ON revenue_splits(status);
CREATE INDEX IF NOT EXISTS idx_revenue_splits_created_at ON revenue_splits(created_at);

-- Payout batches indexes
CREATE INDEX IF NOT EXISTS idx_payout_batches_instructor_id ON payout_batches(instructor_id);
CREATE INDEX IF NOT EXISTS idx_payout_batches_status ON payout_batches(status);
CREATE INDEX IF NOT EXISTS idx_payout_batches_scheduled_date ON payout_batches(scheduled_date);

-- Platform settings indexes
CREATE INDEX IF NOT EXISTS idx_platform_settings_key ON platform_settings(setting_key);

-- =============================================
-- PHASE 7: Create helper functions
-- =============================================

-- Function to calculate revenue split
CREATE OR REPLACE FUNCTION calculate_revenue_split(
  course_price DECIMAL(10,2),
  instructor_id UUID DEFAULT NULL,
  custom_fee_percentage DECIMAL(5,2) DEFAULT NULL
)
RETURNS TABLE(
  total_amount DECIMAL(10,2),
  platform_fee_amount DECIMAL(10,2),
  instructor_share DECIMAL(10,2),
  fee_percentage DECIMAL(5,2)
) AS $$
DECLARE
  split_config JSONB;
  applicable_tier JSONB;
  calculated_fee_percentage DECIMAL(5,2);
  calculated_platform_fee DECIMAL(10,2);
  calculated_instructor_share DECIMAL(10,2);
BEGIN
  -- Get revenue split configuration
  SELECT setting_value INTO split_config
  FROM platform_settings 
  WHERE setting_key = 'revenue_split_config';
  
  -- Use custom percentage if provided, otherwise find applicable tier
  IF custom_fee_percentage IS NOT NULL THEN
    calculated_fee_percentage := custom_fee_percentage;
  ELSE
    -- Find applicable fee tier
    SELECT tier INTO applicable_tier
    FROM jsonb_array_elements(split_config->'fee_tiers') AS tier
    WHERE (tier->>'min_amount')::DECIMAL <= course_price 
      AND (tier->>'max_amount')::DECIMAL >= course_price
    LIMIT 1;
    
    IF applicable_tier IS NULL THEN
      -- Fallback to default percentage
      calculated_fee_percentage := (split_config->>'default_platform_fee_percentage')::DECIMAL;
    ELSE
      calculated_fee_percentage := (applicable_tier->>'fee_percentage')::DECIMAL;
    END IF;
  END IF;
  
  -- Calculate amounts
  calculated_platform_fee := ROUND(course_price * calculated_fee_percentage / 100, 2);
  calculated_instructor_share := course_price - calculated_platform_fee;
  
  -- Return results
  RETURN QUERY SELECT 
    course_price,
    calculated_platform_fee,
    calculated_instructor_share,
    calculated_fee_percentage;
END;
$$ LANGUAGE plpgsql;

-- Function to get instructor pending earnings
CREATE OR REPLACE FUNCTION get_instructor_pending_earnings(instructor_uuid UUID)
RETURNS DECIMAL(10,2) AS $$
DECLARE
  pending_amount DECIMAL(10,2) := 0;
BEGIN
  SELECT COALESCE(SUM(instructor_share), 0) INTO pending_amount
  FROM revenue_splits
  WHERE instructor_id = instructor_uuid 
    AND status IN ('calculated', 'pending');
    
  RETURN pending_amount;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- PHASE 8: Migration of existing data
-- =============================================

-- Disable all instructor payment settings (development environment)
UPDATE instructor_payment_settings 
SET is_active = false, 
    migration_status = 'migrated'
WHERE is_active = true;

-- Add comment for completion
COMMENT ON TABLE revenue_splits IS 'Tracks revenue splits for each payment transaction';
COMMENT ON TABLE payout_batches IS 'Manages batched payouts to instructors';
COMMENT ON TABLE platform_settings IS 'Stores platform-wide configuration settings';
COMMENT ON TABLE instructor_bank_accounts IS 'Stores bank account details for instructor payouts';
COMMENT ON TABLE payout_batch_items IS 'Individual items within payout batches';
