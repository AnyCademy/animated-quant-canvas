import { supabase } from '@/integrations/supabase/client';

export interface MidtransPaymentData {
  orderId: string;
  amount: number;
  customerDetails: {
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
  };
  itemDetails: {
    id: string;
    price: number;
    quantity: number;
    name: string;
  }[];
}

export interface MidtransSnapResponse {
  token: string;
  redirect_url: string;
}

export interface PlatformMidtransConfig {
  client_key: string;
  server_key: string;
  is_production: boolean;
  is_active: boolean;
  disbursement_enabled?: boolean;
}

// Extend window interface for Snap
declare global {
  interface Window {
    snap: {
      pay: (token: string, options: {
        onSuccess: (result: any) => void;
        onPending: (result: any) => void;
        onError: (result: any) => void;
        onClose: () => void;
      }) => void;
    };
  }
}

// Get platform Midtrans configuration
export const getPlatformMidtransConfig = async (): Promise<PlatformMidtransConfig | null> => {
  try {
    const { data, error } = await supabase
      .from('platform_settings')
      .select('setting_value')
      .eq('setting_key', 'midtrans_config')
      .single();

    if (error || !data) {
      console.error('Error fetching platform Midtrans config:', error);
      return null;
    }

    const config = data.setting_value as any;
    
    // Validate that required credentials are present
    if (!config.client_key || !config.server_key) {
      console.error('Missing platform Midtrans credentials');
      return null;
    }

    if (!config.is_active) {
      console.error('Platform Midtrans is not active');
      return null;
    }

    // Validate key formats based on environment
    const expectedClientPrefix = config.is_production ? 'Mid-client-' : 'SB-Mid-client-';
    const expectedServerPrefix = config.is_production ? 'Mid-server-' : 'SB-Mid-server-';
    
    if (!config.client_key.startsWith(expectedClientPrefix)) {
      console.error('Invalid platform client key format. Expected prefix:', expectedClientPrefix);
      return null;
    }
    
    if (!config.server_key.startsWith(expectedServerPrefix)) {
      console.error('Invalid platform server key format. Expected prefix:', expectedServerPrefix);
      return null;
    }

    console.log('✅ Valid platform Midtrans configuration found');
    return config;
  } catch (error) {
    console.error('Error fetching platform Midtrans settings:', error);
    return null;
  }
};

// Load Snap script with platform credentials
export const loadSnapScript = async (): Promise<void> => {
  const config = await getPlatformMidtransConfig();
  
  if (!config) {
    throw new Error('Platform Midtrans configuration not found or invalid');
  }

  return new Promise((resolve, reject) => {
    // Remove existing script if any
    const existingScript = document.querySelector('script[src*="snap.js"]');
    if (existingScript) {
      existingScript.remove();
    }

    const script = document.createElement('script');
    script.src = 'https://app.midtrans.com/snap/snap.js';
    script.setAttribute('data-client-key', config.client_key);
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Snap script'));
    document.head.appendChild(script);
  });
};

