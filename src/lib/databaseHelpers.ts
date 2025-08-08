import { supabase } from '@/integrations/supabase/client';

/**
 * Database helper functions for the new revenue management tables
 * These functions work around TypeScript type issues until types are regenerated
 */

export interface RevenueSplitData {
  payment_id: string;
  instructor_id: string;
  course_id: string;
  total_amount: number;
  platform_fee_percentage: number;
  platform_fee_amount: number;
  instructor_share: number;
  status: 'pending' | 'calculated' | 'paid_out';
}

export interface PayoutBatchData {
  instructor_id: string;
  total_amount: number;
  transaction_count: number;
  payout_method: 'manual_transfer' | 'bank_api' | 'digital_wallet';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  scheduled_date?: string;
  notes?: string;
}

export interface BankAccountData {
  instructor_id: string;
  bank_name: string;
  account_number: string;
  account_holder_name: string;
  bank_code?: string;
  is_verified: boolean;
  is_active: boolean;
}

/**
 * Revenue Split Functions
 */
export const insertRevenueSplit = async (splitData: RevenueSplitData) => {
  try {
    const { data, error } = await supabase
      .from('revenue_splits' as any)
      .insert(splitData)
      .select();
    
    if (error) {
      console.error('Error inserting revenue split:', error);
      return { data: null, error };
    }
    
    return { data, error: null };
  } catch (error) {
    console.error('Exception inserting revenue split:', error);
    return { data: null, error };
  }
};

export const getInstructorRevenueSplits = async (instructorId: string) => {
  try {
    const { data, error } = await supabase
      .from('revenue_splits' as any)
      .select('*')
      .eq('instructor_id', instructorId)
      .order('created_at', { ascending: false });
    
    return { data, error };
  } catch (error) {
    console.error('Exception fetching revenue splits:', error);
    return { data: null, error };
  }
};

export const getInstructorEarningsSummary = async (instructorId: string) => {
  try {
    const { data: splits, error } = await supabase
      .from('revenue_splits' as any)
      .select('instructor_share, status, created_at')
      .eq('instructor_id', instructorId);

    if (error) {
      console.error('Error fetching earnings summary:', error);
      return {
        total_earnings: 0,
        pending_earnings: 0,
        paid_earnings: 0,
        this_month_earnings: 0,
        transactions_count: 0
      };
    }

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const totalEarnings = splits?.reduce((sum: number, split: any) => sum + split.instructor_share, 0) || 0;
    const pendingEarnings = splits?.filter((split: any) => split.status === 'calculated' || split.status === 'pending')
      .reduce((sum: number, split: any) => sum + split.instructor_share, 0) || 0;
    const paidEarnings = splits?.filter((split: any) => split.status === 'paid_out')
      .reduce((sum: number, split: any) => sum + split.instructor_share, 0) || 0;
    
    const thisMonthEarnings = splits?.filter((split: any) => {
      const splitDate = new Date(split.created_at);
      return splitDate.getMonth() === currentMonth && splitDate.getFullYear() === currentYear;
    }).reduce((sum: number, split: any) => sum + split.instructor_share, 0) || 0;

    return {
      total_earnings: totalEarnings,
      pending_earnings: pendingEarnings,
      paid_earnings: paidEarnings,
      this_month_earnings: thisMonthEarnings,
      transactions_count: splits?.length || 0
    };
  } catch (error) {
    console.error('Exception calculating earnings summary:', error);
    return {
      total_earnings: 0,
      pending_earnings: 0,
      paid_earnings: 0,
      this_month_earnings: 0,
      transactions_count: 0
    };
  }
};

/**
 * Payout Management Functions
 */
export const insertPayoutBatch = async (payoutData: PayoutBatchData) => {
  try {
    const { data, error } = await supabase
      .from('payout_batches' as any)
      .insert(payoutData)
      .select();
    
    return { data, error };
  } catch (error) {
    console.error('Exception inserting payout batch:', error);
    return { data: null, error };
  }
};

export const getPendingPayouts = async () => {
  try {
    const { data, error } = await supabase
      .from('payout_batches' as any)
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    
    return { data, error };
  } catch (error) {
    console.error('Exception fetching pending payouts:', error);
    return { data: null, error };
  }
};

export const updatePayoutStatus = async (payoutId: string, status: string, batchReference?: string) => {
  try {
    const updateData: any = { 
      status,
      processed_at: new Date().toISOString()
    };
    
    if (batchReference) {
      updateData.batch_reference = batchReference;
    }

    const { data, error } = await supabase
      .from('payout_batches' as any)
      .update(updateData)
      .eq('id', payoutId)
      .select();
    
    return { data, error };
  } catch (error) {
    console.error('Exception updating payout status:', error);
    return { data: null, error };
  }
};

