// Simple test to check environment variables
console.log('=== ENVIRONMENT VARIABLES CHECK ===');
console.log('NODE_ENV:', process.env.NODE_ENV || 'not set');

// Check if running in browser environment (Vite)
if (typeof window !== 'undefined') {
  console.log('Running in browser - checking import.meta.env');
} else {
  console.log('Running in Node.js - checking process.env');
  
  console.log('VITE_PLATFORM_MIDTRANS_CLIENT_KEY:', process.env.VITE_PLATFORM_MIDTRANS_CLIENT_KEY || 'NOT SET');
  console.log('VITE_PLATFORM_MIDTRANS_SERVER_KEY:', process.env.VITE_PLATFORM_MIDTRANS_SERVER_KEY || 'NOT SET');
  console.log('VITE_ENABLE_SPLIT_PAYMENT:', process.env.VITE_ENABLE_SPLIT_PAYMENT || 'NOT SET');
  console.log('VITE_PLATFORM_FEE_PERCENTAGE:', process.env.VITE_PLATFORM_FEE_PERCENTAGE || 'NOT SET');
}

// Default values that would be used
const enableSplitPayment = process.env.VITE_ENABLE_SPLIT_PAYMENT === 'true';
const platformClientKey = process.env.VITE_PLATFORM_MIDTRANS_CLIENT_KEY || '';
const platformServerKey = process.env.VITE_PLATFORM_MIDTRANS_SERVER_KEY || '';

console.log('\n=== COMPUTED VALUES ===');
console.log('enable_split_payment:', enableSplitPayment);
console.log('has_platform_client_key:', !!platformClientKey);
console.log('has_platform_server_key:', !!platformServerKey);

// Would split payment be enabled?
const splitWouldBeEnabled = enableSplitPayment && platformClientKey && platformServerKey;
console.log('split_payment_would_be_enabled:', splitWouldBeEnabled);
