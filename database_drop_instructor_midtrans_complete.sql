-- COMPLETE DESTRUCTION of Instructor Midtrans System
-- WARNING: This will permanently delete ALL instructor payment data
-- Run this in your Supabase SQL editor ONLY if you're certain you want to remove everything

-- =============================================
-- STEP 1: Remove all RLS policies
-- =============================================

-- Drop all instructor payment settings policies
DROP POLICY IF EXISTS "Instructors can view their own payment settings" ON instructor_payment_settings;
DROP POLICY IF EXISTS "Instructors can insert their own payment settings" ON instructor_payment_settings;
DROP POLICY IF EXISTS "Instructors can update their own payment settings" ON instructor_payment_settings;
DROP POLICY IF EXISTS "Instructors can delete their own payment settings" ON instructor_payment_settings;
DROP POLICY IF EXISTS "Instructors can manage their own payment settings" ON instructor_payment_settings;
DROP POLICY IF EXISTS "Anyone can view active payment settings for payment processing" ON instructor_payment_settings;
DROP POLICY IF EXISTS "No access to deprecated instructor payment settings" ON instructor_payment_settings;

-- =============================================
-- STEP 2: Remove all triggers and functions
-- =============================================

-- Drop trigger first
DROP TRIGGER IF EXISTS trigger_update_instructor_payment_settings_updated_at ON instructor_payment_settings;

-- Drop the function
DROP FUNCTION IF EXISTS update_instructor_payment_settings_updated_at();

-- =============================================
-- STEP 3: Remove foreign key constraints and references
-- =============================================

-- Note: Since instructor_payment_settings references auth.users(id), 
-- we need to drop the table to remove this foreign key relationship

-- =============================================
-- STEP 4: Drop the main table completely
-- =============================================

-- This will remove all data, constraints, indexes, and the table structure
DROP TABLE IF EXISTS instructor_payment_settings CASCADE;

-- =============================================
-- STEP 5: Clean up platform settings related to instructor midtrans
-- =============================================

-- Remove instructor midtrans migration log
DELETE FROM platform_settings WHERE setting_key = 'instructor_midtrans_migration';

-- Remove any instructor-specific midtrans disbursement settings
DELETE FROM platform_settings WHERE setting_key LIKE '%instructor%midtrans%';
DELETE FROM platform_settings WHERE setting_key LIKE '%midtrans%instructor%';

-- =============================================
-- STEP 6: Clean up any orphaned data
-- =============================================

-- If there are any payments that reference instructor-specific midtrans data,
-- you might want to update them to use platform payment system
-- (Uncomment and modify as needed based on your payment table structure)

-- UPDATE payments 
-- SET payment_processor = 'platform_midtrans' 
-- WHERE payment_processor = 'instructor_midtrans';

-- =============================================
-- STEP 7: Verification queries
-- =============================================

-- Verify the table is completely gone
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'instructor_payment_settings'
    ) THEN
        RAISE NOTICE 'SUCCESS: instructor_payment_settings table has been completely removed';
    ELSE
        RAISE NOTICE 'WARNING: instructor_payment_settings table still exists';
    END IF;
END $$;

-- Verify no related functions exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.routines 
        WHERE routine_name = 'update_instructor_payment_settings_updated_at'
    ) THEN
        RAISE NOTICE 'SUCCESS: All instructor payment settings functions have been removed';
    ELSE
        RAISE NOTICE 'WARNING: Some instructor payment settings functions still exist';
    END IF;
END $$;

-- Verify no related policies exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'instructor_payment_settings'
    ) THEN
        RAISE NOTICE 'SUCCESS: All instructor payment settings policies have been removed';
    ELSE
        RAISE NOTICE 'WARNING: Some instructor payment settings policies still exist';
    END IF;
END $$;

-- =============================================
-- STEP 8: Log the complete removal
-- =============================================

INSERT INTO platform_settings (setting_key, setting_value, description) VALUES 
('instructor_midtrans_complete_removal', '{
  "removed_at": "' || NOW()::text || '",
  "removed_by": "system_admin",
  "status": "completely_destroyed",
  "components_removed": [
    "instructor_payment_settings_table",
    "all_rls_policies", 
    "update_function",
    "update_trigger",
    "foreign_key_constraints",
    "platform_settings_references"
  ],
  "warning": "All instructor payment data permanently deleted"
}', 'Complete instructor Midtrans system removal log')
ON CONFLICT (setting_key) DO UPDATE SET 
setting_value = EXCLUDED.setting_value,
updated_at = NOW();

-- =============================================
-- OPTIONAL: Clean up related application code references
-- =============================================

-- After running this script, you should also:
-- 1. Remove all TypeScript/JavaScript code that references instructor_payment_settings
-- 2. Remove the InstructorPaymentSettings.tsx component
-- 3. Remove midtrans-instructor.ts library file
-- 4. Update navigation to remove payment settings for instructors
-- 5. Remove any API endpoints that handle instructor payment settings
-- 6. Update your Supabase types file: npx supabase gen types typescript

RAISE NOTICE '🚨 COMPLETE REMOVAL FINISHED 🚨';
RAISE NOTICE 'The instructor Midtrans system has been completely destroyed.';
RAISE NOTICE 'Next steps:';
RAISE NOTICE '1. Remove related frontend components and code';
RAISE NOTICE '2. Update Supabase types: npx supabase gen types typescript';
RAISE NOTICE '3. Test that platform payment system works correctly';
RAISE NOTICE '4. Update documentation to reflect centralized payment model';
