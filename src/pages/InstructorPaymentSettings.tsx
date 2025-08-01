import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, Save, Eye, EyeOff, Shield, AlertTriangle, CheckCircle } from 'lucide-react';
import Navbar from '@/components/Navbar';

interface PaymentSettings {
  id?: string;
  midtrans_client_key: string;
  midtrans_server_key: string;
  is_production: boolean;
  is_active: boolean;
}

const InstructorPaymentSettings = () => {
  const [settings, setSettings] = useState<PaymentSettings>({
    midtrans_client_key: '',
    midtrans_server_key: '',
    is_production: false,
    is_active: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showServerKey, setShowServerKey] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchPaymentSettings();
    }
  }, [user]);

  const fetchPaymentSettings = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('instructor_payment_settings')
        .select('*')
        .eq('instructor_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        const paymentData = data as unknown as PaymentSettings;
        setSettings({
          id: paymentData.id,
          midtrans_client_key: paymentData.midtrans_client_key || '',
          midtrans_server_key: paymentData.midtrans_server_key || '',
          is_production: paymentData.is_production || false,
          is_active: paymentData.is_active || false,
        });
      }
    } catch (error) {
      console.error('Error fetching payment settings:', error);
      toast({
        title: "Error",
        description: "Failed to load payment settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const testMidtransConnection = async () => {
    if (!settings.midtrans_server_key) {
      toast({
        title: "Missing Server Key",
        description: "Please enter your Midtrans server key to test the connection",
        variant: "destructive",
      });
      return;
    }

    setTestingConnection(true);

    try {
      const baseUrl = settings.is_production 
        ? 'https://api.midtrans.com/v2' 
        : 'https://api.sandbox.midtrans.com/v2';

      // Test with a dummy order ID to check authentication
      const response = await fetch(`${baseUrl}/test-order-123/status`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${btoa(settings.midtrans_server_key + ':')}`,
        },
      });

      // If we get a 404, it means authentication worked (order doesn't exist)
      // If we get a 401, it means authentication failed
      if (response.status === 404) {
        toast({
          title: "Connection Successful!",
          description: "Your Midtrans credentials are valid",
        });
      } else if (response.status === 401) {
        toast({
          title: "Authentication Failed",
          description: "Invalid Midtrans server key",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Connection Test Complete",
          description: "Please verify your credentials in the Midtrans dashboard",
        });
      }
    } catch (error) {
      console.error('Error testing connection:', error);
      toast({
        title: "Connection Failed",
        description: "Unable to connect to Midtrans. Please check your credentials.",
        variant: "destructive",
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    // Validate required fields
    if (!settings.midtrans_client_key.trim() || !settings.midtrans_server_key.trim()) {
      toast({
        title: "Missing Required Fields",
        description: "Please fill in both Client Key and Server Key",
        variant: "destructive",
      });
      return;
    }

    // Validate key formats
    const clientKeyPrefix = settings.is_production ? 'Mid-client-' : 'SB-Mid-client-';
    const serverKeyPrefix = settings.is_production ? 'Mid-server-' : 'SB-Mid-server-';

    if (!settings.midtrans_client_key.startsWith(clientKeyPrefix)) {
      toast({
        title: "Invalid Client Key Format",
        description: `Client key should start with ${clientKeyPrefix}`,
        variant: "destructive",
      });
      return;
    }

    if (!settings.midtrans_server_key.startsWith(serverKeyPrefix)) {
      toast({
        title: "Invalid Server Key Format",
        description: `Server key should start with ${serverKeyPrefix}`,
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    try {
      const settingsData = {
        instructor_id: user.id,
        midtrans_client_key: settings.midtrans_client_key.trim(),
        midtrans_server_key: settings.midtrans_server_key.trim(),
        is_production: settings.is_production,
        is_active: settings.is_active,
      };

      if (settings.id) {
        // Update existing settings
        const { error } = await (supabase as any)
          .from('instructor_payment_settings')
          .update(settingsData)
          .eq('id', settings.id);

        if (error) throw error;
      } else {
        // Create new settings
        const { data, error } = await (supabase as any)
          .from('instructor_payment_settings')
          .insert(settingsData)
          .select()
          .single();

        if (error) throw error;
        setSettings(prev => ({ ...prev, id: data.id }));
      }

      toast({
        title: "Settings Saved",
        description: "Your payment settings have been updated successfully",
      });
    } catch (error) {
      console.error('Error saving payment settings:', error);
      toast({
        title: "Error",
        description: "Failed to save payment settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-quant-blue-dark">
        <Navbar />
        <div className="container mx-auto px-4 py-24">
          <div className="flex items-center justify-center">
            <div className="w-20 h-20 border-4 border-t-quant-teal border-quant-blue rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-quant-blue-dark">
      <Navbar />
      <div className="container mx-auto px-4 py-24 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <Button 
            onClick={() => navigate('/dashboard')} 
            variant="ghost" 
            className="text-quant-white hover:text-quant-teal"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        <div className="space-y-6">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-3xl font-bold text-quant-white mb-2">Payment Settings</h1>
            <p className="text-quant-gray">
              Configure your Midtrans payment gateway to receive payments for your courses
            </p>
          </div>

          {/* Status Alert */}
          <Alert className={`border ${settings.is_active ? 'border-green-500 bg-green-500/10' : 'border-yellow-500 bg-yellow-500/10'}`}>
            <div className="flex items-center gap-2">
              {settings.is_active ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-yellow-500" />
              )}
              <AlertDescription className={settings.is_active ? 'text-green-400' : 'text-yellow-400'}>
                {settings.is_active 
                  ? "Payment gateway is active - you can receive payments for your courses"
                  : "Payment gateway is inactive - configure your settings to start receiving payments"
                }
              </AlertDescription>
            </div>
          </Alert>

          {/* Main Settings Card */}
          <Card className="bg-quant-blue/20 border-quant-blue">
            <CardHeader>
              <CardTitle className="text-quant-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-quant-teal" />
                Midtrans Configuration
              </CardTitle>
              <CardDescription className="text-quant-gray">
                Enter your Midtrans credentials to enable payment processing for your courses
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Environment Toggle */}
              <div className="space-y-3">
                <Label className="text-quant-white font-medium">Environment</Label>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={settings.is_production}
                      onCheckedChange={(checked) => 
                        setSettings(prev => ({ ...prev, is_production: checked }))
                      }
                    />
                    <span className="text-quant-white text-sm">
                      {settings.is_production ? 'Production' : 'Sandbox'}
                    </span>
                  </div>
                  <Badge variant={settings.is_production ? "destructive" : "outline"} className="text-xs">
                    {settings.is_production ? 'LIVE PAYMENTS' : 'TEST MODE'}
                  </Badge>
                </div>
                <p className="text-xs text-quant-gray">
                  {settings.is_production 
                    ? 'Production mode processes real payments. Make sure to test thoroughly first.'
                    : 'Sandbox mode is for testing. No real money will be processed.'
                  }
                </p>
              </div>

              <Separator className="bg-quant-blue" />

              {/* Client Key */}
              <div className="space-y-2">
                <Label htmlFor="clientKey" className="text-quant-white">
                  Client Key
                </Label>
                <Input
                  id="clientKey"
                  type="text"
                  value={settings.midtrans_client_key}
                  onChange={(e) => setSettings(prev => ({ 
                    ...prev, 
                    midtrans_client_key: e.target.value 
                  }))}
                  placeholder={`${settings.is_production ? 'Mid-client-' : 'SB-Mid-client-'}your-client-key`}
                  className="bg-quant-blue/20 border-quant-blue text-quant-white"
                />
                <p className="text-xs text-quant-gray">
                  Your Midtrans client key (used for frontend payment processing)
                </p>
              </div>

              {/* Server Key */}
              <div className="space-y-2">
                <Label htmlFor="serverKey" className="text-quant-white">
                  Server Key
                </Label>
                <div className="relative">
                  <Input
                    id="serverKey"
                    type={showServerKey ? "text" : "password"}
                    value={settings.midtrans_server_key}
                    onChange={(e) => setSettings(prev => ({ 
                      ...prev, 
                      midtrans_server_key: e.target.value 
                    }))}
                    placeholder={`${settings.is_production ? 'Mid-server-' : 'SB-Mid-server-'}your-server-key`}
                    className="bg-quant-blue/20 border-quant-blue text-quant-white pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 text-quant-gray hover:text-quant-white"
                    onClick={() => setShowServerKey(!showServerKey)}
                  >
                    {showServerKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
                <p className="text-xs text-quant-gray">
                  Your Midtrans server key (keep this secret and secure)
                </p>
              </div>

              <Separator className="bg-quant-blue" />

              {/* Test Connection */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-quant-white font-medium">Test Connection</h4>
                  <p className="text-xs text-quant-gray">
                    Verify your Midtrans credentials before activating
                  </p>
                </div>
                <Button
                  onClick={testMidtransConnection}
                  disabled={testingConnection || !settings.midtrans_server_key}
                  variant="outline"
                  className="border-quant-teal text-quant-teal hover:bg-quant-teal hover:text-quant-blue-dark"
                >
                  {testingConnection ? 'Testing...' : 'Test Connection'}
                </Button>
              </div>

              <Separator className="bg-quant-blue" />

              {/* Activate Payment Gateway */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-quant-white font-medium">Activate Payment Gateway</Label>
                    <p className="text-xs text-quant-gray">
                      Enable payment processing for your courses
                    </p>
                  </div>
                  <Switch
                    checked={settings.is_active}
                    onCheckedChange={(checked) => 
                      setSettings(prev => ({ ...prev, is_active: checked }))
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Help & Instructions */}
          <Card className="bg-quant-blue/20 border-quant-blue">
            <CardHeader>
              <CardTitle className="text-quant-white text-lg">Setup Instructions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-quant-white font-medium mb-2">1. Create Midtrans Account</h4>
                  <ul className="text-sm text-quant-gray space-y-1 list-disc list-inside">
                    <li>Visit <a href="https://midtrans.com" target="_blank" rel="noopener noreferrer" className="text-quant-teal hover:underline">midtrans.com</a></li>
                    <li>Sign up for a new account</li>
                    <li>Complete business verification</li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-quant-white font-medium mb-2">2. Get Your Credentials</h4>
                  <ul className="text-sm text-quant-gray space-y-1 list-disc list-inside">
                    <li>Login to Midtrans dashboard</li>
                    <li>Go to Settings → Access Keys</li>
                    <li>Copy Client Key and Server Key</li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-quant-white font-medium mb-2">3. Test in Sandbox</h4>
                  <ul className="text-sm text-quant-gray space-y-1 list-disc list-inside">
                    <li>Start with Sandbox environment</li>
                    <li>Test payments with dummy cards</li>
                    <li>Verify payment flows work</li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-quant-white font-medium mb-2">4. Go Live</h4>
                  <ul className="text-sm text-quant-gray space-y-1 list-disc list-inside">
                    <li>Switch to Production environment</li>
                    <li>Update with production keys</li>
                    <li>Activate payment gateway</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-quant-teal text-quant-blue-dark hover:bg-quant-teal/90 px-8"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstructorPaymentSettings;
