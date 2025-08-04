import { supabase } from '@/integrations/supabase/client';
import { 
  DEFAULT_PLATFORM_SETTINGS, 
  PlatformSettings, 
  calculatePlatformFee, 
  calculateInstructorShare, 
  shouldEnableSplitPayment 
} from './platform-settings';
import { InstructorPaymentSettings, MidtransPaymentData } from './midtrans';

export interface SplitPaymentData extends MidtransPaymentData {
  instructorSettings: InstructorPaymentSettings;
  platformSettings?: PlatformSettings;
  enableSplit?: boolean;
}

export interface SplitPaymentBreakdown {
  totalAmount: number;
  platformFee: number;
  instructorShare: number;
  platformFeePercentage: number;
}

// Calculate split payment breakdown
export const calculateSplitPaymentBreakdown = (
  coursePrice: number, 
  platformSettings: PlatformSettings = DEFAULT_PLATFORM_SETTINGS
): SplitPaymentBreakdown => {
  const platformFee = calculatePlatformFee(coursePrice, platformSettings);
  const instructorShare = calculateInstructorShare(coursePrice, platformSettings);
  
  return {
    totalAmount: coursePrice,
    platformFee,
    instructorShare,
    platformFeePercentage: platformSettings.platform_fee_percentage,
  };
};

