import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DollarSign, TrendingUp, Users, Calendar, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PlatformEarning {
  date: string;
  total_transactions: number;
  total_revenue: number;
  total_platform_fees: number;
  total_instructor_payments: number;
  avg_fee_percentage: number;
}

interface InstructorEarning {
  instructor_id: string;
  course_id: string;
  course_title: string;
  total_sales: number;
  total_course_revenue: number;
  total_instructor_earnings: number;
  total_platform_fees_paid: number;
  avg_fee_percentage: number;
}

const PlatformEarningsDashboard: React.FC = () => {
  const [platformEarnings, setPlatformEarnings] = useState<PlatformEarning[]>([]);
  const [instructorEarnings, setInstructorEarnings] = useState<InstructorEarning[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState(30); // Days
  const { toast } = useToast();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
    }).format(price);
  };

  const fetchEarningsData = async () => {
    setLoading(true);
    try {
      // Fetch platform earnings
      const { data: platformData, error: platformError } = await supabase
        .from('platform_earnings_view' as any)
        .select('*')
        .gte('date', new Date(Date.now() - dateRange * 24 * 60 * 60 * 1000).toISOString())
        .order('date', { ascending: false })
        .limit(10);

      if (platformError) {
        console.error('Platform earnings error:', platformError);
        toast({
          title: "Error",
          description: "Could not load platform earnings. The view might not exist yet.",
          variant: "destructive",
        });
      } else {
        setPlatformEarnings((platformData as any) || []);
      }

      // Fetch instructor earnings
      const { data: instructorData, error: instructorError } = await supabase
        .from('instructor_earnings_view' as any)
        .select('*')
        .order('total_instructor_earnings', { ascending: false })
        .limit(10);

      if (instructorError) {
        console.error('Instructor earnings error:', instructorError);
        toast({
          title: "Error",
          description: "Could not load instructor earnings. The view might not exist yet.",
          variant: "destructive",
        });
      } else {
        setInstructorEarnings((instructorData as any) || []);
      }

    } catch (error) {
      console.error('Error fetching earnings:', error);
      toast({
        title: "Error",
        description: "Failed to load earnings data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEarningsData();
  }, [dateRange]);

  // Calculate summary statistics
  const totalPlatformRevenue = platformEarnings.reduce((sum, earning) => sum + earning.total_platform_fees, 0);
  const totalInstructorPayments = platformEarnings.reduce((sum, earning) => sum + earning.total_instructor_payments, 0);
  const totalTransactions = platformEarnings.reduce((sum, earning) => sum + earning.total_transactions, 0);
  const avgFeePercentage = platformEarnings.length > 0 
    ? platformEarnings.reduce((sum, earning) => sum + earning.avg_fee_percentage, 0) / platformEarnings.length
    : 0;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Platform Earnings Dashboard</h1>
          <p className="text-gray-600">Track revenue splits and platform performance</p>
        </div>
        <div className="flex items-center gap-4">
          <select 
            value={dateRange} 
            onChange={(e) => setDateRange(Number(e.target.value))}
            className="border rounded px-3 py-2"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
          <Button 
            onClick={fetchEarningsData}
            disabled={loading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Platform Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(totalPlatformRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              Last {dateRange} days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Instructor Payments</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(totalInstructorPayments)}</div>
            <p className="text-xs text-muted-foreground">
              Paid to instructors
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTransactions}</div>
            <p className="text-xs text-muted-foreground">
              Split payment transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Fee Rate</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgFeePercentage.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Average platform fee
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Platform Earnings Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Platform Earnings</CardTitle>
          <CardDescription>Revenue breakdown by date</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading earnings data...</div>
          ) : platformEarnings.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No split payment data found. Make sure the database migration has been applied and some split payments have been processed.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Date</th>
                    <th className="text-right p-2">Transactions</th>
                    <th className="text-right p-2">Total Revenue</th>
                    <th className="text-right p-2">Platform Fees</th>
                    <th className="text-right p-2">Instructor Share</th>
                    <th className="text-right p-2">Fee %</th>
                  </tr>
                </thead>
                <tbody>
                  {platformEarnings.map((earning) => (
                    <tr key={earning.date} className="border-b hover:bg-gray-50">
                      <td className="p-2">{new Date(earning.date).toLocaleDateString()}</td>
                      <td className="text-right p-2">{earning.total_transactions}</td>
                      <td className="text-right p-2">{formatPrice(earning.total_revenue)}</td>
                      <td className="text-right p-2 text-green-600 font-medium">
                        {formatPrice(earning.total_platform_fees)}
                      </td>
                      <td className="text-right p-2">{formatPrice(earning.total_instructor_payments)}</td>
                      <td className="text-right p-2">{earning.avg_fee_percentage.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Instructor Earnings */}
      <Card>
        <CardHeader>
          <CardTitle>Top Instructor Earnings</CardTitle>
          <CardDescription>Highest earning instructors by course</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading instructor data...</div>
          ) : instructorEarnings.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No instructor earnings data found.
            </div>
          ) : (
            <div className="space-y-4">
              {instructorEarnings.map((earning) => (
                <div key={`${earning.instructor_id}-${earning.course_id}`} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">{earning.course_title}</h4>
                    <p className="text-sm text-gray-500">
                      {earning.total_sales} sales • {earning.avg_fee_percentage.toFixed(1)}% platform fee
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-green-600">
                      {formatPrice(earning.total_instructor_earnings)}
                    </div>
                    <div className="text-sm text-gray-500">
                      Platform: {formatPrice(earning.total_platform_fees_paid)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Setup Notice */}
      {platformEarnings.length === 0 && !loading && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-800">Setup Required</CardTitle>
            <CardDescription className="text-orange-600">
              To see split payment data, make sure you have:
            </CardDescription>
          </CardHeader>
          <CardContent className="text-orange-700">
            <ul className="list-disc list-inside space-y-1">
              <li>Applied the database migration (database_migration_split_payment.sql)</li>
              <li>Configured platform environment variables</li>
              <li>Processed at least one split payment transaction</li>
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PlatformEarningsDashboard;
