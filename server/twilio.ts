import twilio from 'twilio';
import crypto from 'crypto';

// Initialize Twilio client
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
const isDevelopment = process.env.NODE_ENV === 'development';

// Flag to determine if we should use Twilio
// Now that we have credentials, we'll try to use Twilio in all environments
let useTwilio = accountSid && authToken && twilioPhoneNumber;

if (!accountSid || !authToken || !twilioPhoneNumber) {
  console.error('Missing Twilio environment variables - SMS verification will not work');
} else {
  console.log('Twilio credentials found - SMS verification is active');
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
    
    // Generate a consistent OTP (always use one function for reliable codes)
    const otp = generateOTP();
    
    // Store OTP with 10-minute expiration
    const expires = new Date();
    expires.setMinutes(expires.getMinutes() + 10);
    otpStore.set(formattedPhoneNumber, { otp, expires });
    
    // Log for debugging, without revealing the actual OTP
    console.log(`Sending verification code to ${formattedPhoneNumber} (last 4 digits: ${formattedPhoneNumber.slice(-4)})`);
    
    // If we have proper Twilio credentials, attempt to send SMS
    if (useTwilio && client) {
      try {
        // This is the main production path - use Twilio for real SMS
        const message = await client.messages.create({
          body: `Your PipaPal verification code is: ${otp}. Valid for 10 minutes.`,
          from: twilioPhoneNumber,
          to: formattedPhoneNumber
        });
        
        // Log the Twilio message SID for debugging, not the actual content
        console.log(`Twilio SMS sent, SID: ${message.sid}`);
        
        return { success: true, message: 'OTP sent successfully' };
      } catch (twilioError: any) {
        console.error('Twilio error sending OTP:', twilioError);
        
        // Handle common Twilio trial account limitations
        if (twilioError.code === 20003 || twilioError.message?.includes('not a verified')) {
          // In trial accounts, you can only send to verified numbers
          // Fall back to showing the code in the response for testing
          console.log(`Number not verified in Twilio trial account, showing code in UI`);
          return { 
            success: true,
            developmentMode: true,
            message: 'Number not verified in Twilio trial account. Use code: ' + otp,
            otp: otp
          };
        }
        
        throw twilioError;
      }
    } else {
      // Fallback for development or when Twilio credentials are missing
      console.log(`OTP fallback mode activated - showing code in UI`);
      return { 
        success: true,
        developmentMode: true,
        message: 'Verification code generated. Use code: ' + otp,
        otp: otp
      };
    }
  } catch (error: any) {
    console.error('Error in sendOTP:', error);
    
    // Provide a more detailed error message
    return { 
      success: false, 
      message: `Failed to send verification code: ${error.message || 'Unknown error'}`
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