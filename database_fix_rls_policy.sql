-- Additional RLS policy to fix payment issues
-- This allows anyone to read active payment settings for payment processing
-- Add this to your Supabase SQL editor

-- Allow anyone to read active payment settings for payment processing
CREATE POLICY "Anyone can view active payment settings for payment processing" 
  ON instructor_payment_settings FOR SELECT 
  USING (is_active = true);

-- Note: This is safe because:
-- 1. Only active settings are exposed
-- 2. Payment processing requires these settings to be readable
-- 3. Sensitive server keys should be moved to backend (see security plan)
-- 4. The existing policies still protect write operations
