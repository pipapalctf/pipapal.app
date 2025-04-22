import crypto from 'crypto';

// Store verification codes temporarily (in a real production app, this would be in a database)
// Key: email address, Value: { code: string, expires: Date }
const emailVerificationStore = new Map<string, { code: string, expires: Date }>();

// Development environment check
const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Response type for sendVerificationEmail function
 */
export type EmailVerificationResponse = {
  success: boolean;
  message: string;
  developmentMode?: boolean;
  code?: string;
};

/**
 * Generate a 6-digit verification code
 */
export function generateVerificationCode(): string {
  return crypto.randomInt(100000, 999999).toString();
}

/**
 * Send email verification code
 * In a production environment, this would use a real email service
 * For now, it generates a code and returns it for display in the UI during testing
 */
export async function sendVerificationEmail(email: string): Promise<EmailVerificationResponse> {
  try {
    if (!email) {
      return {
        success: false,
        message: 'Email is required'
      };
    }

    // Generate verification code
    const code = generateVerificationCode();
    
    // Store with 30-minute expiration
    const expires = new Date();
    expires.setMinutes(expires.getMinutes() + 30);
    emailVerificationStore.set(email, { code, expires });
    
    // Log for debugging (without revealing the full code in production)
    const maskedEmail = maskEmail(email);
    console.log(`Sending verification code to ${maskedEmail}`);
    
    // In production, this would call an actual email service
    // For now, we'll simulate success and return the code for development
    console.log(`Development mode: verification code ${code} would be sent to ${email}`);
    
    return {
      success: true,
      developmentMode: true,
      message: `Verification code generated for ${email}. In production, this would be sent via email.`,
      code: code
    };
  } catch (error: any) {
    console.error('Error sending verification email:', error);
    
    return {
      success: false,
      message: `Failed to send verification code: ${error.message || 'Unknown error'}`
    };
  }
}

/**
 * Verify email verification code
 */
export function verifyEmailCode(email: string, codeToVerify: string): boolean {
  const storedData = emailVerificationStore.get(email);
  
  if (!storedData) {
    return false;
  }
  
  const { code, expires } = storedData;
  const now = new Date();
  
  // Check if code is expired
  if (now > expires) {
    emailVerificationStore.delete(email);
    return false;
  }
  
  // Check if code matches
  const isValid = code === codeToVerify;
  
  // Remove code after verification attempt
  if (isValid) {
    emailVerificationStore.delete(email);
  }
  
  return isValid;
}

/**
 * Mask email for privacy in logs
 * e.g., example@domain.com -> e****e@d***n.com
 */
function maskEmail(email: string): string {
  if (!email || !email.includes('@')) {
    return email;
  }
  
  const [localPart, domain] = email.split('@');
  
  // Mask local part
  let maskedLocal = localPart;
  if (localPart.length > 2) {
    maskedLocal = localPart[0] + '*'.repeat(localPart.length - 2) + localPart[localPart.length - 1];
  }
  
  // Mask domain (except TLD)
  let maskedDomain = domain;
  const domainParts = domain.split('.');
  if (domainParts.length > 1 && domainParts[0].length > 2) {
    const domainName = domainParts[0];
    const tld = domainParts.slice(1).join('.');
    maskedDomain = domainName[0] + '*'.repeat(domainName.length - 2) + domainName[domainName.length - 1] + '.' + tld;
  }
  
  return `${maskedLocal}@${maskedDomain}`;
}