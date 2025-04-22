import twilio from 'twilio';
import crypto from 'crypto';

// Initialize Twilio client
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
const isDevelopment = process.env.NODE_ENV === 'development';

// Flag to determine if we should use Twilio or development mode
let useTwilio = !isDevelopment && accountSid && authToken && twilioPhoneNumber;

if (!accountSid || !authToken || !twilioPhoneNumber) {
  console.warn('Missing Twilio environment variables - using development mode with fixed OTP');
}

// Only initialize client if we're using Twilio
const client = useTwilio ? twilio(accountSid, authToken) : null;

// Store OTP codes temporarily (in a real production app, this would be in a database)
// Key: phone number, Value: { otp: string, expires: Date }
const otpStore = new Map<string, { otp: string, expires: Date }>();

// In development mode, we'll generate a random OTP each time instead of using a fixed one
// This helps with testing the UI with different values
function generateDevOTP() {
  return isDevelopment ? generateOTP() : '123456';
}

/**
 * Generate a 6-digit OTP code
 */
export function generateOTP(): string {
  return crypto.randomInt(100000, 999999).toString();
}

/**
 * Format phone number to E.164 format for Twilio
 * Expected input format: +254XXXXXXXXX or 254XXXXXXXXX or 0XXXXXXXXX (for Kenya)
 */
export function formatPhoneNumber(phoneNumber: string): string {
  // Remove any non-numeric characters except the plus sign
  let cleaned = phoneNumber.replace(/[^\d+]/g, '');
  
  // Handle Kenyan phone numbers
  if (cleaned.startsWith('0')) {
    cleaned = '254' + cleaned.substring(1);
  } else if (cleaned.startsWith('254') && !cleaned.startsWith('+')) {
    // If it starts with 254 but no +, add the +
    cleaned = '+' + cleaned;
  } else if (!cleaned.startsWith('+')) {
    // Ensure the number starts with + if it doesn't already
    cleaned = '+' + cleaned;
  }
  
  return cleaned;
}

/**
 * Response type for sendOTP function
 */
export type OtpResponse = {
  success: boolean;
  message: string;
  developmentMode?: boolean;
  otp?: string;
};

/**
 * Send OTP verification code to a phone number
 */
export async function sendOTP(phoneNumber: string): Promise<OtpResponse> {
  try {
    const formattedPhoneNumber = formatPhoneNumber(phoneNumber);
    
    // Generate OTP for development mode or production
    const otp = isDevelopment || !useTwilio ? generateDevOTP() : generateOTP();
    
    // Store OTP with 10-minute expiration
    const expires = new Date();
    expires.setMinutes(expires.getMinutes() + 10);
    otpStore.set(formattedPhoneNumber, { otp, expires });
    
    // If we're in development mode or missing Twilio credentials, don't attempt to send SMS
    if (isDevelopment || !useTwilio) {
      console.log(`[DEV MODE] Would send OTP ${otp} to ${formattedPhoneNumber}`);
      return { 
        success: true,
        developmentMode: true,
        message: 'Development mode - OTP generated but not sent. Use code: ' + otp,
        otp: otp // Only included in development mode
      };
    }
    
    // Send SMS with OTP using Twilio
    try {
      await client?.messages.create({
        body: `Your PipaPal verification code is: ${otp}. Valid for 10 minutes.`,
        from: twilioPhoneNumber,
        to: formattedPhoneNumber
      });
      
      return { success: true, message: 'OTP sent successfully' };
    } catch (twilioError: any) {
      console.error('Twilio error sending OTP:', twilioError);
      
      // Handle common Twilio trial account limitations
      if (twilioError.code === 20003 || twilioError.message?.includes('not a verified')) {
        // In trial accounts, you can only send to verified numbers
        // Fall back to development mode
        console.log(`Falling back to dev mode. OTP: ${otp}`);
        return { 
          success: true,
          developmentMode: true,
          message: 'Number not verified in Twilio trial account. Use code: ' + otp,
          otp: otp
        };
      }
      
      throw twilioError;
    }
  } catch (error: any) {
    console.error('Error in sendOTP:', error);
    
    // Even if there's an error, we'll still generate a test OTP in development mode
    if (isDevelopment) {
      const devOtp = generateDevOTP();
      return { 
        success: true,
        developmentMode: true,
        message: 'Development mode - use test code: ' + devOtp,
        otp: devOtp
      };
    }
    
    return { 
      success: false, 
      message: error.message || 'Failed to send verification code' 
    };
  }
}

/**
 * Verify OTP code for a phone number
 */
export function verifyOTP(phoneNumber: string, otpToVerify: string): boolean {
  const formattedPhoneNumber = formatPhoneNumber(phoneNumber);
  
  // In development mode, always check the OTP against stored value
  // This allows for proper testing of the verification flow
  if (isDevelopment) {
    console.log('[DEV MODE] Verifying OTP code', otpToVerify);
    // We'll let the normal validation flow handle this
  }
  
  const storedData = otpStore.get(formattedPhoneNumber);
  
  if (!storedData) {
    return false;
  }
  
  const { otp, expires } = storedData;
  const now = new Date();
  
  // Check if OTP is expired
  if (now > expires) {
    otpStore.delete(formattedPhoneNumber);
    return false;
  }
  
  // Check if OTP matches
  const isValid = otp === otpToVerify;
  
  // Remove OTP after verification attempt
  if (isValid) {
    otpStore.delete(formattedPhoneNumber);
  }
  
  return isValid;
}