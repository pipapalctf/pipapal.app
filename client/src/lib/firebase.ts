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
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { user: userCredential.user, success: true };
  } catch (error: any) {
    console.error("Error signing in:", error);
    return { 
      success: false, 
      error: error.message || "Invalid email or password."
    };
  }
};

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return { user: result.user, success: true };
  } catch (error: any) {
    console.error("Error signing in with Google:", error);
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