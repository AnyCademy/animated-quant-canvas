import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CreditCard, Shield, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  createSnapToken, 
  loadSnapScript, 
  openSnapPayment, 
  updatePaymentStatus,
  getInstructorPaymentSettings,
  MidtransPaymentData,
  InstructorPaymentSettings
} from '@/lib/midtrans';
import { logPaymentDiagnostics } from '@/utils/paymentDiagnostics';

interface PaymentPageProps {
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

const PaymentPage: React.FC<PaymentPageProps> = ({ 
  course, 
  onPaymentSuccess, 
  onPaymentCancel 
}) => {
  const [processing, setProcessing] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
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

      console.log('Instructor payment settings found:', {
        hasClientKey: !!instructorSettings.midtrans_client_key,
        hasServerKey: !!instructorSettings.midtrans_server_key,
        isProduction: instructorSettings.is_production,
        isActive: instructorSettings.is_active
      });

      // Create payment record in database
      // Generate shorter order ID to comply with Midtrans limits (max 50 chars)
      const timestamp = Date.now().toString();
      const courseIdShort = course.id.substring(0, 8);
      const userIdShort = user.id.substring(0, 8);
      const orderId = `ord-${courseIdShort}-${userIdShort}-${timestamp}`;
      
      const { data: paymentRecord, error: paymentError } = await supabase
        .from('payments')
        .insert({
          user_id: user.id,
          course_id: course.id,
          amount: course.price,
          midtrans_order_id: orderId,
          status: 'pending'
        })
        .select()
        .single();

      if (paymentError) throw paymentError;

      // Get user profile for payment details
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      // Prepare payment data for Midtrans
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
      };

      // Load Snap script with instructor's credentials
      await loadSnapScript(instructorSettings);

      // Create Snap token with instructor's credentials
      const snapToken = await createSnapToken(paymentData, instructorSettings);

      // Open payment modal
      const result = await openSnapPayment(snapToken);

      // Handle payment result
      if (result.transaction_status === 'settlement' || result.transaction_status === 'capture') {
        await updatePaymentStatus(
          orderId, 
          'paid', 
          result.transaction_id,
          result.payment_type
        );
        
        toast({
          title: "Payment Successful!",
          description: "You have been enrolled in the course.",
        });
        
        onPaymentSuccess();
      } else if (result.transaction_status === 'pending') {
        await updatePaymentStatus(
          orderId, 
          'pending', 
          result.transaction_id,
          result.payment_type
        );
        
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

  return (
    <div className="min-h-screen bg-quant-blue-dark flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        {/* Course Info Card */}
        <Card className="bg-quant-blue/20 border-quant-blue">
          <CardHeader>
            <div className="flex items-start gap-4">
              {course.thumbnail_url && (
                <img 
                  src={course.thumbnail_url} 
                  alt={course.title}
                  className="w-20 h-20 rounded-lg object-cover"
                />
              )}
              <div className="flex-1">
                <CardTitle className="text-quant-white text-xl">
                  {course.title}
                </CardTitle>
                <CardDescription className="text-quant-gray mt-2">
                  {course.description}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Payment Card */}
        <Card className="bg-quant-blue/20 border-quant-blue">
          <CardHeader>
            <CardTitle className="text-quant-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-quant-teal" />
              Payment Details
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Price Breakdown */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-quant-gray">Course Price</span>
                <span className="text-quant-white font-semibold">
                  {formatPrice(course.price)}
                </span>
              </div>
              
              <Separator className="bg-quant-blue" />
              
              <div className="flex justify-between items-center text-lg">
                <span className="text-quant-white font-semibold">Total</span>
                <span className="text-quant-teal font-bold">
                  {formatPrice(course.price)}
                </span>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="space-y-3">
              <h4 className="text-quant-white font-medium">Supported Payment Methods</h4>
              <div className="grid grid-cols-2 gap-2">
                <Badge variant="outline" className="justify-center py-2 border-quant-teal text-quant-teal">
                  Credit Card
                </Badge>
                <Badge variant="outline" className="justify-center py-2 border-quant-teal text-quant-teal">
                  Bank Transfer
                </Badge>
                <Badge variant="outline" className="justify-center py-2 border-quant-teal text-quant-teal">
                  E-Wallet
                </Badge>
                <Badge variant="outline" className="justify-center py-2 border-quant-teal text-quant-teal">
                  Convenience Store
                </Badge>
              </div>
            </div>

            {/* Security Notice */}
            <div className="flex items-start gap-3 p-3 bg-quant-blue/30 rounded-lg">
              <Shield className="w-5 h-5 text-quant-teal flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-quant-white text-sm font-medium">
                  Secure Payment
                </p>
                <p className="text-quant-gray text-xs mt-1">
                  Your payment is secured by Midtrans with 256-bit SSL encryption
                </p>
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="flex gap-3">
            <Button
              variant="outline"
              onClick={onPaymentCancel}
              className="flex-1 border-quant-blue text-quant-white hover:bg-quant-blue/20"
              disabled={processing}
            >
              Cancel
            </Button>
            
            <Button
              onClick={handlePayment}
              disabled={processing}
              className="flex-1 bg-quant-teal text-quant-blue-dark hover:bg-quant-teal/90"
            >
              {processing ? (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 animate-spin" />
                  Processing...
                </div>
              ) : (
                `Pay ${formatPrice(course.price)}`
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default PaymentPage;
