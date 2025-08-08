import { supabase } from '@/integrations/supabase/client';

export interface PlatformSettings {
  setting_key: string;
  setting_value: any;
  description?: string;
  updated_by?: string;
  updated_at?: string;
}

export interface MidtransConfig {
  client_key: string;
  server_key: string;
  is_production: boolean;
  is_active: boolean;
}

export interface RevenueSplitConfig {
  default_platform_fee_percentage: number;
  minimum_payout_amount: number;
  payout_schedule: string;
  fee_tiers: {
    min_amount: number;
    max_amount: number;
    fee_percentage: number;
    description: string;
  }[];
  special_instructor_rates: {
    featured_instructors: number;
    new_instructors: number;
    top_performers: number;
  };
}

export interface PayoutConfig {
  payout_methods: string[];
  payout_schedules: string[];
  minimum_amounts: {
    manual_transfer: number;
    bank_api: number;
    digital_wallet: number;
  };
  processing_fees: {
    manual_transfer: number;
    bank_api: number;
    digital_wallet: number;
  };
}

/**
 * Get platform setting by key
 */
export const getPlatformSetting = async <T = any>(key: string): Promise<T | null> => {
  try {
    const { data, error } = await supabase
      .from('platform_settings')
      .select('setting_value')
      .eq('setting_key', key)
      .single();

    if (error) {
      console.error(`Error fetching platform setting ${key}:`, error);
      return null;
    }

    return data?.setting_value as T;
  } catch (error) {
    console.error(`Exception fetching platform setting ${key}:`, error);
    return null;
  }
};

/**
 * Get platform Midtrans configuration
 */
export const getPlatformMidtransConfig = async (): Promise<MidtransConfig | null> => {
  const config = await getPlatformSetting<MidtransConfig>('midtrans_config');
  
  // Fallback to environment variables if no platform config
  if (!config) {
    console.warn('No platform Midtrans config found, using environment variables');
    return {
      client_key: import.meta.env.VITE_MIDTRANS_CLIENT_KEY || '',
      server_key: import.meta.env.VITE_MIDTRANS_SERVER_KEY || '',
      is_production: import.meta.env.VITE_MIDTRANS_IS_PRODUCTION === 'true',
      is_active: true
    };
  }

  return config;
};

/**
 * Get revenue split configuration
 */
export const getRevenueSplitConfig = async (): Promise<RevenueSplitConfig | null> => {
  return await getPlatformSetting<RevenueSplitConfig>('revenue_split_config');
};

/**
 * Get payout configuration
 */
export const getPayoutConfig = async (): Promise<PayoutConfig | null> => {
  return await getPlatformSetting<PayoutConfig>('payout_config');
};

/**
 * Update platform setting
 */
export const updatePlatformSetting = async (
  key: string, 
  value: any, 
  description?: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('platform_settings')
      .upsert({
        setting_key: key,
        setting_value: value,
        description,
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error(`Error updating platform setting ${key}:`, error);
      return false;
    }

    return true;
  } catch (error) {
    console.error(`Exception updating platform setting ${key}:`, error);
    return false;
  }
};

/**
 * Get all platform settings
 */
