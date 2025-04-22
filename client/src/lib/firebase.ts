import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendEmailVerification, 
  GoogleAuthProvider, 
  signInWithPopup,
  signOut as firebaseSignOut,
  User as FirebaseUser
} from "firebase/auth";

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Add custom parameters to the Google provider
googleProvider.setCustomParameters({
  // Force account selection even if one account is available
  prompt: 'select_account'
});

// Firebase Authentication functions
export const createUserWithEmail = async (email: string, password: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    // Send a verification email
    await sendEmailVerification(userCredential.user);
    return { user: userCredential.user, success: true };
  } catch (error: any) {
    console.error("Error creating user:", error);
    return { 
      success: false, 
      error: error.message || "Failed to create account. Please try again."
    };
  }
};

export const signInWithEmail = async (email: string, password: string) => {
  try {
    // Sign in using Firebase Authentication
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { user: userCredential.user, success: true };
  } catch (error: any) {
    console.error("Error signing in:", error);
    
    // Provide more user-friendly error messages based on Firebase error codes
    if (error.code === 'auth/invalid-email') {
      return {
        success: false,
        error: "Please enter a valid email address."
      };
    } else if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
      return {
        success: false,
        error: "Invalid email or password. Please try again."
      };
    } else if (error.code === 'auth/too-many-requests') {
      return {
        success: false,
        error: "Too many failed login attempts. Please try again later or reset your password."
      };
    }
    
    return { 
      success: false, 
      error: error.message || "Invalid email or password. Please try again."
    };
  }
};

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return { user: result.user, success: true };
  } catch (error: any) {
    console.error("Error signing in with Google:", error);
    
    // Provide more user-friendly error messages based on Firebase error codes
    if (error.code === 'auth/unauthorized-domain') {
      return { 
        success: false, 
        error: "This domain is not authorized for Firebase Authentication. Please contact the administrator to add this domain to the Firebase console."
      };
    } else if (error.code === 'auth/popup-closed-by-user') {
      return {
        success: false,
        error: "Sign-in popup was closed before completing the process. Please try again."
      };
    } else if (error.code === 'auth/cancelled-popup-request') {
      return {
        success: false,
        error: "The sign-in process was cancelled. Please try again."
      };
    } else if (error.code === 'auth/popup-blocked') {
      return {
        success: false,
        error: "The sign-in popup was blocked by your browser. Please allow popups for this site and try again."
      };
    }
    
    return { 
      success: false, 
      error: error.message || "Failed to sign in with Google. Please try again."
    };
  }
};

export const resendVerificationEmail = async (user: FirebaseUser) => {
  try {
    await sendEmailVerification(user);
    return { success: true };
  } catch (error: any) {
    console.error("Error sending verification email:", error);
    return { 
      success: false, 
      error: error.message || "Failed to send verification email. Please try again."
    };
  }
};

export const signOut = async () => {
  try {
    await firebaseSignOut(auth);
    return { success: true };
  } catch (error: any) {
    console.error("Error signing out:", error);
    return { 
      success: false, 
      error: error.message || "Failed to sign out. Please try again."
    };
  }
};

export { auth };