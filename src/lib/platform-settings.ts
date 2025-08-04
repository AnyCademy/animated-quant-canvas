// Platform-wide settings for split payments and fees
export interface PlatformSettings {
  // Platform admin Midtrans account (receives platform fees)
  admin_midtrans_client_key: string;
  admin_midtrans_server_key: string;
  admin_midtrans_is_production: boolean;
  
  // Platform fee configuration
  platform_fee_percentage: number; // e.g., 10 for 10%
  platform_fee_fixed: number; // Fixed fee in IDR (optional)
  
  // Split payment settings
  enable_split_payment: boolean;
  minimum_split_amount: number; // Minimum amount to enable split payment
}

// Default platform settings - should be moved to environment variables or database
export const DEFAULT_PLATFORM_SETTINGS: PlatformSettings = {
  admin_midtrans_client_key: import.meta.env.VITE_PLATFORM_MIDTRANS_CLIENT_KEY || '',
  admin_midtrans_server_key: import.meta.env.VITE_PLATFORM_MIDTRANS_SERVER_KEY || '',
  admin_midtrans_is_production: import.meta.env.VITE_PLATFORM_MIDTRANS_IS_PRODUCTION === 'true',
  
  platform_fee_percentage: parseFloat(import.meta.env.VITE_PLATFORM_FEE_PERCENTAGE || '10'), // 10% default
  platform_fee_fixed: parseFloat(import.meta.env.VITE_PLATFORM_FEE_FIXED || '0'), // No fixed fee by default
  
  enable_split_payment: import.meta.env.VITE_ENABLE_SPLIT_PAYMENT === 'true',
  minimum_split_amount: parseFloat(import.meta.env.VITE_MINIMUM_SPLIT_AMOUNT || '0'), // 0 = no minimum
};

// Calculate platform fee based on course price
export const calculatePlatformFee = (coursePrice: number, settings: PlatformSettings = DEFAULT_PLATFORM_SETTINGS): number => {
  const percentageFee = (coursePrice * settings.platform_fee_percentage) / 100;
  const totalFee = percentageFee + settings.platform_fee_fixed;
  
  // Ensure fee doesn't exceed the course price
  return Math.min(totalFee, coursePrice * 0.5); // Max 50% of course price
};

// Calculate instructor's share after platform fee
export const calculateInstructorShare = (coursePrice: number, settings: PlatformSettings = DEFAULT_PLATFORM_SETTINGS): number => {
  const platformFee = calculatePlatformFee(coursePrice, settings);
  return coursePrice - platformFee;
};

// Check if split payment should be enabled for this transaction
export const shouldEnableSplitPayment = (coursePrice: number, instructorSettings: any, settings: PlatformSettings = DEFAULT_PLATFORM_SETTINGS): boolean => {
  return Boolean(
    settings.enable_split_payment &&
    coursePrice >= settings.minimum_split_amount &&
    settings.admin_midtrans_client_key &&
    settings.admin_midtrans_server_key &&
    instructorSettings?.midtrans_client_key &&
    instructorSettings?.midtrans_server_key
  );
};