export const getAllPlatformSettings = async (): Promise<PlatformSettings[]> => {
  try {
    const { data, error } = await supabase
      .from('platform_settings')
      .select('*')
      .order('setting_key');

    if (error) {
      console.error('Error fetching all platform settings:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Exception fetching all platform settings:', error);
    return [];
  }
};

/**
 * Initialize default platform settings
 */
export const initializePlatformSettings = async (): Promise<boolean> => {
  try {
    console.log('Initializing platform settings...');

    // Check if settings already exist
    const existingSettings = await getAllPlatformSettings();
    if (existingSettings.length > 0) {
      console.log('Platform settings already initialized');
      return true;
    }

    // Default Midtrans configuration
    const defaultMidtransConfig: MidtransConfig = {
      client_key: import.meta.env.VITE_MIDTRANS_CLIENT_KEY || 'SB-Mid-client-PLATFORM-KEY',
      server_key: import.meta.env.VITE_MIDTRANS_SERVER_KEY || 'SB-Mid-server-PLATFORM-KEY',
      is_production: false,
      is_active: true
    };

    // Default revenue split configuration
    const defaultRevenueSplitConfig: RevenueSplitConfig = {
      default_platform_fee_percentage: 10,
      minimum_payout_amount: 50000,
      payout_schedule: 'monthly',
      fee_tiers: [
        { min_amount: 0, max_amount: 100000, fee_percentage: 5, description: 'Budget courses' },
        { min_amount: 100001, max_amount: 500000, fee_percentage: 10, description: 'Standard courses' },
        { min_amount: 500001, max_amount: 999999999, fee_percentage: 15, description: 'Premium courses' }
      ],
      special_instructor_rates: {
        featured_instructors: 5,
        new_instructors: 8,
        top_performers: 7
      }
    };

    // Default payout configuration
    const defaultPayoutConfig: PayoutConfig = {
      payout_methods: ['manual_transfer', 'bank_api', 'digital_wallet'],
      payout_schedules: ['weekly', 'bi_weekly', 'monthly'],
      minimum_amounts: {
        manual_transfer: 50000,
        bank_api: 25000,
        digital_wallet: 10000
      },
      processing_fees: {
        manual_transfer: 0,
        bank_api: 2500,
        digital_wallet: 1000
      }
    };

    // Insert default settings
    const settingsToInsert = [
      {
        setting_key: 'midtrans_config',
        setting_value: defaultMidtransConfig,
        description: 'Platform-wide Midtrans payment configuration'
      },
      {
        setting_key: 'revenue_split_config',
        setting_value: defaultRevenueSplitConfig,
        description: 'Revenue splitting configuration and fee structure'
      },
      {
        setting_key: 'payout_config',
        setting_value: defaultPayoutConfig,
        description: 'Payout methods and configuration'
      }
    ];

    const { error } = await supabase
      .from('platform_settings')
      .insert(settingsToInsert);

    if (error) {
      console.error('Error initializing platform settings:', error);
      return false;
    }

    console.log('Platform settings initialized successfully');
    return true;
  } catch (error) {
    console.error('Exception initializing platform settings:', error);
    return false;
  }
};

/**
 * Validate platform configuration
 */
export const validatePlatformConfig = async (): Promise<{
  isValid: boolean;
  missingSettings: string[];
  issues: string[];
}> => {
  const missingSettings: string[] = [];
  const issues: string[] = [];

  try {
    // Check Midtrans config
    const midtransConfig = await getPlatformMidtransConfig();
    if (!midtransConfig) {
      missingSettings.push('midtrans_config');
    } else {
      if (!midtransConfig.client_key) issues.push('Missing Midtrans client key');
      if (!midtransConfig.server_key) issues.push('Missing Midtrans server key');
      if (!midtransConfig.is_active) issues.push('Midtrans configuration is inactive');
    }

    // Check revenue split config
    const revenueSplitConfig = await getRevenueSplitConfig();
    if (!revenueSplitConfig) {
      missingSettings.push('revenue_split_config');
    } else {
      if (!revenueSplitConfig.default_platform_fee_percentage) {
        issues.push('Missing default platform fee percentage');
      }
      if (!revenueSplitConfig.fee_tiers || revenueSplitConfig.fee_tiers.length === 0) {
        issues.push('Missing fee tiers configuration');
      }
    }

    // Check payout config
    const payoutConfig = await getPayoutConfig();
    if (!payoutConfig) {
      missingSettings.push('payout_config');
    }

    return {
      isValid: missingSettings.length === 0 && issues.length === 0,
      missingSettings,
      issues
    };
  } catch (error) {
    console.error('Error validating platform config:', error);
    return {
      isValid: false,
      missingSettings,
      issues: ['Error validating configuration']
    };
  }
};
