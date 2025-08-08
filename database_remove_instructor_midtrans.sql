-- Complete Instructor Midtrans Removal - Database Migration
-- Run this in your Supabase SQL editor

-- Step 1: Disable all existing instructor payment settings
UPDATE instructor_payment_settings 
SET is_active = false,
    migration_status = 'deprecated',
    updated_at = NOW()
WHERE is_active = true;

-- Step 2: Remove sensitive credential data for security
UPDATE instructor_payment_settings 
SET midtrans_client_key = 'REMOVED_BY_PLATFORM',
    midtrans_server_key = 'REMOVED_BY_PLATFORM'
WHERE migration_status = 'deprecated';

-- Step 3: Add deprecation notice column if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'instructor_payment_settings' 
                   AND column_name = 'deprecation_notice') THEN
        ALTER TABLE instructor_payment_settings 
        ADD COLUMN deprecation_notice TEXT DEFAULT 'This table is deprecated. Platform now uses centralized payment processing.';
    END IF;
END $$;

-- Step 4: Ensure platform disbursement settings exist
INSERT INTO platform_settings (setting_key, setting_value, description) VALUES 
('midtrans_disbursement', '{
  "enabled": true,
  "api_url": "https://api.midtrans.com/v1/payouts",
  "minimum_amount": 50000,
  "maximum_amount": 50000000,
  "fee_per_transaction": 2500,
  "supported_banks": ["bca", "mandiri", "bni", "bri", "cimb", "permata", "danamon", "maybank"]
}', 'Midtrans disbursement API configuration for instructor payouts')
ON CONFLICT (setting_key) DO UPDATE SET 
setting_value = EXCLUDED.setting_value,
updated_at = NOW();

-- Step 5: Update platform Midtrans config to enable disbursement
UPDATE platform_settings 
SET setting_value = setting_value || '{"disbursement_enabled": true}'::jsonb,
    updated_at = NOW()
WHERE setting_key = 'midtrans_config';

-- Step 6: Create RLS policy to prevent instructor access to deprecated settings
DROP POLICY IF EXISTS "Instructors can manage their own payment settings" ON instructor_payment_settings;

CREATE POLICY "No access to deprecated instructor payment settings" 
  ON instructor_payment_settings 
  FOR ALL 
  USING (false);

-- Step 7: Log the migration
INSERT INTO platform_settings (setting_key, setting_value, description) VALUES 
('instructor_midtrans_migration', '{
  "migrated_at": "' || NOW()::text || '",
  "migrated_by": "system",
  "status": "completed",
  "accounts_disabled": ' || (SELECT count(*) FROM instructor_payment_settings WHERE migration_status = 'deprecated')::text || '
}', 'Instructor Midtrans removal migration log')
ON CONFLICT (setting_key) DO UPDATE SET 
setting_value = EXCLUDED.setting_value,
updated_at = NOW();