// Create split payment with Midtrans marketplace feature
export const createSplitPaymentToken = async (
  splitPaymentData: SplitPaymentData
): Promise<string> => {
  const { 
    orderId, 
    amount, 
    customerDetails, 
    itemDetails, 
    instructorSettings,
    platformSettings = DEFAULT_PLATFORM_SETTINGS,
    enableSplit = true
  } = splitPaymentData;

  // Determine which Midtrans account to use for the main transaction
  // For split payments, we'll use the platform account as the main receiver
  const useSplitPayment = enableSplit && shouldEnableSplitPayment(amount, instructorSettings, platformSettings);
  
  let mainSettings: InstructorPaymentSettings;
  let paymentPayload: any;

  if (useSplitPayment) {
    // Use platform account as main receiver for split payments
    mainSettings = {
      midtrans_client_key: platformSettings.admin_midtrans_client_key,
      midtrans_server_key: platformSettings.admin_midtrans_server_key,
      is_production: platformSettings.admin_midtrans_is_production,
      is_active: true,
    };

    // Calculate split amounts
    const breakdown = calculateSplitPaymentBreakdown(amount, platformSettings);
    
    // Create payload with split payment configuration
    paymentPayload = {
      transaction_details: {
        order_id: orderId,
        gross_amount: amount,
      },
      credit_card: {
        secure: true,
      },
      customer_details: customerDetails,
      item_details: itemDetails,
      // Split payment configuration
      custom_field1: `split_payment_enabled`,
      custom_field2: `instructor_share_${breakdown.instructorShare}`,
      custom_field3: `platform_fee_${breakdown.platformFee}`,
      callbacks: {
        finish: `${window.location.origin}/payment/finish`,
        error: `${window.location.origin}/payment/error`,
        pending: `${window.location.origin}/payment/pending`,
      },
      // Add metadata for tracking
      metadata: {
        split_payment: true,
        instructor_id: instructorSettings.midtrans_client_key.substring(0, 20), // Truncated for privacy
        platform_fee: breakdown.platformFee,
        instructor_share: breakdown.instructorShare,
        fee_percentage: breakdown.platformFeePercentage,
      }
    };

    console.log('Creating split payment with breakdown:', breakdown);
  } else {
    // Use instructor's account directly (no split)
    mainSettings = instructorSettings;
    
    paymentPayload = {
      transaction_details: {
        order_id: orderId,
        gross_amount: amount,
      },
      credit_card: {
        secure: true,
      },
      customer_details: customerDetails,
      item_details: itemDetails,
      callbacks: {
        finish: `${window.location.origin}/payment/finish`,
        error: `${window.location.origin}/payment/error`,
        pending: `${window.location.origin}/payment/pending`,
      },
      metadata: {
        split_payment: false,
        instructor_direct: true,
      }
    };

    console.log('Creating direct payment to instructor (no split)');
  }

  try {
    // Call backend API to create the payment token
    const response = await fetch('http://localhost:3001/api/create-split-payment-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        paymentPayload,
        mainSettings,
        instructorSettings: useSplitPayment ? instructorSettings : null,
        splitPaymentData: useSplitPayment ? {
          enabled: true,
          breakdown: calculateSplitPaymentBreakdown(amount, platformSettings)
        } : { enabled: false }
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Split Payment Error: ${errorData.message || 'Unknown error'}`);
    }

    const data = await response.json();
    
    if (data.status !== 'success') {
      throw new Error(`Split Payment Error: ${data.message || 'Unknown error'}`);
    }

    return data.token;
  } catch (error) {
    console.error('Error creating split payment token:', error);
    throw error;
  }
};

// Save split payment record to database
export const saveSplitPaymentRecord = async (
  splitPaymentData: SplitPaymentData,
  orderId: string,
  userId: string,
  courseId: string
) => {
  const { amount, instructorSettings, platformSettings = DEFAULT_PLATFORM_SETTINGS } = splitPaymentData;
  
  const useSplitPayment = shouldEnableSplitPayment(amount, instructorSettings, platformSettings);
  const breakdown = useSplitPayment ? calculateSplitPaymentBreakdown(amount, platformSettings) : null;

  try {
    // Save to payments table with split payment information included in initial insert
    const paymentRecord: any = {
      user_id: userId,
      course_id: courseId,
      amount: amount,
      midtrans_order_id: orderId,
      status: 'pending' as const,
      split_payment_enabled: useSplitPayment,
      platform_fee: breakdown?.platformFee || 0,
      instructor_share: breakdown?.instructorShare || 0,
      platform_fee_percentage: breakdown?.platformFeePercentage || 0,
    };

    const { data, error } = await supabase
      .from('payments')
      .insert(paymentRecord)
      .select()
      .single();

    if (error) {
      console.error('Error inserting payment record:', error);
      throw error;
    }

    console.log('Split payment record saved:', {
      orderId,
      splitEnabled: useSplitPayment,
      breakdown,
      paymentId: data?.id
    });

    return data;
  } catch (error) {
    console.error('Error saving split payment record:', error);
    throw error;
  }
};

// Process split payment settlement (to be called after successful payment)
export const processSplitPaymentSettlement = async (
  orderId: string,
  transactionId: string,
  paymentMethod: string
) => {
  try {
    // Get payment record
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('midtrans_order_id', orderId)
      .single();

    if (paymentError || !payment) {
      throw new Error('Payment record not found');
    }

    // Update payment status
    const updateData: any = {
      status: 'paid',
      midtrans_transaction_id: transactionId,
      payment_method: paymentMethod,
      paid_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { error: updateError } = await supabase
      .from('payments')
      .update(updateData)
      .eq('midtrans_order_id', orderId);

    if (updateError) throw updateError;

    // Create enrollment
    const { data: enrollmentData, error: enrollmentError } = await supabase
      .from('course_enrollments')
      .insert({
        user_id: payment.user_id,
        course_id: payment.course_id,
      });

    if (enrollmentError) {
      console.error('Error creating enrollment:', enrollmentError);
      // Don't throw error here as payment was successful
    }

    // If split payment was enabled, log the settlement details
    const paymentWithSplit = payment as any; // Type assertion for split payment fields
    if (paymentWithSplit.split_payment_enabled) {
      console.log('Split payment settlement processed:', {
        orderId,
        transactionId,
        totalAmount: payment.amount,
        platformFee: paymentWithSplit.platform_fee,
        instructorShare: paymentWithSplit.instructor_share,
      });

      // Here you could add additional logic to track platform earnings,
      // send notifications to instructors, etc.
    }

    return { success: true, payment, enrollment: enrollmentData };
  } catch (error) {
    console.error('Error processing split payment settlement:', error);
    throw error;
  }
};
