import { supabase } from '@/integrations/supabase/client';
import { getRevenueSplitConfig } from './platformSettings';

export interface SplitResult {
  totalAmount: number;
  platformFee: number;
  instructorShare: number;
  feePercentage: number;
}

export interface RevenueSplitRecord {
  id?: string;
  payment_id: string;
  instructor_id: string;
  course_id: string;
  total_amount: number;
  platform_fee_percentage: number;
  platform_fee_amount: number;
  instructor_share: number;
  status: string; // Changed from union type to string to match database
  created_at?: string;
  updated_at?: string;
}

export interface InstructorEarnings {
  total_earnings: number;
  pending_earnings: number;
  paid_earnings: number;
  this_month_earnings: number;
  transactions_count: number;
}

/**
 * Calculate revenue split for a payment
 */
export const calculateRevenueSplit = async (
  coursePrice: number,
  instructorId: string,
  customFeePercentage?: number
): Promise<SplitResult | null> => {
  try {
    console.log(`Calculating revenue split for amount: ${coursePrice}, instructor: ${instructorId}`);

    // Get revenue split configuration
    const splitConfig = await getRevenueSplitConfig();
    if (!splitConfig) {
      console.error('Revenue split configuration not found');
      return null;
    }

    let feePercentage: number;

    // Use custom percentage if provided
    if (customFeePercentage !== undefined) {
      feePercentage = customFeePercentage;
    } else {
      // Find applicable fee tier
      const applicableTier = splitConfig.fee_tiers.find(tier => 
        coursePrice >= tier.min_amount && coursePrice <= tier.max_amount
      );

      if (applicableTier) {
        feePercentage = applicableTier.fee_percentage;
      } else {
        // Fallback to default percentage
        feePercentage = splitConfig.default_platform_fee_percentage;
      }
    }

    // Calculate amounts
    const platformFee = Math.round(coursePrice * feePercentage / 100);
    const instructorShare = coursePrice - platformFee;

    const result: SplitResult = {
      totalAmount: coursePrice,
      platformFee,
      instructorShare,
      feePercentage
    };

    console.log('Revenue split calculated:', result);
    return result;

  } catch (error) {
    console.error('Error calculating revenue split:', error);
    return null;
  }
};

/**
 * Store revenue split record in database
 */
export const storeRevenueSplit = async (splitData: RevenueSplitRecord): Promise<boolean> => {
  try {
    console.log('Storing revenue split record:', splitData.payment_id);

    const { error } = await supabase
      .from('revenue_splits')
      .insert({
        payment_id: splitData.payment_id,
        instructor_id: splitData.instructor_id,
        course_id: splitData.course_id,
        total_amount: splitData.total_amount,
        platform_fee_percentage: splitData.platform_fee_percentage,
        platform_fee_amount: splitData.platform_fee_amount,
        instructor_share: splitData.instructor_share,
        status: splitData.status || 'calculated'
      });

    if (error) {
      console.error('Error storing revenue split:', error);
      return false;
    }

    console.log('Revenue split stored successfully');
    return true;
  } catch (error) {
    console.error('Exception storing revenue split:', error);
    return false;
  }
};

/**
 * Get instructor revenue splits
 */
export const getInstructorRevenueSplits = async (
  instructorId: string,
  status?: 'pending' | 'calculated' | 'paid_out'
): Promise<RevenueSplitRecord[]> => {
  try {
    let query = supabase
      .from('revenue_splits')
      .select(`
        *,
        payments!revenue_splits_payment_id_fkey(
          midtrans_order_id,
          created_at
        ),
        courses!revenue_splits_course_id_fkey(
          title
        )
      `)
      .eq('instructor_id', instructorId);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching instructor revenue splits:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Exception fetching instructor revenue splits:', error);
    return [];
  }
};

/**
 * Get instructor earnings summary
 */
