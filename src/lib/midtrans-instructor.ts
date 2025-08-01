import { supabase } from '@/integrations/supabase/client';

// Global Midtrans configuration (fallback)
const GLOBAL_MIDTRANS_SERVER_KEY = import.meta.env.VITE_MIDTRANS_SERVER_KEY;
const GLOBAL_MIDTRANS_CLIENT_KEY = import.meta.env.VITE_MIDTRANS_CLIENT_KEY;
const GLOBAL_MIDTRANS_IS_PRODUCTION = import.meta.env.VITE_MIDTRANS_IS_PRODUCTION === 'true';

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

export interface InstructorPaymentSettings {
  midtrans_client_key: string;
  midtrans_server_key: string;
  is_production: boolean;
  is_active: boolean;
}

// Get instructor's payment settings
export const getInstructorPaymentSettings = async (instructorId: string): Promise<InstructorPaymentSettings | null> => {
  try {
    // Use direct SQL query since the table type might not be available yet
    const { data, error } = await supabase
      .from('instructor_payment_settings' as any)
      .select('*')
      .eq('instructor_id', instructorId)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      midtrans_client_key: (data as any).midtrans_client_key,
      midtrans_server_key: (data as any).midtrans_server_key,
      is_production: (data as any).is_production,
      is_active: (data as any).is_active,
    };
  } catch (error) {
    console.error('Error fetching instructor payment settings:', error);
    return null;
  }
};

// Create Snap payment token with instructor-specific credentials
export const createSnapToken = async (
  paymentData: MidtransPaymentData, 
  instructorSettings?: InstructorPaymentSettings
): Promise<string> => {
  const settings = instructorSettings || {
    midtrans_server_key: GLOBAL_MIDTRANS_SERVER_KEY,
    midtrans_client_key: GLOBAL_MIDTRANS_CLIENT_KEY,
    is_production: GLOBAL_MIDTRANS_IS_PRODUCTION,
    is_active: true,
  };

  const baseUrl = settings.is_production 
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
        'Authorization': `Basic ${btoa(settings.midtrans_server_key + ':')}`,
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

// Load Snap script with instructor-specific credentials
export const loadSnapScript = (instructorSettings?: InstructorPaymentSettings): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (window.snap) {
      resolve();
      return;
    }

    const settings = instructorSettings || {
      midtrans_client_key: GLOBAL_MIDTRANS_CLIENT_KEY,
      is_production: GLOBAL_MIDTRANS_IS_PRODUCTION,
    };

    const script = document.createElement('script');
    script.src = settings.is_production
      ? 'https://app.midtrans.com/snap/snap.js'
      : 'https://app.sandbox.midtrans.com/snap/snap.js';
    script.setAttribute('data-client-key', settings.midtrans_client_key);
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Snap script'));
    document.head.appendChild(script);
  });
};

// Open Snap payment modal
export const openSnapPayment = (token: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    if (!window.snap) {
      reject(new Error('Snap script not loaded'));
      return;
    }

    window.snap.pay(token, {
      onSuccess: (result: any) => {
        console.log('Payment success:', result);
        resolve(result);
      },
      onPending: (result: any) => {
        console.log('Payment pending:', result);
        resolve(result);
      },
      onError: (result: any) => {
        console.error('Payment error:', result);
        reject(result);
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
  status: 'pending' | 'paid' | 'failed' | 'expired',
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

    if (error) throw error;

    // If payment is successful, create enrollment
    if (status === 'paid') {
      const { data: paymentData } = await supabase
        .from('payments')
        .select('user_id, course_id')
        .eq('midtrans_order_id', orderId)
        .single();

      if (paymentData) {
        await supabase
          .from('course_enrollments')
          .insert({
            user_id: paymentData.user_id,
            course_id: paymentData.course_id,
          });
      }
    }

    return true;
  } catch (error) {
    console.error('Error updating payment status:', error);
    throw error;
  }
};

// Check payment status from Midtrans with instructor-specific credentials
export const checkPaymentStatus = async (
  orderId: string, 
  instructorSettings?: InstructorPaymentSettings
) => {
  const settings = instructorSettings || {
    midtrans_server_key: GLOBAL_MIDTRANS_SERVER_KEY,
    is_production: GLOBAL_MIDTRANS_IS_PRODUCTION,
  };

  const baseUrl = settings.is_production
    ? 'https://api.midtrans.com/v2'
    : 'https://api.sandbox.midtrans.com/v2';

  try {
    const response = await fetch(`${baseUrl}/${orderId}/status`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${btoa(settings.midtrans_server_key + ':')}`,
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

// Declare global Snap interface
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
