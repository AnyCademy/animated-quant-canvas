import { supabase } from '@/integrations/supabase/client';

export interface PayoutBatch {
  id?: string;
  instructor_id: string;
  total_amount: number;
  transaction_count: number;
  payout_method: 'manual_transfer' | 'bank_api' | 'digital_wallet';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  scheduled_date?: string;
  processed_at?: string;
  batch_reference?: string;
  notes?: string;
  created_by?: string;
  created_at?: string;
}

export interface PayoutRequest {
  instructor_id: string;
  requested_amount: number;
  available_amount: number;
  bank_account: {
    bank_name: string;
    account_number: string;
    account_holder_name: string;
    is_verified: boolean;
  };
  revenue_splits: string[]; // Array of revenue split IDs
}

export interface AdminPayoutSummary {
  pending_requests: number;
  total_pending_amount: number;
  processing_batches: number;
  completed_this_month: number;
  instructors_awaiting_payout: number;
}

/**
 * Create a payout request from instructor
 */
export const createPayoutRequest = async (
  instructorId: string,
  requestedAmount: number
): Promise<boolean> => {
  try {
    console.log(`Creating payout request for instructor ${instructorId}: ${requestedAmount}`);

  // Check bank account (DB only)
    const dbAccount = await getInstructorBankAccount(instructorId);
    if (!dbAccount) {
      console.log('No bank account found for instructor');
      return false;
    }
    if (!dbAccount.is_verified) {
      console.log('Bank account not verified');
      return false;
    }

    // Try Supabase: insert payout_batches row as a payout request (status=pending)
    const { error: dbError } = await supabase.from('payout_batches').insert({
      instructor_id: instructorId,
      total_amount: requestedAmount,
      transaction_count: 1,
      payout_method: 'manual_transfer',
      status: 'pending',
      notes: `Payout request for ${requestedAmount}`
    });

  if (!dbError) return true;
  console.error('DB insert failed for payout request:', dbError?.message);
  return false;

  } catch (error) {
    console.error('Error creating payout request:', error);
    return false;
  }
};

/**
 * Get instructor payout history
 */
export const getInstructorPayouts = async (instructorId: string): Promise<PayoutBatch[]> => {
  try {
    const { data, error } = await supabase
      .from('payout_batches')
      .select('*')
      .eq('instructor_id', instructorId)
      .order('created_at', { ascending: false });

  if (!error && data) return data as unknown as PayoutBatch[];
  console.error('Error fetching instructor payouts:', error?.message);
  return [];
  } catch (error) {
    console.error('Error fetching instructor payouts:', error);
    return [];
  }
};

/**
 * Get all pending payout requests (Admin)
 */
export const getPendingPayoutRequests = async (): Promise<PayoutBatch[]> => {
  try {
    const { data, error } = await supabase
      .from('payout_batches')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

  if (!error && data) return data as unknown as PayoutBatch[];
  console.error('Error fetching pending payout requests:', error?.message);
  return [];
  } catch (error) {
    console.error('Error fetching pending payout requests:', error);
    return [];
  }
};

/**
 * Get admin payout dashboard summary
 */
