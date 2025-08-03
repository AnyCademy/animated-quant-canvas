import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Clock, XCircle } from 'lucide-react';
import { updatePaymentStatus } from '@/lib/midtrans';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const PaymentResult: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [courseId, setCourseId] = useState<string | null>(null);

  const status = searchParams.get('status') || 'pending';
  const orderId = searchParams.get('order_id') || '';
  const transactionId = searchParams.get('transaction_id') || '';
  const paymentType = searchParams.get('payment_type') || '';

  useEffect(() => {
    const updateStatus = async () => {
      if (orderId) {
        try {
          let paymentStatus: 'pending' | 'paid' | 'failed' | 'expired' = 'pending';
          
          switch (status) {
            case 'settlement':
            case 'capture':
              paymentStatus = 'paid';
              break;
            case 'pending':
              paymentStatus = 'pending';
              break;
            case 'deny':
            case 'cancel':
            case 'expire':
              paymentStatus = 'failed';
              break;
            default:
              paymentStatus = 'pending';
          }

          await updatePaymentStatus(orderId, paymentStatus, transactionId, paymentType);
          
          // Get course ID from payment record
          const { data: paymentData } = await supabase
            .from('payments')
            .select('course_id')
            .eq('midtrans_order_id', orderId)
            .single();
            
          if (paymentData) {
            setCourseId(paymentData.course_id);
          }
        } catch (error) {
          console.error('Error updating payment status:', error);
        }
      }
    };

    updateStatus();
  }, [orderId, status, transactionId, paymentType]);

  const getStatusConfig = () => {
    switch (status) {
      case 'settlement':
      case 'capture':
        return {
          icon: CheckCircle,
          color: 'text-green-500',
          bgColor: 'bg-green-500/10',
          title: 'Payment Successful!',
          description: 'Your payment has been processed successfully. You now have access to the course.',
          buttonText: 'Go to Course',
          buttonAction: () => {
            if (courseId) {
              navigate(`/course/${courseId}`);
            } else {
              navigate('/courses');
            }
          }
        };
      case 'pending':
        return {
          icon: Clock,
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-500/10',
          title: 'Payment Pending',
          description: 'Your payment is being processed. You will receive a notification once it\'s completed.',
          buttonText: 'Go to Dashboard',
          buttonAction: () => navigate('/dashboard')
        };
      default:
        return {
          icon: XCircle,
          color: 'text-red-500',
          bgColor: 'bg-red-500/10',
          title: 'Payment Failed',
          description: 'Your payment could not be processed. Please try again or contact support.',
          buttonText: 'Try Again',
          buttonAction: () => {
            if (courseId) {
              navigate(`/course/${courseId}`);
            } else {
              navigate('/courses');
            }
          }
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div className="min-h-screen bg-quant-blue-dark flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-quant-blue/20 border-quant-blue">
        <CardHeader className="text-center">
          <div className={`mx-auto w-16 h-16 rounded-full ${config.bgColor} flex items-center justify-center mb-4`}>
            <Icon className={`w-8 h-8 ${config.color}`} />
          </div>
          <CardTitle className="text-quant-white text-xl">
            {config.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-quant-gray">
            {config.description}
          </p>
          
          {orderId && (
            <div className="text-sm text-quant-gray">
              <p>Order ID: {orderId}</p>
              {transactionId && <p>Transaction ID: {transactionId}</p>}
            </div>
          )}

          <div className="space-y-2">
            <Button
              onClick={config.buttonAction}
              className="w-full bg-quant-teal text-quant-blue-dark hover:bg-quant-teal/90"
            >
              {config.buttonText}
            </Button>
            
            <Button
              onClick={() => navigate('/dashboard')}
              variant="outline"
              className="w-full border-quant-blue text-quant-white hover:bg-quant-blue/20"
            >
              Go to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentResult;
