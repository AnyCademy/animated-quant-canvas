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

    // For now, store in localStorage until database tables are created
    const existingRequests = JSON.parse(localStorage.getItem('payout_requests') || '[]');
    
    // Check if instructor already has a pending request
    const existingRequest = existingRequests.find(
      (req: any) => req.instructor_id === instructorId && req.status === 'pending'
    );

    if (existingRequest) {
      console.log('Instructor already has a pending payout request');
      return false;
    }

    // Get bank account info
    const bankAccountData = localStorage.getItem(`bank_account_${instructorId}`);
    if (!bankAccountData) {
      console.log('No bank account found for instructor');
      return false;
    }

    const bankAccount = JSON.parse(bankAccountData);
    if (!bankAccount.is_verified) {
      console.log('Bank account not verified');
      return false;
    }

    // Create payout request
    const payoutRequest: PayoutBatch = {
      id: Date.now().toString(),
      instructor_id: instructorId,
      total_amount: requestedAmount,
      transaction_count: 1, // Will be calculated from revenue splits
      payout_method: 'manual_transfer',
      status: 'pending',
      scheduled_date: new Date().toISOString(),
      notes: `Payout request for ${requestedAmount}`,
      created_at: new Date().toISOString()
    };

    existingRequests.push(payoutRequest);
    localStorage.setItem('payout_requests', JSON.stringify(existingRequests));

    console.log('Payout request created successfully');
    return true;

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
    // Get from localStorage for now
    const payoutRequests = JSON.parse(localStorage.getItem('payout_requests') || '[]');
    return payoutRequests.filter((payout: PayoutBatch) => payout.instructor_id === instructorId);
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
    const payoutRequests = JSON.parse(localStorage.getItem('payout_requests') || '[]');
    return payoutRequests.filter((payout: PayoutBatch) => payout.status === 'pending');
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
    const payoutRequests = JSON.parse(localStorage.getItem('payout_requests') || '[]');
    
    const pendingRequests = payoutRequests.filter((req: PayoutBatch) => req.status === 'pending');
    const processingBatches = payoutRequests.filter((req: PayoutBatch) => req.status === 'processing');
    
    // Calculate this month completed
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const completedThisMonth = payoutRequests.filter((req: PayoutBatch) => {
      if (req.status !== 'completed' || !req.processed_at) return false;
      const processedDate = new Date(req.processed_at);
      return processedDate.getMonth() === currentMonth && processedDate.getFullYear() === currentYear;
    });

    // Get unique instructors awaiting payout
    const instructorsAwaiting = new Set(pendingRequests.map((req: PayoutBatch) => req.instructor_id));

    return {
      pending_requests: pendingRequests.length,
      total_pending_amount: pendingRequests.reduce((sum: number, req: PayoutBatch) => sum + req.total_amount, 0),
      processing_batches: processingBatches.length,
      completed_this_month: completedThisMonth.length,
      instructors_awaiting_payout: instructorsAwaiting.size
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

    const payoutRequests = JSON.parse(localStorage.getItem('payout_requests') || '[]');
    const requestIndex = payoutRequests.findIndex((req: PayoutBatch) => req.id === payoutId);
    
    if (requestIndex === -1) {
      console.log('Payout request not found');
      return false;
    }

    // Update status to processing
    payoutRequests[requestIndex] = {
      ...payoutRequests[requestIndex],
      status: 'processing',
      batch_reference: batchReference || `BATCH-${Date.now()}`,
      notes: notes || payoutRequests[requestIndex].notes,
      processed_at: new Date().toISOString()
    };

    localStorage.setItem('payout_requests', JSON.stringify(payoutRequests));

    console.log('Payout request approved and set to processing');
    return true;

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

    const payoutRequests = JSON.parse(localStorage.getItem('payout_requests') || '[]');
    const requestIndex = payoutRequests.findIndex((req: PayoutBatch) => req.id === payoutId);
    
    if (requestIndex === -1) {
      console.log('Payout request not found');
      return false;
    }

    // Update status to completed
    payoutRequests[requestIndex] = {
      ...payoutRequests[requestIndex],
      status: 'completed',
      batch_reference: transactionReference || payoutRequests[requestIndex].batch_reference,
      processed_at: new Date().toISOString()
    };

    localStorage.setItem('payout_requests', JSON.stringify(payoutRequests));

    console.log('Payout request completed');
    return true;

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

    const payoutRequests = JSON.parse(localStorage.getItem('payout_requests') || '[]');
    const requestIndex = payoutRequests.findIndex((req: PayoutBatch) => req.id === payoutId);
    
    if (requestIndex === -1) {
      console.log('Payout request not found');
      return false;
    }

    // Update status to cancelled
    payoutRequests[requestIndex] = {
      ...payoutRequests[requestIndex],
      status: 'cancelled',
      notes: reason || 'Cancelled by admin'
    };

    localStorage.setItem('payout_requests', JSON.stringify(payoutRequests));

    console.log('Payout request cancelled');
    return true;

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

    const payoutRequests = JSON.parse(localStorage.getItem('payout_requests') || '[]');
    const currentTime = new Date().toISOString();
    const batchReference = `BATCH-${Date.now()}`;

    // Update all pending requests for specified instructors
    let updatedCount = 0;
    payoutRequests.forEach((request: PayoutBatch, index: number) => {
      if (
        instructorIds.includes(request.instructor_id) && 
        request.status === 'pending'
      ) {
        payoutRequests[index] = {
          ...request,
          status: 'processing',
          payout_method: payoutMethod,
          batch_reference: batchReference,
          processed_at: currentTime
        };
        updatedCount++;
      }
    });

    localStorage.setItem('payout_requests', JSON.stringify(payoutRequests));

    console.log(`Batch payout created for ${updatedCount} requests`);
    return updatedCount > 0;

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
    const bankAccountData = localStorage.getItem(`bank_account_${instructorId}`);
    return bankAccountData ? JSON.parse(bankAccountData) : null;
  } catch (error) {
    console.error('Error getting instructor bank account:', error);
    return null;
  }
};
