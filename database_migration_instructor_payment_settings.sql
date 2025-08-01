-- SQL script to add instructor payment settings table
-- Run this in your Supabase SQL editor

CREATE TABLE IF NOT EXISTS instructor_payment_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  instructor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  midtrans_client_key TEXT,
  midtrans_server_key TEXT,
  is_production BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(instructor_id)
);

-- Enable RLS (Row Level Security)
ALTER TABLE instructor_payment_settings ENABLE ROW LEVEL SECURITY;

-- Create policy to allow instructors to manage their own payment settings
CREATE POLICY "Instructors can view their own payment settings" 
  ON instructor_payment_settings FOR SELECT 
  USING (auth.uid() = instructor_id);

CREATE POLICY "Instructors can insert their own payment settings" 
  ON instructor_payment_settings FOR INSERT 
  WITH CHECK (auth.uid() = instructor_id);

CREATE POLICY "Instructors can update their own payment settings" 
  ON instructor_payment_settings FOR UPDATE 
  USING (auth.uid() = instructor_id);

CREATE POLICY "Instructors can delete their own payment settings" 
  ON instructor_payment_settings FOR DELETE 
  USING (auth.uid() = instructor_id);

-- Create function to update the updated_at column
CREATE OR REPLACE FUNCTION update_instructor_payment_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER trigger_update_instructor_payment_settings_updated_at
  BEFORE UPDATE ON instructor_payment_settings
  FOR EACH ROW EXECUTE FUNCTION update_instructor_payment_settings_updated_at();
