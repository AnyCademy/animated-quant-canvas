import { supabase } from '@/integrations/supabase/client';

export interface PlatformPaymentDiagnosticResult {
  hasPlatformSettings: boolean;
  isActive: boolean;
  hasClientKey: boolean;
  hasServerKey: boolean;
  isProduction: boolean;
  disbursementEnabled: boolean;
  environment: 'sandbox' | 'production';
  issues: string[];
}

export const diagnosePlatformPaymentIssues = async (): Promise<PlatformPaymentDiagnosticResult> => {
  const result: PlatformPaymentDiagnosticResult = {
    hasPlatformSettings: false,
    isActive: false,
    hasClientKey: false,
    hasServerKey: false,
    isProduction: false,
    disbursementEnabled: false,
    environment: 'sandbox',
    issues: []
  };

  try {
    // Check platform Midtrans configuration
    const { data: midtransConfig, error: midtransError } = await supabase
      .from('platform_settings')
      .select('setting_value')
      .eq('setting_key', 'midtrans_config')
      .single();

    if (midtransError || !midtransConfig) {
      result.issues.push('No platform Midtrans configuration found. Platform admin needs to configure Midtrans credentials.');
      return result;
    }

    result.hasPlatformSettings = true;
    const config = midtransConfig.setting_value as any;
    
    // Check if active
    result.isActive = config.is_active || false;
    if (!result.isActive) {
      result.issues.push('Platform payment gateway is not activated.');
    }

    // Check credentials
    const clientKey = config.client_key || '';
    const serverKey = config.server_key || '';
    result.isProduction = config.is_production || false;
    result.disbursementEnabled = config.disbursement_enabled || false;
    result.environment = result.isProduction ? 'production' : 'sandbox';

    result.hasClientKey = !!clientKey;
    result.hasServerKey = !!serverKey;

    if (!result.hasClientKey) {
      result.issues.push('Missing platform Midtrans Client Key.');
    }

    if (!result.hasServerKey) {
      result.issues.push('Missing platform Midtrans Server Key.');
    }

    // Validate key formats
    if (result.hasClientKey && result.hasServerKey) {
      const expectedClientPrefix = result.isProduction ? 'Mid-client-' : 'SB-Mid-client-';
      const expectedServerPrefix = result.isProduction ? 'Mid-server-' : 'SB-Mid-server-';
      
      const clientKeyValid = clientKey.startsWith(expectedClientPrefix);
      const serverKeyValid = serverKey.startsWith(expectedServerPrefix);
      
      if (!clientKeyValid) {
        result.issues.push(`Invalid platform Client Key format. Expected format: ${expectedClientPrefix}...`);
      }
      
      if (!serverKeyValid) {
        result.issues.push(`Invalid platform Server Key format. Expected format: ${expectedServerPrefix}...`);
      }
    }

    // Check disbursement configuration
    if (!result.disbursementEnabled) {
      result.issues.push('Platform disbursement is not enabled. Required for instructor payouts.');
    }

    // Check disbursement settings
    const { data: disbursementConfig } = await supabase
      .from('platform_settings')
      .select('setting_value')
      .eq('setting_key', 'midtrans_disbursement')
      .single();

    if (!disbursementConfig) {
      result.issues.push('No disbursement configuration found. Platform admin needs to configure disbursement settings.');
    }

    return result;
  } catch (error) {
    console.error('Error diagnosing platform payment issues:', error);
    result.issues.push(`Diagnostic error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return result;
  }
};

// Legacy function - now shows deprecation message
export const diagnosePaymentIssues = async (instructorId: string): Promise<any> => {
  console.warn('⚠️ diagnosePaymentIssues is deprecated. Instructor payment settings have been removed.');
  console.warn('ℹ️ Use diagnosePlatformPaymentIssues() for platform payment diagnostics.');
  
  return {
    hasPaymentSettings: false,
    isActive: false,
    hasClientKey: false,
    hasServerKey: false,
    isProduction: false,
    keyFormatValid: false,
    environment: 'sandbox',
    rlsPermissionIssue: false,
    issues: ['Instructor payment settings have been deprecated. Platform now uses centralized payment processing.']
  };
};
