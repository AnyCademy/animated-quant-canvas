// Debug script to check split payment configuration
import { DEFAULT_PLATFORM_SETTINGS, shouldEnableSplitPayment } from './src/lib/platform-settings.js';

console.log('=== SPLIT PAYMENT DEBUG ===');
console.log('Environment Variables:');
console.log('VITE_ENABLE_SPLIT_PAYMENT:', import.meta.env.VITE_ENABLE_SPLIT_PAYMENT);
console.log('VITE_PLATFORM_MIDTRANS_CLIENT_KEY:', import.meta.env.VITE_PLATFORM_MIDTRANS_CLIENT_KEY?.substring(0, 20) + '...');
console.log('VITE_PLATFORM_MIDTRANS_SERVER_KEY:', import.meta.env.VITE_PLATFORM_MIDTRANS_SERVER_KEY?.substring(0, 20) + '...');
console.log('VITE_MINIMUM_SPLIT_AMOUNT:', import.meta.env.VITE_MINIMUM_SPLIT_AMOUNT);

console.log('\nPlatform Settings:');
console.log('enable_split_payment:', DEFAULT_PLATFORM_SETTINGS.enable_split_payment);
console.log('admin_midtrans_client_key:', DEFAULT_PLATFORM_SETTINGS.admin_midtrans_client_key?.substring(0, 20) + '...');
console.log('admin_midtrans_server_key:', DEFAULT_PLATFORM_SETTINGS.admin_midtrans_server_key?.substring(0, 20) + '...');
console.log('minimum_split_amount:', DEFAULT_PLATFORM_SETTINGS.minimum_split_amount);

// Test with course price 70000
const coursePrice = 70000;
const mockInstructorSettings = {
  midtrans_client_key: 'SB-Mid-client-test',
  midtrans_server_key: 'SB-Mid-server-test'
};

console.log('\nSplit Payment Test:');
console.log('Course Price:', coursePrice);
console.log('Should Enable Split Payment:', shouldEnableSplitPayment(coursePrice, mockInstructorSettings));

console.log('\nCondition Checks:');
console.log('1. enable_split_payment:', DEFAULT_PLATFORM_SETTINGS.enable_split_payment);
console.log('2. coursePrice >= minimum_split_amount:', coursePrice >= DEFAULT_PLATFORM_SETTINGS.minimum_split_amount);
console.log('3. has admin_midtrans_client_key:', !!DEFAULT_PLATFORM_SETTINGS.admin_midtrans_client_key);
console.log('4. has admin_midtrans_server_key:', !!DEFAULT_PLATFORM_SETTINGS.admin_midtrans_server_key);
console.log('5. has instructor client key:', !!mockInstructorSettings?.midtrans_client_key);
console.log('6. has instructor server key:', !!mockInstructorSettings?.midtrans_server_key);
