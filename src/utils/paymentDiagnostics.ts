import { supabase } from '@/integrations/supabase/client';

export interface PaymentDiagnosticResult {
  hasPaymentSettings: boolean;
  isActive: boolean;
  hasClientKey: boolean;
  hasServerKey: boolean;
  isProduction: boolean;
  keyFormatValid: boolean;
  environment: 'sandbox' | 'production';
  rlsPermissionIssue: boolean;
  issues: string[];
}

export const diagnosePaymentIssues = async (instructorId: string): Promise<PaymentDiagnosticResult> => {
  const result: PaymentDiagnosticResult = {
    hasPaymentSettings: false,
    isActive: false,
    hasClientKey: false,
    hasServerKey: false,
    isProduction: false,
    keyFormatValid: false,
    environment: 'sandbox',
    rlsPermissionIssue: false,
    issues: []
  };

  try {
    // Check if payment settings exist
    const { data: settings, error } = await supabase
      .from('instructor_payment_settings' as any)
      .select('*')
      .eq('instructor_id', instructorId)
      .single();

    if (error || !settings) {
      if (error?.code === 'PGRST301' || error?.message?.includes('permission')) {
        result.rlsPermissionIssue = true;
        result.issues.push('RLS Permission Issue: Students cannot access instructor payment settings. Run the database_fix_rls_policy.sql script.');
      } else {
        result.issues.push('No payment settings found. Instructor needs to configure Midtrans credentials.');
      }
      return result;
    }

    result.hasPaymentSettings = true;
    
    // Check if active
    result.isActive = (settings as any).is_active || false;
    if (!result.isActive) {
      result.issues.push('Payment gateway is not activated. Instructor needs to toggle "Activate Payment Gateway" to ON.');
    }

    // Check credentials
    const clientKey = (settings as any).midtrans_client_key || '';
    const serverKey = (settings as any).midtrans_server_key || '';
    result.isProduction = (settings as any).is_production || false;
    result.environment = result.isProduction ? 'production' : 'sandbox';

    result.hasClientKey = !!clientKey;
    result.hasServerKey = !!serverKey;

    if (!result.hasClientKey) {
      result.issues.push('Missing Midtrans Client Key.');
    }

    if (!result.hasServerKey) {
      result.issues.push('Missing Midtrans Server Key.');
    }

    // Check key format
    if (result.hasClientKey && result.hasServerKey) {
      const expectedClientPrefix = result.isProduction ? 'Mid-client-' : 'SB-Mid-client-';
      const expectedServerPrefix = result.isProduction ? 'Mid-server-' : 'SB-Mid-server-';

      const clientKeyValid = clientKey.startsWith(expectedClientPrefix);
      const serverKeyValid = serverKey.startsWith(expectedServerPrefix);

      result.keyFormatValid = clientKeyValid && serverKeyValid;

      if (!clientKeyValid) {
        result.issues.push(`Client key format invalid. Should start with "${expectedClientPrefix}"`);
      }

      if (!serverKeyValid) {
        result.issues.push(`Server key format invalid. Should start with "${expectedServerPrefix}"`);
      }
    }

    // Final assessment
    if (result.issues.length === 0) {
      result.issues.push('All payment settings look correct. Payment should be working.');
    }

  } catch (error) {
    result.issues.push(`Error checking payment settings: ${error.message}`);
  }

  return result;
};

export const logPaymentDiagnostics = async (instructorId: string) => {
  const diagnostics = await diagnosePaymentIssues(instructorId);
  
  console.group('🔍 Payment Diagnostics');
  console.log('Instructor ID:', instructorId);
  console.log('Environment:', diagnostics.environment);
  console.log('Has Payment Settings:', diagnostics.hasPaymentSettings);
  console.log('Is Active:', diagnostics.isActive);
  console.log('Has Client Key:', diagnostics.hasClientKey);
  console.log('Has Server Key:', diagnostics.hasServerKey);
  console.log('Key Format Valid:', diagnostics.keyFormatValid);
  
  if (diagnostics.issues.length > 0) {
    console.group('❌ Issues Found:');
    diagnostics.issues.forEach((issue, index) => {
      console.log(`${index + 1}. ${issue}`);
    });
    console.groupEnd();
  } else {
    console.log('✅ No issues found');
  }
  
  console.groupEnd();
  return diagnostics;
};