export const getAdminPayoutSummary = async (): Promise<AdminPayoutSummary> => {
  try {
    const { data, error } = await supabase
      .from('payout_batches')
      .select('*');

    if (error || !data) {
      console.error('Error fetching admin payout summary:', error?.message);
      return {
        pending_requests: 0,
        total_pending_amount: 0,
        processing_batches: 0,
        completed_this_month: 0,
        instructors_awaiting_payout: 0
      };
    }

    const pending = data.filter((r: any) => r.status === 'pending');
    const processing = data.filter((r: any) => r.status === 'processing');
    const now = new Date();
    const completedThisMonth = data.filter((r: any) => {
      if (r.status !== 'completed' || !r.processed_at) return false;
      const d = new Date(r.processed_at);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const instructorsAwaiting = new Set(pending.map((r: any) => r.instructor_id));
    return {
      pending_requests: pending.length,
      total_pending_amount: pending.reduce((sum: number, r: any) => sum + Number(r.total_amount || 0), 0),
      processing_batches: processing.length,
      completed_this_month: completedThisMonth.length,
      instructors_awaiting_payout: instructorsAwaiting.size,
    };

  } catch (error) {
    console.error('Error fetching admin payout summary:', error);
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
 * Approve payout request (Admin)
 */
export const approvePayoutRequest = async (
  payoutId: string,
  batchReference?: string,
  notes?: string
): Promise<boolean> => {
  try {
    console.log(`Approving payout request: ${payoutId}`);
    const { error } = await supabase
      .from('payout_batches')
      .update({
        status: 'processing',
        batch_reference: batchReference || `BATCH-${Date.now()}`,
        notes: notes,
        processed_at: new Date().toISOString(),
      })
      .eq('id', payoutId);
  if (!error) return true;
  console.error('DB update failed for approvePayoutRequest:', error?.message);
  return false;

  } catch (error) {
    console.error('Error approving payout request:', error);
    return false;
  }
};

/**
 * Complete payout (Admin)
 */
export const completePayoutRequest = async (
  payoutId: string,
  transactionReference?: string
): Promise<boolean> => {
  try {
    console.log(`Completing payout request: ${payoutId}`);
    const { error } = await supabase
      .from('payout_batches')
      .update({
        status: 'completed',
        batch_reference: transactionReference,
        processed_at: new Date().toISOString(),
      })
      .eq('id', payoutId);
  if (!error) return true;
  console.error('DB update failed for completePayoutRequest:', error?.message);
  return false;

  } catch (error) {
    console.error('Error completing payout request:', error);
    return false;
  }
};

/**
 * Cancel payout request (Admin)
 */
export const cancelPayoutRequest = async (
  payoutId: string,
  reason?: string
): Promise<boolean> => {
  try {
    console.log(`Cancelling payout request: ${payoutId}`);
    const { error } = await supabase
      .from('payout_batches')
      .update({ status: 'cancelled', notes: reason || 'Cancelled by admin' })
      .eq('id', payoutId);
  if (!error) return true;
  console.error('DB update failed for cancelPayoutRequest:', error?.message);
  return false;

  } catch (error) {
    console.error('Error cancelling payout request:', error);
    return false;
  }
};

/**
 * Create batch payout (Admin)
 */
export const createBatchPayout = async (
  instructorIds: string[],
  payoutMethod: 'manual_transfer' | 'bank_api' | 'digital_wallet' = 'manual_transfer'
): Promise<boolean> => {
  try {
    console.log(`Creating batch payout for ${instructorIds.length} instructors`);
    const batchReference = `BATCH-${Date.now()}`;
    const { error } = await supabase
      .from('payout_batches')
      .update({
        status: 'processing',
        payout_method: payoutMethod,
        batch_reference: batchReference,
        processed_at: new Date().toISOString(),
      })
      .in('instructor_id', instructorIds)
      .eq('status', 'pending');
  if (!error) return true;
  console.error('DB update failed for createBatchPayout:', error?.message);
  return false;

  } catch (error) {
    console.error('Error creating batch payout:', error);
    return false;
  }
};

/**
 * Get instructor bank account for payout
 */
export const getInstructorBankAccount = async (instructorId: string) => {
  try {
    const { data, error } = await supabase
      .from('instructor_bank_accounts')
      .select('*')
      .eq('instructor_id', instructorId)
      .maybeSingle();
  if (!error && data) return data;
  console.error('Error getting instructor bank account:', error?.message);
  return null;
  } catch (error) {
    console.error('Error getting instructor bank account:', error);
    return null;
  }
};

/**
 * (Admin) List all instructor bank accounts
 */
export const listInstructorBankAccounts = async (): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('instructor_bank_accounts')
      .select('*')
      .order('updated_at', { ascending: false });

    if (!error && data) return data as any[];
    // No local fallback (admin listing), return empty array
    return [];
  } catch (error) {
    console.error('Error listing instructor bank accounts:', error);
    return [];
  }
};

/**
 * (Admin) Set bank verification status for an instructor
 * Note: DB-only. In production with RLS, prefer an Edge Function with service role
 * to update instructor_bank_accounts.is_verified securely.
 */
export const setBankVerificationStatus = async (
  instructorId: string,
  isVerified: boolean
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('instructor_bank_accounts')
      .update({ is_verified: isVerified })
      .eq('instructor_id', instructorId);
   if (!error) return true;
   console.error('DB update failed for setBankVerificationStatus:', error?.message);
   return false;
  } catch (error) {
    console.error('Error setting bank verification status:', error);
    return false;
  }
};