export const getInstructorPayouts = async (instructorId: string) => {
  try {
    const { data, error } = await supabase
      .from('payout_batches' as any)
      .select('*')
      .eq('instructor_id', instructorId)
      .order('created_at', { ascending: false });
    
    return { data, error };
  } catch (error) {
    console.error('Exception fetching instructor payouts:', error);
    return { data: null, error };
  }
};

/**
 * Bank Account Functions
 */
export const insertBankAccount = async (bankData: BankAccountData) => {
  try {
    const { data, error } = await supabase
      .from('instructor_bank_accounts' as any)
      .upsert(bankData)
      .select();
    
    return { data, error };
  } catch (error) {
    console.error('Exception inserting bank account:', error);
    return { data: null, error };
  }
};

export const getBankAccount = async (instructorId: string) => {
  try {
    const { data, error } = await supabase
      .from('instructor_bank_accounts' as any)
      .select('*')
      .eq('instructor_id', instructorId)
      .single();
    
    return { data, error };
  } catch (error) {
    console.error('Exception fetching bank account:', error);
    return { data: null, error };
  }
};

/**
 * Platform Settings Functions
 */
export const getPlatformSetting = async (settingKey: string) => {
  try {
    const { data, error } = await supabase
      .from('platform_settings' as any)
      .select('setting_value')
      .eq('setting_key', settingKey)
      .single();
    
    return { data, error };
  } catch (error) {
    console.error('Exception fetching platform setting:', error);
    return { data: null, error };
  }
};

export const updatePlatformSetting = async (settingKey: string, settingValue: any) => {
  try {
    const { data, error } = await supabase
      .from('platform_settings' as any)
      .upsert({
        setting_key: settingKey,
        setting_value: settingValue,
        updated_at: new Date().toISOString()
      })
      .select();
    
    return { data, error };
  } catch (error) {
    console.error('Exception updating platform setting:', error);
    return { data: null, error };
  }
};

/**
 * Admin Dashboard Functions
 */
export const getAdminPayoutSummary = async () => {
  try {
    const { data: payouts, error } = await supabase
      .from('payout_batches' as any)
      .select('*');

    if (error) {
      console.error('Error fetching admin summary:', error);
      return {
        pending_requests: 0,
        total_pending_amount: 0,
        processing_batches: 0,
        completed_this_month: 0,
        instructors_awaiting_payout: 0
      };
    }

    const pendingRequests = payouts?.filter((req: any) => req.status === 'pending') || [];
    const processingBatches = payouts?.filter((req: any) => req.status === 'processing') || [];
    
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const completedThisMonth = payouts?.filter((req: any) => {
      if (req.status !== 'completed' || !req.processed_at) return false;
      const processedDate = new Date(req.processed_at);
      return processedDate.getMonth() === currentMonth && processedDate.getFullYear() === currentYear;
    }) || [];

    const instructorsAwaiting = new Set(pendingRequests.map((req: any) => req.instructor_id));

    return {
      pending_requests: pendingRequests.length,
      total_pending_amount: pendingRequests.reduce((sum: number, req: any) => sum + req.total_amount, 0),
      processing_batches: processingBatches.length,
      completed_this_month: completedThisMonth.length,
      instructors_awaiting_payout: instructorsAwaiting.size
    };
  } catch (error) {
    console.error('Exception fetching admin summary:', error);
    return {
      pending_requests: 0,
      total_pending_amount: 0,
      processing_batches: 0,
      completed_this_month: 0,
      instructors_awaiting_payout: 0
    };
  }
};

/**
 * Revenue Split Calculation using Database Function
 */
export const calculateRevenueSplitDB = async (coursePrice: number, instructorId: string, customFeePercentage?: number) => {
  try {
    // Try to use the database function first
    const { data, error } = await supabase.rpc('calculate_revenue_split', {
      course_price: coursePrice,
      instructor_id: instructorId,
      custom_fee_percentage: customFeePercentage
    });

    if (error || !data) {
      console.log('Database function not available, using fallback calculation');
      // Fallback calculation
      const feePercentage = customFeePercentage || 10;
      const platformFee = Math.round(coursePrice * feePercentage / 100);
      const instructorShare = coursePrice - platformFee;

      return {
        total_amount: coursePrice,
        platform_fee_amount: platformFee,
        instructor_share: instructorShare,
        fee_percentage: feePercentage
      };
    }

    return data[0];
  } catch (error) {
    console.error('Exception calculating revenue split:', error);
    // Fallback calculation
    const feePercentage = customFeePercentage || 10;
    const platformFee = Math.round(coursePrice * feePercentage / 100);
    const instructorShare = coursePrice - platformFee;

    return {
      total_amount: coursePrice,
      platform_fee_amount: platformFee,
      instructor_share: instructorShare,
      fee_percentage: feePercentage
    };
  }
};