// Create Snap payment token with platform credentials
export const createSnapToken = async (paymentData: MidtransPaymentData): Promise<string> => {
  const config = await getPlatformMidtransConfig();
  
  if (!config) {
    throw new Error('Platform Midtrans configuration not found or invalid');
  }

  const baseUrl = config.is_production 
    ? 'https://app.midtrans.com/snap/v1/transactions' 
    : 'https://app.sandbox.midtrans.com/snap/v1/transactions';

  const payload = {
    transaction_details: {
      order_id: paymentData.orderId,
      gross_amount: paymentData.amount,
    },
    credit_card: {
      secure: true,
    },
    customer_details: paymentData.customerDetails,
    item_details: paymentData.itemDetails,
    callbacks: {
      finish: `${window.location.origin}/payment/finish`,
      error: `${window.location.origin}/payment/error`,
      pending: `${window.location.origin}/payment/pending`,
    },
  };

  try {
    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa(config.server_key + ':')}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Midtrans API Error: ${errorData.error_messages?.[0] || 'Unknown error'}`);
    }

    const data: MidtransSnapResponse = await response.json();
    return data.token;
  } catch (error) {
    console.error('Error creating Snap token:', error);
    throw error;
  }
};

// Open Snap payment modal
export const openSnapPayment = async (snapToken: string): Promise<any> => {
  if (!window.snap) {
    throw new Error('Snap script not loaded properly');
  }

  return new Promise((resolve, reject) => {
    window.snap.pay(snapToken, {
      onSuccess: (result) => {
        console.log('Payment success:', result);
        resolve(result);
      },
      onPending: (result) => {
        console.log('Payment pending:', result);
        resolve(result);
      },
      onError: (result) => {
        console.error('Payment error:', result);
        reject(new Error(`Payment failed: ${result.status_message || 'Unknown error'}`));
      },
      onClose: () => {
        console.log('Payment modal closed');
        reject(new Error('Payment cancelled by user'));
      },
    });
  });
};

// Update payment status in database
export const updatePaymentStatus = async (
  orderId: string, 
  status: string, 
  transactionId?: string,
  paymentMethod?: string
) => {
  try {
    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (transactionId) {
      updateData.midtrans_transaction_id = transactionId;
    }

    if (paymentMethod) {
      updateData.payment_method = paymentMethod;
    }

    if (status === 'paid') {
      updateData.paid_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('payments')
      .update(updateData)
      .eq('midtrans_order_id', orderId);

    if (error) {
      console.error('Database update error:', error);
      throw error;
    }

    // If payment is successful, create enrollment and revenue split
    if (status === 'paid') {
      const { data: paymentData } = await supabase
        .from('payments')
        .select('user_id, course_id, amount')
        .eq('midtrans_order_id', orderId)
        .single();

      if (paymentData) {
        // Create enrollment
        await supabase
          .from('course_enrollments')
          .insert({
            user_id: paymentData.user_id,
            course_id: paymentData.course_id,
          });

        // Create revenue split record
        const { data: courseData } = await supabase
          .from('courses')
          .select('instructor_id')
          .eq('id', paymentData.course_id)
          .single();

        if (courseData) {
          // Get platform fee percentage from settings
          const { data: revenueSplitConfig } = await supabase
            .from('platform_settings')
            .select('setting_value')
            .eq('setting_key', 'revenue_split_config')
            .single();

          const defaultFeePercentage = (revenueSplitConfig?.setting_value as any)?.default_platform_fee_percentage || 10;
          const platformFeeAmount = (paymentData.amount * defaultFeePercentage) / 100;
          const instructorShare = paymentData.amount - platformFeeAmount;

          await supabase
            .from('revenue_splits')
            .insert({
              payment_id: (await supabase
                .from('payments')
                .select('id')
                .eq('midtrans_order_id', orderId)
                .single()).data?.id,
              instructor_id: courseData.instructor_id,
              course_id: paymentData.course_id,
              total_amount: paymentData.amount,
              platform_fee_percentage: defaultFeePercentage,
              platform_fee_amount: platformFeeAmount,
              instructor_share: instructorShare,
              status: 'calculated'
            });
        }
      }
    }

    return true;
  } catch (error) {
    console.error('Error updating payment status:', error);
    throw error;
  }
};

// Check payment status from Midtrans with platform credentials
export const checkPaymentStatus = async (orderId: string) => {
  const config = await getPlatformMidtransConfig();
  
  if (!config) {
    throw new Error('Platform Midtrans configuration not found');
  }

  const baseUrl = config.is_production
    ? 'https://api.midtrans.com/v2'
    : 'https://api.sandbox.midtrans.com/v2';

  try {
    const response = await fetch(`${baseUrl}/${orderId}/status`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${btoa(config.server_key + ':')}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to check payment status');
    }

    return await response.json();
  } catch (error) {
    console.error('Error checking payment status:', error);
    throw error;
  }
};

// Legacy functions - now show deprecation warnings
export const getInstructorPaymentSettings = async (instructorId: string): Promise<any> => {
  console.warn('⚠️ getInstructorPaymentSettings is deprecated. Platform now uses centralized payment processing.');
  return null;
};

export const logPaymentDiagnostics = async (instructorId: string): Promise<void> => {
  console.warn('⚠️ logPaymentDiagnostics is deprecated. Use platform payment diagnostics instead.');
};