export const getInstructorEarnings = async (instructorId: string): Promise<InstructorEarnings> => {
  try {
    console.log('Fetching instructor earnings for:', instructorId);

    // Get all revenue splits for instructor
    const { data: splits, error } = await supabase
      .from('revenue_splits')
      .select('instructor_share, status, created_at')
      .eq('instructor_id', instructorId);

    if (error) {
      console.error('Error fetching instructor earnings:', error);
      return {
        total_earnings: 0,
        pending_earnings: 0,
        paid_earnings: 0,
        this_month_earnings: 0,
        transactions_count: 0
      };
    }

    const splits_data = splits || [];
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    // Calculate earnings
    const totalEarnings = splits_data.reduce((sum, split) => sum + split.instructor_share, 0);
    const pendingEarnings = splits_data
      .filter(split => split.status === 'calculated' || split.status === 'pending')
      .reduce((sum, split) => sum + split.instructor_share, 0);
    const paidEarnings = splits_data
      .filter(split => split.status === 'paid_out')
      .reduce((sum, split) => sum + split.instructor_share, 0);
    
    const thisMonthEarnings = splits_data
      .filter(split => {
        const splitDate = new Date(split.created_at);
        return splitDate.getMonth() === currentMonth && splitDate.getFullYear() === currentYear;
      })
      .reduce((sum, split) => sum + split.instructor_share, 0);

    const result: InstructorEarnings = {
      total_earnings: totalEarnings,
      pending_earnings: pendingEarnings,
      paid_earnings: paidEarnings,
      this_month_earnings: thisMonthEarnings,
      transactions_count: splits_data.length
    };

    console.log('Instructor earnings calculated:', result);
    return result;

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

/**
 * Get platform revenue summary
 */
export const getPlatformRevenue = async (): Promise<{
  total_platform_revenue: number;
  total_instructor_payments: number;
  monthly_growth: number;
  top_earning_instructors: Array<{
    instructor_id: string;
    total_earnings: number;
    transactions_count: number;
  }>;
}> => {
  try {
    console.log('Fetching platform revenue summary');

    // Get all revenue splits
    const { data: splits, error } = await supabase
      .from('revenue_splits')
      .select('platform_fee_amount, instructor_share, instructor_id, created_at');

    if (error) {
      console.error('Error fetching platform revenue:', error);
      return {
        total_platform_revenue: 0,
        total_instructor_payments: 0,
        monthly_growth: 0,
        top_earning_instructors: []
      };
    }

    const splits_data = splits || [];
    
    // Calculate totals
    const totalPlatformRevenue = splits_data.reduce((sum, split) => sum + split.platform_fee_amount, 0);
    const totalInstructorPayments = splits_data.reduce((sum, split) => sum + split.instructor_share, 0);

    // Calculate monthly growth (compare current month to previous month)
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const currentMonthRevenue = splits_data
      .filter(split => {
        const splitDate = new Date(split.created_at);
        return splitDate.getMonth() === currentMonth && splitDate.getFullYear() === currentYear;
      })
      .reduce((sum, split) => sum + split.platform_fee_amount, 0);

    const previousMonthRevenue = splits_data
      .filter(split => {
        const splitDate = new Date(split.created_at);
        return splitDate.getMonth() === previousMonth && splitDate.getFullYear() === previousYear;
      })
      .reduce((sum, split) => sum + split.platform_fee_amount, 0);

    const monthlyGrowth = previousMonthRevenue > 0 
      ? ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100 
      : 0;

    // Calculate top earning instructors
    const instructorEarnings = splits_data.reduce((acc, split) => {
      if (!acc[split.instructor_id]) {
        acc[split.instructor_id] = {
          total_earnings: 0,
          transactions_count: 0
        };
      }
      acc[split.instructor_id].total_earnings += split.instructor_share;
      acc[split.instructor_id].transactions_count += 1;
      return acc;
    }, {} as Record<string, { total_earnings: number; transactions_count: number }>);

    const topEarningInstructors = Object.entries(instructorEarnings)
      .map(([instructor_id, data]) => ({
        instructor_id,
        total_earnings: data.total_earnings,
        transactions_count: data.transactions_count
      }))
      .sort((a, b) => b.total_earnings - a.total_earnings)
      .slice(0, 10);

    return {
      total_platform_revenue: totalPlatformRevenue,
      total_instructor_payments: totalInstructorPayments,
      monthly_growth: monthlyGrowth,
      top_earning_instructors: topEarningInstructors
    };

  } catch (error) {
    console.error('Exception fetching platform revenue:', error);
    return {
      total_platform_revenue: 0,
      total_instructor_payments: 0,
      monthly_growth: 0,
      top_earning_instructors: []
    };
  }
};

/**
 * Update revenue split status
 */
export const updateRevenueSplitStatus = async (
  revenueSplitId: string, 
  status: 'pending' | 'calculated' | 'paid_out'
): Promise<boolean> => {
  try {
    console.log(`Updating revenue split ${revenueSplitId} status to ${status}`);

    const { error } = await supabase
      .from('revenue_splits')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', revenueSplitId);

    if (error) {
      console.error('Error updating revenue split status:', error);
      return false;
    }

    console.log('Revenue split status updated successfully');
    return true;
  } catch (error) {
    console.error('Exception updating revenue split status:', error);
    return false;
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
