// Test script to validate split payment configuration
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read .env file manually
const envPath = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf8');

// Parse .env file
const envVars = {};
envContent.split('\n').forEach(line => {
  const trimmedLine = line.trim();
  if (trimmedLine && !trimmedLine.startsWith('#')) {
    const [key, ...valueParts] = trimmedLine.split('=');
    if (key && valueParts.length > 0) {
      // Remove comments from value
      const value = valueParts.join('=').split('#')[0].trim();
      envVars[key.trim()] = value;
    }
  }
});

console.log('=== PARSED ENVIRONMENT VARIABLES ===');
console.log('VITE_ENABLE_SPLIT_PAYMENT:', envVars.VITE_ENABLE_SPLIT_PAYMENT);
console.log('VITE_PLATFORM_MIDTRANS_CLIENT_KEY:', envVars.VITE_PLATFORM_MIDTRANS_CLIENT_KEY ? 'SET' : 'NOT SET');
console.log('VITE_PLATFORM_MIDTRANS_SERVER_KEY:', envVars.VITE_PLATFORM_MIDTRANS_SERVER_KEY ? 'SET' : 'NOT SET');
console.log('VITE_PLATFORM_FEE_PERCENTAGE:', envVars.VITE_PLATFORM_FEE_PERCENTAGE);
console.log('VITE_MINIMUM_SPLIT_AMOUNT:', envVars.VITE_MINIMUM_SPLIT_AMOUNT);

// Simulate the split payment logic
const enableSplitPayment = envVars.VITE_ENABLE_SPLIT_PAYMENT === 'true';
const hasClientKey = !!envVars.VITE_PLATFORM_MIDTRANS_CLIENT_KEY;
const hasServerKey = !!envVars.VITE_PLATFORM_MIDTRANS_SERVER_KEY;
const feePercentage = parseFloat(envVars.VITE_PLATFORM_FEE_PERCENTAGE || '10');
const minimumAmount = parseFloat(envVars.VITE_MINIMUM_SPLIT_AMOUNT || '0');

console.log('\n=== COMPUTED VALUES ===');
console.log('enableSplitPayment:', enableSplitPayment);
console.log('hasClientKey:', hasClientKey);
console.log('hasServerKey:', hasServerKey);
console.log('feePercentage:', feePercentage);
console.log('minimumAmount:', minimumAmount);

// Simulate shouldEnableSplitPayment function
const mockInstructorSettings = {
  midtrans_client_key: 'SB-Mid-client-test',
  midtrans_server_key: 'SB-Mid-server-test'
};

function shouldEnableSplitPayment(coursePrice) {
  return (
    enableSplitPayment &&
    coursePrice >= minimumAmount &&
    hasClientKey &&
    hasServerKey &&
    mockInstructorSettings.midtrans_client_key &&
    mockInstructorSettings.midtrans_server_key
  );
}

console.log('\n=== SPLIT PAYMENT TESTS ===');
const testPrices = [70000, 100000, 200000];

testPrices.forEach(price => {
  const splitEnabled = shouldEnableSplitPayment(price);
  const platformFee = splitEnabled ? (price * feePercentage / 100) : 0;
  const instructorShare = splitEnabled ? (price - platformFee) : price;
  
  console.log(`Price ${price}: Split=${splitEnabled}, Platform Fee=${platformFee}, Instructor=${instructorShare}`);
});
