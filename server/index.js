import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:8080', 'http://localhost:8081', 'http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.url} - ${new Date().toISOString()}`);
  next();
});

// Supabase client (for user authentication if needed)
const supabaseUrl = process.env.SUPABASE_URL || 'https://qwzomtguhplynhciriuf.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3em9tdGd1aHBseW5oY2lyaXVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzMjM0NTQsImV4cCI6MjA2Mzg5OTQ1NH0.BBXEVybRI7-DzVWhjsSwyaZjgisLqKAdZQsRFqlpGsc';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test Midtrans connection endpoint
app.post('/api/test-midtrans-connection', async (req, res) => {
  console.log('=== MIDTRANS TEST CONNECTION REQUEST RECEIVED ===');
  console.log('Request body:', req.body);
  console.log('Request headers:', req.headers);
  
  try {
    const { serverKey, isProduction } = req.body;

    console.log('Testing Midtrans connection:', {
      hasServerKey: !!serverKey,
      isProduction,
      serverKeyPrefix: serverKey?.substring(0, 15) + '...'
    });

    // Validate input
    if (!serverKey) {
      return res.status(400).json({
        status: 'error',
        message: 'Server key is required'
      });
    }

    // Validate server key format
    const expectedPrefix = isProduction ? 'Mid-server-' : 'SB-Mid-server-';
    if (!serverKey.startsWith(expectedPrefix)) {
      return res.status(400).json({
        status: 'error',
        message: `Invalid server key format. Expected to start with ${expectedPrefix}`
      });
    }

    // Determine the correct Midtrans API base URL
    const baseUrl = isProduction 
      ? 'https://api.midtrans.com/v2' 
      : 'https://api.sandbox.midtrans.com/v2';

    console.log('Testing connection to:', baseUrl);

    // Test the connection by trying to get a non-existent order status
    // This will return 404 if authentication is successful, or 401 if it fails
    const testOrderId = `test-connection-${Date.now()}`;
    const authString = Buffer.from(serverKey + ':').toString('base64');
    
    const response = await fetch(`${baseUrl}/${testOrderId}/status`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${authString}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('Midtrans response status:', response.status);

    // Parse the response
    let result = {};
    let success = false;

    if (response.status === 404) {
      // 404 means the order doesn't exist, but authentication was successful
      success = true;
      result = { 
        status: 'success', 
        message: 'Connection successful! Your Midtrans credentials are valid.' 
      };
    } else if (response.status === 200) {
      // 200 with body content - check if it's a "transaction doesn't exist" response
      try {
        const responseData = await response.json();
        if (responseData.status_code === '404' && responseData.status_message === "Transaction doesn't exist.") {
          // This is actually success - authentication worked, transaction just doesn't exist
          success = true;
          result = { 
            status: 'success', 
            message: 'Connection successful! Your Midtrans credentials are valid.' 
          };
        } else {
          result = { 
            status: 'warning', 
            message: `Unexpected response content. Please verify your credentials in the Midtrans dashboard.`,
            details: responseData
          };
        }
      } catch {
        result = { 
          status: 'warning', 
          message: `Unexpected response format. Please verify your credentials in the Midtrans dashboard.` 
        };
      }
    } else if (response.status === 401) {
      // 401 means authentication failed
      result = { 
        status: 'error', 
        message: 'Authentication failed. Please check your server key.' 
      };
    } else {
      // Other status codes
      try {
        const errorData = await response.json();
        result = { 
          status: 'warning', 
          message: `Unexpected response (${response.status}). Please verify your credentials in the Midtrans dashboard.`,
          details: errorData
        };
      } catch {
        result = { 
          status: 'warning', 
          message: `Unexpected response (${response.status}). Please verify your credentials in the Midtrans dashboard.` 
        };
      }
    }

    console.log('Returning result:', result);

    return res.status(success ? 200 : 400).json(result);

  } catch (error) {
    console.error('Error testing Midtrans connection:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to test connection. Please check your network and try again.',
      error: error.message
    });
  }
});

// Create Midtrans Snap payment token
app.post('/api/create-payment-token', async (req, res) => {
  try {
    const { paymentData, instructorSettings } = req.body;

    if (!paymentData || !instructorSettings) {
      return res.status(400).json({
        status: 'error',
        message: 'Payment data and instructor settings are required'
      });
    }

    // Validate instructor settings
    if (!instructorSettings.midtrans_server_key || !instructorSettings.midtrans_client_key) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing Midtrans credentials'
      });
    }

    // Determine Midtrans API URL
    const baseUrl = instructorSettings.is_production 
      ? 'https://app.midtrans.com/snap/v1/transactions' 
      : 'https://app.sandbox.midtrans.com/snap/v1/transactions';

    // Prepare payment payload
    const payload = {
      transaction_details: {
        order_id: paymentData.orderId,
        gross_amount: paymentData.amount,
      },
      credit_card: {
        secure: true,
      },
      customer_details: paymentData.customerDetails,
      item_details: paymentData.itemDetails,
      callbacks: {
        finish: `${req.headers.origin || 'http://localhost:5173'}/payment/finish`,
        error: `${req.headers.origin || 'http://localhost:5173'}/payment/error`,
        pending: `${req.headers.origin || 'http://localhost:5173'}/payment/pending`,
      },
    };

    console.log('Creating payment token for order:', paymentData.orderId);

    // Call Midtrans API
    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(instructorSettings.midtrans_server_key + ':').toString('base64')}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Midtrans API error:', errorData);
      return res.status(response.status).json({
        status: 'error',
        message: `Midtrans API Error: ${errorData.error_messages?.[0] || 'Unknown error'}`,
        details: errorData
      });
    }

    const data = await response.json();
    console.log('Payment token created successfully');

    return res.json({
      status: 'success',
      token: data.token,
      redirect_url: data.redirect_url
    });

  } catch (error) {
    console.error('Error creating payment token:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to create payment token',
      error: error.message
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Start server
app.listen(port, () => {
  console.log('==========================================');
  console.log(`🚀 SERVER STARTED SUCCESSFULLY`);
  console.log(`🌐 Server running on http://localhost:${port}`);
  console.log(`❤️  Health check: http://localhost:${port}/api/health`);
  console.log(`🔌 Test endpoint: http://localhost:${port}/api/test-midtrans-connection`);
  console.log('==========================================');
  console.log(`Health check: http://localhost:${port}/api/health`);
  console.log(`Test endpoint: http://localhost:${port}/api/test-midtrans-connection`);
});
