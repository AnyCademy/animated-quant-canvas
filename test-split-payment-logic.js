// Test split payment functionality
import { DEFAULT_PLATFORM_SETTINGS, shouldEnableSplitPayment, calculatePlatformFee, calculateInstructorShare } from './src/lib/platform-settings.js';

// Mock instructor settings
const instructorSettings = {
  midtrans_client_key: 'SB-Mid-client-test',
  midtrans_server_key: 'SB-Mid-server-test',
  is_production: false,
  is_active: true
};

console.log('=== SPLIT PAYMENT TEST ===');
console.log('Platform Settings:', {
  enable_split_payment: DEFAULT_PLATFORM_SETTINGS.enable_split_payment,
  platform_fee_percentage: DEFAULT_PLATFORM_SETTINGS.platform_fee_percentage,
  minimum_split_amount: DEFAULT_PLATFORM_SETTINGS.minimum_split_amount,
  has_admin_client_key: !!DEFAULT_PLATFORM_SETTINGS.admin_midtrans_client_key,
  has_admin_server_key: !!DEFAULT_PLATFORM_SETTINGS.admin_midtrans_server_key,
});

// Test different course prices
const testPrices = [70000, 100000, 200000];

testPrices.forEach(price => {
  console.log(`\n--- Testing price: ${price} IDR ---`);
  
  const shouldEnable = shouldEnableSplitPayment(price, instructorSettings, DEFAULT_PLATFORM_SETTINGS);
  const platformFee = calculatePlatformFee(price, DEFAULT_PLATFORM_SETTINGS);
  const instructorShare = calculateInstructorShare(price, DEFAULT_PLATFORM_SETTINGS);
  
  console.log(`Split Payment Enabled: ${shouldEnable}`);
  console.log(`Platform Fee: ${platformFee} IDR (${DEFAULT_PLATFORM_SETTINGS.platform_fee_percentage}%)`);
  console.log(`Instructor Share: ${instructorShare} IDR`);
  console.log(`Total: ${platformFee + instructorShare} IDR`);
});

console.log('\n=== CONDITIONS CHECK ===');
console.log('enable_split_payment:', DEFAULT_PLATFORM_SETTINGS.enable_split_payment);
console.log('has admin_client_key:', !!DEFAULT_PLATFORM_SETTINGS.admin_midtrans_client_key);
console.log('has admin_server_key:', !!DEFAULT_PLATFORM_SETTINGS.admin_midtrans_server_key);
console.log('has instructor_client_key:', !!instructorSettings.midtrans_client_key);
console.log('has instructor_server_key:', !!instructorSettings.midtrans_server_key);
