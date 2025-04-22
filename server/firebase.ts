import * as admin from 'firebase-admin';

// Check if Firebase Admin SDK is already initialized
if (!admin.apps.length) {
  try {
    // Initialize Firebase Admin SDK using environment variables
    admin.initializeApp({
      projectId: process.env.VITE_FIREBASE_PROJECT_ID,
      // Note: In production, use a properly configured service account
      // credential: admin.credential.cert({...})
    });
    
    console.log('Firebase Admin SDK initialized successfully');
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
  }
}

const auth = admin.auth();

/**
 * Verify Firebase ID token and get user information
 */
export async function verifyIdToken(idToken: string) {
  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    console.error('Error verifying Firebase ID token:', error);
    throw error;
  }
}

/**
 * Create a custom token for a user
 */
export async function createCustomToken(uid: string, claims?: object) {
  try {
    const customToken = await auth.createCustomToken(uid, claims);
    return customToken;
  } catch (error) {
    console.error('Error creating custom token:', error);
    throw error;
  }
}

/**
 * Set custom claims on a user
 */
export async function setCustomUserClaims(uid: string, claims: object) {
  try {
    await auth.setCustomUserClaims(uid, claims);
    return true;
  } catch (error) {
    console.error('Error setting custom claims:', error);
    throw error;
  }
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string) {
  try {
    const userRecord = await auth.getUserByEmail(email);
    return userRecord;
  } catch (error) {
    console.error('Error getting user by email:', error);
    throw error;
  }
}

export { auth };