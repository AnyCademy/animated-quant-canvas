// Debug script to check platform settings
import { DEFAULT_PLATFORM_SETTINGS, shouldEnableSplitPayment } from './src/lib/platform-settings.js';

console.log('=== PLATFORM SETTINGS DEBUG ===');
console.log('Platform Settings:', {
  admin_client_key: DEFAULT_PLATFORM_SETTINGS.admin_midtrans_client_key ? 'SET' : 'NOT SET',
  admin_server_key: DEFAULT_PLATFORM_SETTINGS.admin_midtrans_server_key ? 'SET' : 'NOT SET',
  is_production: DEFAULT_PLATFORM_SETTINGS.admin_midtrans_is_production,
  platform_fee_percentage: DEFAULT_PLATFORM_SETTINGS.platform_fee_percentage,
  platform_fee_fixed: DEFAULT_PLATFORM_SETTINGS.platform_fee_fixed,
  enable_split_payment: DEFAULT_PLATFORM_SETTINGS.enable_split_payment,
  minimum_split_amount: DEFAULT_PLATFORM_SETTINGS.minimum_split_amount,
});

console.log('\n=== ENVIRONMENT VARIABLES ===');
console.log('VITE_PLATFORM_MIDTRANS_CLIENT_KEY:', process.env.VITE_PLATFORM_MIDTRANS_CLIENT_KEY ? 'SET' : 'NOT SET');
console.log('VITE_PLATFORM_MIDTRANS_SERVER_KEY:', process.env.VITE_PLATFORM_MIDTRANS_SERVER_KEY ? 'SET' : 'NOT SET');
console.log('VITE_PLATFORM_MIDTRANS_IS_PRODUCTION:', process.env.VITE_PLATFORM_MIDTRANS_IS_PRODUCTION);
console.log('VITE_PLATFORM_FEE_PERCENTAGE:', process.env.VITE_PLATFORM_FEE_PERCENTAGE);
console.log('VITE_PLATFORM_FEE_FIXED:', process.env.VITE_PLATFORM_FEE_FIXED);
console.log('VITE_ENABLE_SPLIT_PAYMENT:', process.env.VITE_ENABLE_SPLIT_PAYMENT);
console.log('VITE_MINIMUM_SPLIT_AMOUNT:', process.env.VITE_MINIMUM_SPLIT_AMOUNT);

// Test with sample data
const sampleInstructorSettings = {
  midtrans_client_key: 'SB-Mid-client-test',
  midtrans_server_key: 'SB-Mid-server-test',
  is_production: false,
  is_active: true
};

const testPrices = [70000, 100000, 200000];

console.log('\n=== SPLIT PAYMENT TESTS ===');
testPrices.forEach(price => {
  const shouldEnable = shouldEnableSplitPayment(price, sampleInstructorSettings);
  console.log(`Price ${price}: Split Payment ${shouldEnable ? 'ENABLED' : 'DISABLED'}`);
});
