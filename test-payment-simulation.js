// Manual test for split payment logic
// This simulates what happens when a payment is created

// Mock environment variables (simulating what Vite would provide)
const mockEnv = {
  VITE_ENABLE_SPLIT_PAYMENT: 'true',
  VITE_PLATFORM_MIDTRANS_CLIENT_KEY: 'SB-Mid-client-NYBotQgZ9PwUyBN7',
  VITE_PLATFORM_MIDTRANS_SERVER_KEY: 'SB-Mid-server-TNmYAky_WDKsrSHLHyt5eOso',
  VITE_PLATFORM_MIDTRANS_IS_PRODUCTION: 'false',
  VITE_PLATFORM_FEE_PERCENTAGE: '10',
  VITE_PLATFORM_FEE_FIXED: '0',
  VITE_MINIMUM_SPLIT_AMOUNT: '0'
};

// Simulate DEFAULT_PLATFORM_SETTINGS
const DEFAULT_PLATFORM_SETTINGS = {
  admin_midtrans_client_key: mockEnv.VITE_PLATFORM_MIDTRANS_CLIENT_KEY || '',
  admin_midtrans_server_key: mockEnv.VITE_PLATFORM_MIDTRANS_SERVER_KEY || '',
  admin_midtrans_is_production: mockEnv.VITE_PLATFORM_MIDTRANS_IS_PRODUCTION === 'true',
  platform_fee_percentage: parseFloat(mockEnv.VITE_PLATFORM_FEE_PERCENTAGE || '10'),
  platform_fee_fixed: parseFloat(mockEnv.VITE_PLATFORM_FEE_FIXED || '0'),
  enable_split_payment: mockEnv.VITE_ENABLE_SPLIT_PAYMENT === 'true',
  minimum_split_amount: parseFloat(mockEnv.VITE_MINIMUM_SPLIT_AMOUNT || '0'),
};

// Simulate instructor settings
const instructorSettings = {
  midtrans_client_key: 'SB-Mid-client-instructor123',
  midtrans_server_key: 'SB-Mid-server-instructor123',
  is_production: false,
  is_active: true
};

// Simulate the functions
function shouldEnableSplitPayment(coursePrice, instructorSettings, settings = DEFAULT_PLATFORM_SETTINGS) {
  return Boolean(
    settings.enable_split_payment &&
    coursePrice >= settings.minimum_split_amount &&
    settings.admin_midtrans_client_key &&
    settings.admin_midtrans_server_key &&
    instructorSettings?.midtrans_client_key &&
    instructorSettings?.midtrans_server_key
  );
}

function calculatePlatformFee(coursePrice, settings = DEFAULT_PLATFORM_SETTINGS) {
  const percentageFee = (coursePrice * settings.platform_fee_percentage) / 100;
  const totalFee = percentageFee + settings.platform_fee_fixed;
  return Math.min(totalFee, coursePrice * 0.5); // Max 50% of course price
}

function calculateInstructorShare(coursePrice, settings = DEFAULT_PLATFORM_SETTINGS) {
  const platformFee = calculatePlatformFee(coursePrice, settings);
  return coursePrice - platformFee;
}

function calculateSplitPaymentBreakdown(coursePrice, platformSettings = DEFAULT_PLATFORM_SETTINGS) {
  const platformFee = calculatePlatformFee(coursePrice, platformSettings);
  const instructorShare = calculateInstructorShare(coursePrice, platformSettings);
  
  return {
    totalAmount: coursePrice,
    platformFee,
    instructorShare,
    platformFeePercentage: platformSettings.platform_fee_percentage,
  };
}

// Simulate saveSplitPaymentRecord logic
function simulateSaveSplitPaymentRecord(coursePrice) {
  const useSplitPayment = shouldEnableSplitPayment(coursePrice, instructorSettings, DEFAULT_PLATFORM_SETTINGS);
  const breakdown = useSplitPayment ? calculateSplitPaymentBreakdown(coursePrice, DEFAULT_PLATFORM_SETTINGS) : null;

  // This is what would be inserted into the database
  const paymentRecord = {
    user_id: 'test-user-id',
    course_id: 'test-course-id',
    amount: coursePrice,
    midtrans_order_id: `test-order-${Date.now()}`,
    status: 'pending',
    split_payment_enabled: useSplitPayment,
    platform_fee: breakdown?.platformFee || 0,
    instructor_share: breakdown?.instructorShare || 0,
    platform_fee_percentage: breakdown?.platformFeePercentage || 0,
  };

  return paymentRecord;
}

console.log('=== SPLIT PAYMENT SIMULATION ===');
console.log('Platform Settings:', DEFAULT_PLATFORM_SETTINGS);
console.log('Instructor Settings:', instructorSettings);

console.log('\n=== TEST PAYMENTS ===');
const testPrices = [70000, 100000, 200000];

testPrices.forEach(price => {
  console.log(`\n--- Simulating payment for ${price} IDR ---`);
  const paymentRecord = simulateSaveSplitPaymentRecord(price);
  console.log('Database record that would be created:', paymentRecord);
});
