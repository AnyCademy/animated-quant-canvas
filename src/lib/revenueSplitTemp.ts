import { supabase } from '@/integrations/supabase/client';

// Temporary interfaces that work with current database structure
export interface TempRevenueSplit {
  payment_id: string;
  instructor_id: string;
  course_id: string;
  total_amount: number;
  platform_fee_percentage: number;
  platform_fee_amount: number;
  instructor_share: number;
  status: 'pending' | 'calculated' | 'paid_out';
}

export interface InstructorEarnings {
  total_earnings: number;
  pending_earnings: number;
  paid_earnings: number;
  this_month_earnings: number;
  transactions_count: number;
}

// Mock data for development - will be replaced with real database queries
export const calculateRevenueSplit = async (
  coursePrice: number,
  instructorId: string,
  customFeePercentage?: number
): Promise<{
  totalAmount: number;
  platformFee: number;
  instructorShare: number;
  feePercentage: number;
} | null> => {
  try {
    console.log(`Calculating revenue split for amount: ${coursePrice}, instructor: ${instructorId}`);

    // Default 10% platform fee
    const feePercentage = customFeePercentage || 10;
    const platformFee = Math.round(coursePrice * feePercentage / 100);
    const instructorShare = coursePrice - platformFee;

    return {
      totalAmount: coursePrice,
      platformFee,
      instructorShare,
      feePercentage
    };

  } catch (error) {
    console.error('Error calculating revenue split:', error);
    return null;
  }
};

// Temporary storage until database tables are created
export const storeRevenueSplit = async (splitData: TempRevenueSplit): Promise<boolean> => {
  try {
    console.log('Storing revenue split record (temporary):', splitData.payment_id);
    
    // For now, store in localStorage as a temporary solution
    const existingSplits = JSON.parse(localStorage.getItem('temp_revenue_splits') || '[]');
    existingSplits.push({
      ...splitData,
      id: Date.now().toString(),
      created_at: new Date().toISOString()
    });
    localStorage.setItem('temp_revenue_splits', JSON.stringify(existingSplits));

    console.log('Revenue split stored successfully (temporary)');
    return true;
  } catch (error) {
    console.error('Exception storing revenue split:', error);
    return false;
  }
};

// Mock instructor earnings data
export const getInstructorEarnings = async (instructorId: string): Promise<InstructorEarnings> => {
  try {
    console.log('Fetching instructor earnings for:', instructorId);

    // Get stored revenue splits from localStorage
    const storedSplits = JSON.parse(localStorage.getItem('temp_revenue_splits') || '[]');
    const instructorSplits = storedSplits.filter((split: any) => split.instructor_id === instructorId);

    // Calculate mock earnings
    const totalEarnings = instructorSplits.reduce((sum: number, split: any) => sum + split.instructor_share, 0);
    const pendingEarnings = instructorSplits
      .filter((split: any) => split.status === 'calculated' || split.status === 'pending')
      .reduce((sum: number, split: any) => sum + split.instructor_share, 0);
    
    const paidEarnings = totalEarnings - pendingEarnings;
    
    // Mock this month earnings (30% of total for demo)
    const thisMonthEarnings = Math.round(totalEarnings * 0.3);

    return {
      total_earnings: totalEarnings,
      pending_earnings: pendingEarnings,
      paid_earnings: paidEarnings,
      this_month_earnings: thisMonthEarnings,
      transactions_count: instructorSplits.length
    };

  } catch (error) {
    console.error('Exception fetching instructor earnings:', error);
    return {
      total_earnings: 0,
      pending_earnings: 0,
      paid_earnings: 0,
      this_month_earnings: 0,
      transactions_count: 0
    };
  }
};

// Get instructor courses for earnings calculation
export const getInstructorCoursesForEarnings = async (instructorId: string) => {
  try {
    const { data: courses, error } = await supabase
      .from('courses')
      .select('id, title, price')
      .eq('instructor_id', instructorId);

    if (error) {
      console.error('Error fetching instructor courses:', error);
      return [];
    }

    return courses || [];
  } catch (error) {
    console.error('Exception fetching instructor courses:', error);
    return [];
  }
};
