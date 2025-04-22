import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  sendEmailVerification, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  applyActionCode,
  sendPasswordResetEmail
} from "firebase/auth";

// Firebase configuration with environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Wrap Firebase methods for easier use in the application
export const firebaseAuth = {
  /**
   * Create a new user with email and password
   */
  createUser: async (email: string, password: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error: any) {
      console.error("Firebase createUser error:", error);
      throw new Error(error.message || "Failed to create user account");
    }
  },

  /**
   * Send email verification to the user
   */
  sendVerificationEmail: async (user: FirebaseUser) => {
    try {
      await sendEmailVerification(user);
      return true;
    } catch (error: any) {
      console.error("Firebase sendVerificationEmail error:", error);
      throw new Error(error.message || "Failed to send verification email");
    }
  },

  /**
   * Sign in with email and password
   */
  signIn: async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error: any) {
      console.error("Firebase signIn error:", error);
      throw new Error(error.message || "Failed to sign in");
    }
  },

  /**
   * Sign out the current user
   */
  signOut: async () => {
    try {
      await signOut(auth);
      return true;
    } catch (error: any) {
      console.error("Firebase signOut error:", error);
      throw new Error(error.message || "Failed to sign out");
    }
  },

  /**
   * Get the current user
   */
  getCurrentUser: () => {
    return auth.currentUser;
  },

  /**
   * Listen for auth state changes
   */
  onAuthStateChanged: (callback: (user: FirebaseUser | null) => void) => {
    return onAuthStateChanged(auth, callback);
  },

  /**
   * Verify email with action code
   */
  verifyEmail: async (actionCode: string) => {
    try {
      await applyActionCode(auth, actionCode);
      return true;
    } catch (error: any) {
      console.error("Firebase verifyEmail error:", error);
      throw new Error(error.message || "Failed to verify email");
    }
  },

  /**
   * Send password reset email
   */
  sendPasswordResetEmail: async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      return true;
    } catch (error: any) {
      console.error("Firebase sendPasswordResetEmail error:", error);
      throw new Error(error.message || "Failed to send password reset email");
    }
  }
};

export { auth };
export default app;