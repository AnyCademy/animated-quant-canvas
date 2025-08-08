import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CreditCard, Shield, Clock, Calculator, TrendingUp } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  createPlatformPayment,
  generateOrderId,
  validatePlatformPaymentSetup,
  type MidtransPaymentData
} from '@/lib/platformPayment';
import { 
  calculateRevenueSplit,
  storeRevenueSplit
} from '@/lib/revenueSplitTemp';

interface PlatformPaymentPageProps {
  course: {
    id: string;
    title: string;
    description: string | null;
    price: number;
    thumbnail_url: string | null;
    instructor_id: string;
  };
  onPaymentSuccess: () => void;
  onPaymentCancel: () => void;
}

const PlatformPaymentPage: React.FC<PlatformPaymentPageProps> = ({ 
  course, 
  onPaymentSuccess, 
  onPaymentCancel 
}) => {
  const [processing, setProcessing] = useState(false);
  const [validatingSetup, setValidatingSetup] = useState(true);
  const [setupValid, setSetupValid] = useState(false);
  const [setupIssues, setSetupIssues] = useState<string[]>([]);
  const [revenueSplit, setRevenueSplit] = useState<any>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    validateSetup();
    calculateSplit();
  }, []);

  const validateSetup = async () => {
    try {
      setValidatingSetup(true);
      const validation = await validatePlatformPaymentSetup();
      setSetupValid(validation.isValid);
      setSetupIssues(validation.issues);
    } catch (error) {
      console.error('Error validating payment setup:', error);
      setSetupValid(false);
      setSetupIssues(['Error validating payment configuration']);
    } finally {
      setValidatingSetup(false);
    }
  };

  const calculateSplit = async () => {
    try {
      const split = await calculateRevenueSplit(course.price, course.instructor_id);
      setRevenueSplit(split);
    } catch (error) {
      console.error('Error calculating revenue split:', error);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handlePayment = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to make a payment",
        variant: "destructive",
      });
      return;
    }

    if (!setupValid) {
      toast({
        title: "Payment Unavailable",
        description: "Payment system is not properly configured. Please contact support.",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);

    try {
      // Get user profile for payment details
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      // Generate order ID
      const orderId = generateOrderId();

      // Prepare payment data for platform Midtrans
      const paymentData: MidtransPaymentData = {
        orderId,
        amount: course.price,
        customerDetails: {
          first_name: profile?.full_name?.split(' ')[0] || 'Anonymous',
          last_name: profile?.full_name?.split(' ').slice(1).join(' ') || 'User',
          email: profile?.email || user.email || '',
        },
        itemDetails: [{
          id: course.id,
          price: course.price,
          quantity: 1,
          name: course.title,
        }],
        courseId: course.id,
        instructorId: course.instructor_id
      };

      console.log('Creating platform payment...', paymentData);

      // Create payment using platform account
      const snapResponse = await createPlatformPayment(paymentData);

      if (!snapResponse) {
        throw new Error('Failed to create payment token');
      }

      // Load Midtrans Snap script
      await loadSnapScript();

      // Open payment modal
      if (window.snap) {
        window.snap.pay(snapResponse.token, {
          onSuccess: async (result: any) => {
            console.log('Payment success:', result);
            
            // Process revenue split in the background
            if (revenueSplit) {
              await storeRevenueSplit({
                payment_id: orderId,
                instructor_id: course.instructor_id,
                course_id: course.id,
                total_amount: revenueSplit.totalAmount,
                platform_fee_percentage: revenueSplit.feePercentage,
                platform_fee_amount: revenueSplit.platformFee,
                instructor_share: revenueSplit.instructorShare,
                status: 'calculated'
              });
            }

            toast({
              title: "Payment Successful!",
              description: "You have been enrolled in the course.",
            });
            onPaymentSuccess();
          },
          onPending: (result: any) => {
            console.log('Payment pending:', result);
            toast({
              title: "Payment Pending",
              description: "Your payment is being processed. You will be notified once confirmed.",
            });
          },
          onError: (result: any) => {
            console.log('Payment error:', result);
            toast({
              title: "Payment Failed",
              description: "There was an error processing your payment. Please try again.",
              variant: "destructive",
            });
          },
          onClose: () => {
            console.log('Payment modal closed');
            onPaymentCancel();
          }
        });
      } else {
        throw new Error('Midtrans Snap not loaded');
      }

    } catch (error) {
      console.error('Error processing payment:', error);
      toast({
        title: "Payment Error",
        description: error instanceof Error ? error.message : "An error occurred while processing your payment",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const loadSnapScript = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (document.getElementById('midtrans-script')) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.id = 'midtrans-script';
      script.src = 'https://app.sandbox.midtrans.com/snap/snap.js';
      script.setAttribute('data-client-key', 'SB-Mid-client-PLATFORM-KEY'); // This will be from platform settings
      
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Midtrans script'));
      
      document.head.appendChild(script);
    });
  };

  if (validatingSetup) {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Complete Your Purchase</h1>
        <p className="text-gray-600 mt-2">Review your order and complete the payment</p>
      </div>

      {!setupValid && (
        <Alert className="mb-6" variant="destructive">
          <AlertDescription>
            <div>
              <p className="font-medium mb-2">Payment system configuration issues:</p>
              <ul className="list-disc list-inside space-y-1">
                {setupIssues.map((issue, index) => (
                  <li key={index} className="text-sm">{issue}</li>
                ))}
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Course Information */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-start space-x-4">
            {course.thumbnail_url && (
              <img 
                src={course.thumbnail_url} 
                alt={course.title}
                className="w-20 h-20 object-cover rounded-lg"
              />
            )}
            <div className="flex-1">
              <CardTitle className="text-xl">{course.title}</CardTitle>
              <CardDescription className="mt-2">
                {course.description}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Payment Details */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Payment Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <span>Course Price</span>
            <span className="font-medium">{formatPrice(course.price)}</span>
          </div>
          
          {revenueSplit && (
            <>
              <Separator />
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Platform Fee ({revenueSplit.feePercentage}%)</span>
                  <span>{formatPrice(revenueSplit.platformFee)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Instructor Share</span>
                  <span>{formatPrice(revenueSplit.instructorShare)}</span>
                </div>
              </div>
              <Separator />
            </>
          )}
          
          <div className="flex justify-between items-center text-lg font-bold">
            <span>Total</span>
            <span>{formatPrice(course.price)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Revenue Split Information */}
      {revenueSplit && (
        <Alert className="mb-6">
          <TrendingUp className="h-4 w-4" />
          <AlertDescription>
            <p className="font-medium mb-1">Revenue Distribution</p>
            <p className="text-sm">
              {revenueSplit.feePercentage}% platform fee helps us maintain and improve the platform, 
              while {100 - revenueSplit.feePercentage}% goes directly to the instructor.
            </p>
          </AlertDescription>
        </Alert>
      )}

      {/* Security Information */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Shield className="h-8 w-8 text-green-500" />
            <div>
              <h4 className="font-medium">Secure Payment</h4>
              <p className="text-sm text-gray-600">
                Your payment is processed securely through Midtrans with SSL encryption
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Button */}
      <Card>
        <CardFooter className="pt-6">
          <div className="w-full space-y-4">
            <Button 
              onClick={handlePayment}
              disabled={processing || !setupValid}
              className="w-full"
              size="lg"
            >
              <CreditCard className="h-5 w-5 mr-2" />
              {processing ? (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 animate-spin" />
                  Processing...
                </div>
              ) : (
                `Pay ${formatPrice(course.price)}`
              )}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={onPaymentCancel}
              className="w-full"
              disabled={processing}
            >
              Cancel
            </Button>
          </div>
        </CardFooter>
      </Card>

      {/* Payment Methods Info */}
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600 mb-2">Supported Payment Methods:</p>
        <div className="flex justify-center gap-4">
          <Badge variant="outline">Credit Card</Badge>
          <Badge variant="outline">Bank Transfer</Badge>
          <Badge variant="outline">E-Wallet</Badge>
          <Badge variant="outline">Virtual Account</Badge>
        </div>
      </div>
    </div>
  );
};

export default PlatformPaymentPage;
