import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CreditCard, Shield, Clock, Info, Users, DollarSign } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  loadSnapScript, 
  openSnapPayment,
  getInstructorPaymentSettings,
  InstructorPaymentSettings
} from '@/lib/midtrans';
import { 
  createSplitPaymentToken, 
  saveSplitPaymentRecord, 
  processSplitPaymentSettlement,
  calculateSplitPaymentBreakdown,
  SplitPaymentData 
} from '@/lib/split-payment';
import { 
  DEFAULT_PLATFORM_SETTINGS, 
  shouldEnableSplitPayment 
} from '@/lib/platform-settings';
import { logPaymentDiagnostics } from '@/utils/paymentDiagnostics';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface SplitPaymentPageProps {
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

const SplitPaymentPage: React.FC<SplitPaymentPageProps> = ({ 
  course, 
  onPaymentSuccess, 
  onPaymentCancel 
}) => {
  const [processing, setProcessing] = useState(false);
  const [showSplitDetails, setShowSplitDetails] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
    }).format(price);
  };

  // Calculate split payment breakdown for display
  // Ensure price is a number for proper calculation
  const coursePrice = typeof course.price === 'string' ? parseFloat(course.price) : course.price;
  const splitBreakdown = calculateSplitPaymentBreakdown(coursePrice);

  const handlePayment = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to make a payment",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);

    try {
      // Run diagnostic check first
      await logPaymentDiagnostics(course.instructor_id);
      
      // Get instructor's payment settings
      const instructorSettings = await getInstructorPaymentSettings(course.instructor_id);
      
      if (!instructorSettings) {
        toast({
          title: "Payment Unavailable",
          description: "This instructor hasn't configured their payment settings yet or the payment gateway is not active. Please contact the instructor.",
          variant: "destructive",
        });
        setProcessing(false);
        return;
      }

      // Additional validation for payment settings
      if (!instructorSettings.midtrans_client_key || !instructorSettings.midtrans_server_key) {
        toast({
          title: "Payment Configuration Error",
          description: "The instructor's payment configuration is incomplete. Please contact the instructor.",
          variant: "destructive",
        });
        setProcessing(false);
        return;
      }

      // Check if split payment should be enabled
      // Ensure price is a number for proper comparison
      const coursePrice = typeof course.price === 'string' ? parseFloat(course.price) : course.price;
      const enableSplit = shouldEnableSplitPayment(coursePrice, instructorSettings);
      
      console.log('Payment configuration:', {
        hasInstructorSettings: !!instructorSettings,
        splitPaymentEnabled: enableSplit,
        coursePrice: coursePrice,
        coursePriceType: typeof coursePrice,
        originalPrice: course.price,
        originalPriceType: typeof course.price,
        platformSettings: DEFAULT_PLATFORM_SETTINGS
      });

      // Generate order ID
      const timestamp = Date.now().toString();
      const courseIdShort = course.id.substring(0, 8);
      const userIdShort = user.id.substring(0, 8);
      const orderId = `ord-${courseIdShort}-${userIdShort}-${timestamp}`;

      // Get user profile for payment details
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      // Prepare split payment data
      const splitPaymentData: SplitPaymentData = {
        orderId,
        amount: coursePrice, // Use the corrected numeric price
        customerDetails: {
          first_name: profile?.full_name?.split(' ')[0] || 'Anonymous',
          last_name: profile?.full_name?.split(' ').slice(1).join(' ') || 'User',
          email: profile?.email || user.email || '',
        },
        itemDetails: [{
          id: course.id,
          price: coursePrice, // Use the corrected numeric price
          quantity: 1,
          name: course.title,
        }],
        instructorSettings,
        platformSettings: DEFAULT_PLATFORM_SETTINGS,
        enableSplit,
      };

      // Save payment record to database
      await saveSplitPaymentRecord(splitPaymentData, orderId, user.id, course.id);

      // Determine which settings to use for Snap script loading
      const snapSettings: InstructorPaymentSettings = enableSplit ? {
        midtrans_client_key: DEFAULT_PLATFORM_SETTINGS.admin_midtrans_client_key,
        midtrans_server_key: DEFAULT_PLATFORM_SETTINGS.admin_midtrans_server_key,
        is_production: DEFAULT_PLATFORM_SETTINGS.admin_midtrans_is_production,
        is_active: true,
      } : instructorSettings;

      // Load Snap script
      await loadSnapScript(snapSettings);

      // Create split payment token
      const snapToken = await createSplitPaymentToken(splitPaymentData);

      // Open payment modal
      const result = await openSnapPayment(snapToken);

      // Handle payment result
      if (result.transaction_status === 'settlement' || result.transaction_status === 'capture') {
        await processSplitPaymentSettlement(
          orderId, 
          result.transaction_id,
          result.payment_type
        );
        
        toast({
          title: "Payment Successful!",
          description: enableSplit 
            ? "Payment processed with platform fee split. You have been enrolled in the course."
            : "You have been enrolled in the course.",
        });
        
        onPaymentSuccess();
      } else if (result.transaction_status === 'pending') {
        // Update to pending status
        await supabase
          .from('payments')
          .update({
            status: 'pending' as const,
            midtrans_transaction_id: result.transaction_id,
            payment_method: result.payment_type,
            updated_at: new Date().toISOString(),
          })
          .eq('midtrans_order_id', orderId);
        
        toast({
          title: "Payment Pending",
          description: "Your payment is being processed. You will be notified once it's complete.",
        });
      }

    } catch (error) {
      console.error('Payment error:', error);
      
      toast({
        title: "Payment Failed",
        description: error instanceof Error ? error.message : "Something went wrong with your payment",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const willUseSplitPayment = shouldEnableSplitPayment(course.price, { 
    midtrans_client_key: 'dummy', 
    midtrans_server_key: 'dummy' 
  });

  return (
    <div className="min-h-screen bg-quant-blue-dark flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        {/* Course Info Card */}
        <Card className="bg-quant-blue/20 border-quant-blue text-quant-white">
          <CardHeader>
            <div className="flex items-start gap-4">
              {course.thumbnail_url && (
                <img 
                  src={course.thumbnail_url} 
                  alt={course.title}
                  className="w-20 h-20 object-cover rounded-lg"
                />
              )}
              <div className="flex-1">
                <CardTitle className="text-quant-white text-xl">{course.title}</CardTitle>
                {course.description && (
                  <CardDescription className="text-quant-white/70 mt-2">
                    {course.description}
                  </CardDescription>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Payment Details Card */}
        <Card className="bg-white text-gray-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <CreditCard className="h-5 w-5" />
              Payment Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Price Breakdown */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-lg text-gray-900">Course Price</span>
                <span className="text-lg font-semibold text-gray-900">{formatPrice(coursePrice)}</span>
              </div>
              
              {willUseSplitPayment && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Users className="h-4 w-4" />
                      <span>Revenue Split</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowSplitDetails(!showSplitDetails)}
                        className="text-blue-600 hover:text-blue-800 p-0 h-auto"
                      >
                        <Info className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {showSplitDetails && (
                      <Alert>
                        <DollarSign className="h-4 w-4" />
                        <AlertDescription>
                          <div className="space-y-2">
                            <p className="font-medium">Payment Distribution:</p>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-gray-600">Instructor receives:</span>
                                <p className="font-semibold text-green-600">
                                  {formatPrice(splitBreakdown.instructorShare)}
                                </p>
                              </div>
                              <div>
                                <span className="text-gray-600">Platform fee ({splitBreakdown.platformFeePercentage}%):</span>
                                <p className="font-semibold text-blue-600">
                                  {formatPrice(splitBreakdown.platformFee)}
                                </p>
                              </div>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                              Platform fees help maintain and improve our learning platform.
                            </p>
                          </div>
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </>
              )}
              
              <Separator />
              <div className="flex justify-between items-center text-xl font-bold">
                <span className="text-gray-900">Total</span>
                <span className="text-gray-900">{formatPrice(coursePrice)}</span>
              </div>
            </div>

            {/* Payment Security Info */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                <Shield className="h-4 w-4" />
                <span className="font-medium">Secure Payment</span>
              </div>
              <p className="text-xs text-gray-500">
                Your payment is secured by Midtrans with 256-bit SSL encryption. 
                {willUseSplitPayment && ' Revenue will be automatically distributed between instructor and platform.'}
              </p>
            </div>

            {/* Payment Methods */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-blue-800 mb-2">
                <CreditCard className="h-4 w-4" />
                <span className="font-medium">Accepted Payment Methods</span>
              </div>
              <p className="text-xs text-blue-600">
                Credit/Debit Cards, Bank Transfer, E-Wallets (GoPay, ShopeePay, Dana), 
                and more payment options available.
              </p>
            </div>
          </CardContent>
          
          <CardFooter className="flex gap-3 text-white">
            <Button
              variant="outline"
              onClick={onPaymentCancel}
              disabled={processing}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handlePayment}
              disabled={processing}
              className="flex-1 bg-quant-blue hover:bg-quant-blue/90"
            >
              {processing ? (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 animate-spin" />
                  Processing...
                </div>
              ) : (
                <div className="flex items-center gap-2 text-white">
                  <CreditCard className="h-4 w-4" />
                  Pay {formatPrice(coursePrice)}
                </div>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default SplitPaymentPage;
