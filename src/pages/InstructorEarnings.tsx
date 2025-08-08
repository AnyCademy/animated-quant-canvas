import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  DollarSign, 
  TrendingUp, 
  Calendar, 
  CreditCard,
  Download,
  Eye,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { getInstructorEarnings, getInstructorCoursesForEarnings } from '@/lib/revenueSplit';
import { createPayoutRequest } from '@/lib/payoutManager';
import BankAccountManagement from '@/components/BankAccountManagement';

interface EarningsData {
  total_earnings: number;
  pending_earnings: number;
  paid_earnings: number;
  this_month_earnings: number;
  transactions_count: number;
}

interface Course {
  id: string;
  title: string;
  price: number;
}

const InstructorEarnings: React.FC = () => {
  const { user } = useAuth();
  const [earnings, setEarnings] = useState<EarningsData>({
    total_earnings: 0,
    pending_earnings: 0,
    paid_earnings: 0,
    this_month_earnings: 0,
    transactions_count: 0
  });
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestingPayout, setRequestingPayout] = useState(false);
  const [hasBankAccount, setHasBankAccount] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadEarningsData();
      loadCoursesData();
      checkBankAccountStatus();
    }
  }, [user?.id]);

  const checkBankAccountStatus = () => {
    if (!user?.id) return;
    
    const bankAccountData = localStorage.getItem(`bank_account_${user.id}`);
    if (bankAccountData) {
      const bankAccount = JSON.parse(bankAccountData);
      setHasBankAccount(bankAccount.is_verified || false);
    } else {
      setHasBankAccount(false);
    }
  };

  const loadEarningsData = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const earningsData = await getInstructorEarnings(user.id);
      setEarnings(earningsData);
    } catch (error) {
      console.error('Error loading earnings data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCoursesData = async () => {
    if (!user?.id) return;
    
    try {
      const coursesData = await getInstructorCoursesForEarnings(user.id);
      setCourses(coursesData);
    } catch (error) {
      console.error('Error loading courses data:', error);
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleRequestPayout = async () => {
    if (!user?.id) {
      alert('User not authenticated');
      return;
    }

    // Ensure bank account exists and is verified
    const bankAccountData = localStorage.getItem(`bank_account_${user.id}`);
    if (!bankAccountData) {
      const goSetup = confirm('No bank account found. You need to set up a bank account in Payout Settings. Go there now?');
      if (goSetup) {
        const payoutTab = document.querySelector('[value="payout"]') as HTMLElement;
        payoutTab?.click();
      }
      return;
    }
    try {
      const bankAccount = JSON.parse(bankAccountData);
      if (!bankAccount.is_verified) {
        const goVerify = confirm('Your bank account is not verified yet. Please complete verification in Payout Settings. Go there now?');
        if (goVerify) {
          const payoutTab = document.querySelector('[value="payout"]') as HTMLElement;
          payoutTab?.click();
        }
        return;
      }
    } catch (e) {
      console.error('Invalid bank account data in storage', e);
      alert('Bank account data is invalid. Please re-enter your bank details in Payout Settings.');
      const payoutTab = document.querySelector('[value="payout"]') as HTMLElement;
      payoutTab?.click();
      return;
    }

    // Check minimum payout amount
    if (earnings.pending_earnings < 50000) {
      alert(`Minimum payout amount is ${formatCurrency(50000)}. You currently have ${formatCurrency(earnings.pending_earnings)} pending. You need ${formatCurrency(50000 - earnings.pending_earnings)} more to request a payout.`);
      return;
    }

    setRequestingPayout(true);
    try {
      console.log('Requesting payout for amount:', earnings.pending_earnings);
      
      const success = await createPayoutRequest(user.id, earnings.pending_earnings);
      
      if (success) {
        alert('Payout request submitted successfully! You will receive an email confirmation shortly.');
        // Reload earnings data to reflect the new status
        await loadEarningsData();
        checkBankAccountStatus();
      } else {
        alert('Failed to submit payout request. Please check your bank account settings or try again later.');
      }
      
    } catch (error) {
      console.error('Error requesting payout:', error);
      alert('An error occurred while submitting your payout request. Please try again.');
    } finally {
      setRequestingPayout(false);
    }
  };

  const mockTransactions = [
    {
      id: '1',
      course_title: 'Advanced React Development',
      amount: 450000,
      platform_fee: 50000,
      instructor_share: 400000,
      status: 'paid_out',
      date: '2024-01-15'
    },
    {
      id: '2',
      course_title: 'JavaScript Fundamentals',
      amount: 300000,
      platform_fee: 30000,
      instructor_share: 270000,
      status: 'pending',
      date: '2024-01-20'
    },
    {
      id: '3',
      course_title: 'Node.js Backend Development',
      amount: 500000,
      platform_fee: 50000,
      instructor_share: 450000,
      status: 'calculated',
      date: '2024-01-22'
    }
  ];

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Earnings Dashboard</h1>
        <p className="text-gray-600 mt-2">Track your course revenue and request payouts</p>
      </div>

      {/* Earnings Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(earnings.total_earnings)}</div>
            <p className="text-xs text-muted-foreground">
              From {earnings.transactions_count} sales
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Earnings</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(earnings.pending_earnings)}</div>
            <p className="text-xs text-muted-foreground">
              Available for payout
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(earnings.this_month_earnings)}</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid Out</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(earnings.paid_earnings)}</div>
            <p className="text-xs text-muted-foreground">
              Successfully transferred
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Payout Request Section */}
      {!hasBankAccount && (
        <Alert className="mb-6 bg-card">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>
              You need to set up a verified bank account before you can request payouts.
              {` `}
              You have {formatCurrency(earnings.pending_earnings)} pending earnings.
            </span>
            <Button 
              variant="outline"
              className="ml-4 border-quant-teal text-quant-teal hover:bg-quant-teal hover:text-quant-blue-dark"
              onClick={() => {
                // Scroll to payout settings tab
                const payoutTab = document.querySelector('[value="payout"]') as HTMLElement;
                payoutTab?.click();
              }}
            >
              Set Up Bank Account
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Alert className={`mb-6 ${earnings.pending_earnings >= 50000 ? 'bg-card' : ' bg-card'}`}>
        <CreditCard className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>
            You have {formatCurrency(earnings.pending_earnings)} available for payout.
            {earnings.pending_earnings < 50000 && (
              <> Minimum payout is {formatCurrency(50000)}.</>
            )}
          </span>
          <Button 
            variant="default"
            onClick={handleRequestPayout}
            disabled={requestingPayout}
            className="ml-4 bg-quant-teal text-quant-blue-dark hover:bg-quant-teal/80 disabled:opacity-60 disabled:cursor-not-allowed button-glow"
          >
            {requestingPayout ? 'Processing...' : 'Request Payout'}
          </Button>
        </AlertDescription>
      </Alert>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="courses">Course Performance</TabsTrigger>
          <TabsTrigger value="payout">Payout Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Earnings Progress */}
            <Card>
              <CardHeader>
                <CardTitle>Monthly Progress</CardTitle>
                <CardDescription>Your earnings progress this month</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm">Monthly Goal</span>
                      <span className="text-sm font-medium">{formatCurrency(1000000)}</span>
                    </div>
                    <Progress value={(earnings.this_month_earnings / 1000000) * 100} />
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{formatCurrency(earnings.this_month_earnings)}</p>
                    <p className="text-sm text-muted-foreground">
                      {Math.round((earnings.this_month_earnings / 1000000) * 100)}% of monthly goal
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
                <CardDescription>Your performance overview</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Average per Sale</span>
                    <span className="font-medium">
                      {formatCurrency(earnings.transactions_count > 0 ? earnings.total_earnings / earnings.transactions_count : 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Platform Fee Rate</span>
                    <span className="font-medium">10%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Your Share Rate</span>
                    <span className="font-medium">90%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Courses</span>
                    <span className="font-medium">{courses.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>Your latest course sales and earnings</CardDescription>
              </div>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockTransactions.map((transaction) => (
                  <div 
                    key={transaction.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <h4 className="font-medium">{transaction.course_title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {new Date(transaction.date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right mr-4">
                      <p className="font-medium">{formatCurrency(transaction.instructor_share)}</p>
                      <p className="text-sm text-muted-foreground">
                        Fee: {formatCurrency(transaction.platform_fee)}
                      </p>
                    </div>
                    <Badge 
                      variant={
                        transaction.status === 'paid_out' ? 'default' :
                        transaction.status === 'calculated' ? 'secondary' : 'outline'
                      }
                    >
                      {transaction.status.replace('_', ' ')}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="courses" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Course Performance</CardTitle>
              <CardDescription>Revenue breakdown by course</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {courses.map((course) => (
                  <div 
                    key={course.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <h4 className="font-medium">{course.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        Course Price: {formatCurrency(course.price)}
                      </p>
                    </div>
                    <div className="text-right mr-4">
                      <p className="font-medium">0 Sales</p>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(0)} earned
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                ))}
                {courses.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No courses found</p>
                    <Button className="mt-4">Create Your First Course</Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payout" className="space-y-6">
          <Card className="bg-transparent border-transparent shadow-none">
            <CardHeader>
              <CardTitle>Payout Settings</CardTitle>
              <CardDescription>
                Manage your bank account and payout preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BankAccountManagement />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default InstructorEarnings;
