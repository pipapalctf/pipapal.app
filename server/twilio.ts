import twilio from 'twilio';
import crypto from 'crypto';

// Initialize Twilio client
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

if (!accountSid || !authToken || !twilioPhoneNumber) {
  console.error('Missing required Twilio environment variables');
}

const client = twilio(accountSid, authToken);

// Store OTP codes temporarily (in a real production app, this would be in a database)
// Key: phone number, Value: { otp: string, expires: Date }
const otpStore = new Map<string, { otp: string, expires: Date }>();

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
  // Remove any non-numeric characters
  let cleaned = phoneNumber.replace(/\D/g, '');
  
  // Handle Kenyan phone numbers
  if (cleaned.startsWith('0')) {
    cleaned = '254' + cleaned.substring(1);
  }
  
  // Ensure the number starts with +
  if (!cleaned.startsWith('+')) {
    cleaned = '+' + cleaned;
  }
  
  return cleaned;
}

/**
 * Send OTP verification code to a phone number
 */
export async function sendOTP(phoneNumber: string): Promise<{ success: boolean, message: string }> {
  try {
    const formattedPhoneNumber = formatPhoneNumber(phoneNumber);
    const otp = generateOTP();
    
    // Store OTP with 10-minute expiration
    const expires = new Date();
    expires.setMinutes(expires.getMinutes() + 10);
    otpStore.set(formattedPhoneNumber, { otp, expires });
    
    // Send SMS with OTP
    await client.messages.create({
      body: `Your PipaPal verification code is: ${otp}. Valid for 10 minutes.`,
      from: twilioPhoneNumber,
      to: formattedPhoneNumber
    });
    
    return { success: true, message: 'OTP sent successfully' };
  } catch (error: any) {
    console.error('Error sending OTP:', error);
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