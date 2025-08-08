import { supabase } from '@/integrations/supabase/client';
import { getPlatformMidtransConfig } from './platformSettings';

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
  courseId: string;
  instructorId: string;
}

export interface MidtransSnapResponse {
  token: string;
  redirect_url: string;
}

export interface PaymentRecord {
  id: string;
  midtrans_order_id: string;
  amount: number;
  status: string;
  course_id: string;
  user_id: string;
  instructor_share?: number;
  platform_fee?: number;
  created_at: string;
}

/**
 * Create payment using platform Midtrans account
 */
export const createPlatformPayment = async (paymentData: MidtransPaymentData): Promise<MidtransSnapResponse | null> => {
  try {
    console.log('Creating platform payment for order:', paymentData.orderId);

    // Get platform Midtrans configuration
    const midtransConfig = await getPlatformMidtransConfig();
    if (!midtransConfig || !midtransConfig.is_active) {
      throw new Error('Platform Midtrans configuration not available or inactive');
    }

    // Prepare Midtrans Snap API request
    const snapData = {
      transaction_details: {
        order_id: paymentData.orderId,
        gross_amount: paymentData.amount
      },
      customer_details: paymentData.customerDetails,
      item_details: paymentData.itemDetails,
      callbacks: {
        finish: `${window.location.origin}/payment-result`
      }
    };

    // Call Midtrans Snap API
    const response = await fetch('https://app.sandbox.midtrans.com/snap/v1/transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa(midtransConfig.server_key + ':')}`
      },
      body: JSON.stringify(snapData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Midtrans API error: ${errorData.error_messages?.[0] || 'Unknown error'}`);
    }

    const snapResponse = await response.json();

    // Store payment record in database
    await storePaymentRecord({
      order_id: paymentData.orderId,
      amount: paymentData.amount,
      status: 'pending',
      course_id: paymentData.courseId,
      instructor_id: paymentData.instructorId,
      customer_email: paymentData.customerDetails.email,
      customer_name: `${paymentData.customerDetails.first_name} ${paymentData.customerDetails.last_name}`
    });

    console.log('Platform payment created successfully:', paymentData.orderId);

    return {
      token: snapResponse.token,
      redirect_url: snapResponse.redirect_url
    };

  } catch (error) {
    console.error('Error creating platform payment:', error);
    return null;
  }
};

/**
 * Store payment record in database
 */
const storePaymentRecord = async (paymentData: any): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('payments')
      .insert({
        order_id: paymentData.order_id,
        amount: paymentData.amount,
        status: paymentData.status,
        course_id: paymentData.course_id,
        instructor_id: paymentData.instructor_id,
        student_id: (await supabase.auth.getUser()).data.user?.id,
        customer_email: paymentData.customer_email,
        customer_name: paymentData.customer_name,
        payment_method: 'platform_midtrans',
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error storing payment record:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Exception storing payment record:', error);
    return false;
  }
};

/**
 * Update payment status after Midtrans notification
 */
export const updatePlatformPaymentStatus = async (
  orderId: string, 
  status: string, 
  midtransData?: any
): Promise<boolean> => {
  try {
    console.log(`Updating payment status for order ${orderId}: ${status}`);

    // Update payment record
    const { data: paymentData, error: updateError } = await supabase
      .from('payments')
      .update({
        status: status,
        midtrans_transaction_id: midtransData?.transaction_id,
        midtrans_response: midtransData,
        updated_at: new Date().toISOString()
      })
      .eq('order_id', orderId)
      .select('*')
      .single();

    if (updateError) {
      console.error('Error updating payment status:', updateError);
      return false;
    }

    // If payment is successful, process revenue split
    if (status === 'paid' && paymentData) {
      await processRevenueSplit(paymentData);
      
      // Enroll student in course
      await enrollStudentInCourse(paymentData);
    }

    return true;
  } catch (error) {
    console.error('Exception updating payment status:', error);
    return false;
  }
};

/**
 * Process revenue split after successful payment
 */
const processRevenueSplit = async (paymentData: PaymentRecord): Promise<boolean> => {
  try {
    console.log('Processing revenue split for payment:', paymentData.id);

    // Import here to avoid circular dependency
    const { calculateRevenueSplit, storeRevenueSplit } = await import('./revenueSplit');

    // Calculate revenue split
    const splitResult = await calculateRevenueSplit(
      paymentData.amount,
      paymentData.instructor_id
    );

    if (!splitResult) {
      console.error('Failed to calculate revenue split');
      return false;
    }

    // Store revenue split record
    const success = await storeRevenueSplit({
      payment_id: paymentData.id,
      instructor_id: paymentData.instructor_id,
      course_id: paymentData.course_id,
      total_amount: splitResult.totalAmount,
      platform_fee_percentage: splitResult.feePercentage,
      platform_fee_amount: splitResult.platformFee,
      instructor_share: splitResult.instructorShare,
      status: 'calculated'
    });

    if (success) {
      console.log('Revenue split processed successfully for payment:', paymentData.id);
    }

    return success;
  } catch (error) {
    console.error('Error processing revenue split:', error);
    return false;
  }
};

/**
 * Enroll student in course after successful payment
 */
const enrollStudentInCourse = async (paymentData: PaymentRecord): Promise<boolean> => {
  try {
    console.log('Enrolling student in course:', paymentData.course_id);

    const { error } = await supabase
      .from('enrollments')
      .insert({
        student_id: paymentData.student_id,
        course_id: paymentData.course_id,
        payment_id: paymentData.id,
        enrollment_date: new Date().toISOString(),
        status: 'active'
      });

    if (error) {
      console.error('Error enrolling student:', error);
      return false;
    }

    console.log('Student enrolled successfully in course:', paymentData.course_id);
    return true;
  } catch (error) {
    console.error('Exception enrolling student:', error);
    return false;
  }
};

/**
 * Get payment by order ID
 */
export const getPaymentByOrderId = async (orderId: string): Promise<PaymentRecord | null> => {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('order_id', orderId)
      .single();

    if (error) {
      console.error('Error fetching payment:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Exception fetching payment:', error);
    return null;
  }
};

/**
 * Get instructor payments
 */
export const getInstructorPayments = async (instructorId: string): Promise<PaymentRecord[]> => {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('instructor_id', instructorId)
      .eq('status', 'paid')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching instructor payments:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Exception fetching instructor payments:', error);
    return [];
  }
};

/**
 * Validate platform payment setup
 */
export const validatePlatformPaymentSetup = async (): Promise<{
  isValid: boolean;
  issues: string[];
}> => {
  const issues: string[] = [];

  try {
    // Check platform Midtrans configuration
    const midtransConfig = await getPlatformMidtransConfig();
    if (!midtransConfig) {
      issues.push('Platform Midtrans configuration not found');
    } else {
      if (!midtransConfig.client_key) issues.push('Platform Midtrans client key missing');
      if (!midtransConfig.server_key) issues.push('Platform Midtrans server key missing');
      if (!midtransConfig.is_active) issues.push('Platform Midtrans configuration is inactive');
    }

    // Check if payments table exists and is accessible
    const { error: paymentsTableError } = await supabase
      .from('payments')
      .select('id')
      .limit(1);

    if (paymentsTableError) {
      issues.push('Payments table not accessible');
    }

    return {
      isValid: issues.length === 0,
      issues
    };
  } catch (error) {
    console.error('Error validating platform payment setup:', error);
    return {
      isValid: false,
      issues: ['Error validating payment setup']
    };
  }
};

/**
 * Generate unique order ID
 */
export const generateOrderId = (): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `ORDER-${timestamp}-${random}`.toUpperCase();
};
