import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { insertUserSchema, User as SelectUser } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { 
  auth, 
  createUserWithEmail, 
  signInWithEmail, 
  signInWithGoogle,
  resendVerificationEmail,
  signOut as firebaseSignOut
} from "@/lib/firebase";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";

type AuthContextType = {
  user: SelectUser | null;
  firebaseUser: FirebaseUser | null;
  isEmailVerified: boolean;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<SelectUser, Error, LoginData>;
  loginWithGoogleMutation: UseMutationResult<SelectUser, Error, void>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<SelectUser, Error, RegisterData>;
  resendVerificationEmailMutation: UseMutationResult<void, Error, void>;
};

const loginSchema = insertUserSchema.pick({
  username: true,
  password: true,
});

type LoginData = z.infer<typeof loginSchema>;

const registerSchema = insertUserSchema.extend({
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type RegisterData = z.infer<typeof registerSchema>;

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  
  // Monitor Firebase auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      setIsEmailVerified(user?.emailVerified || false);
    });
    
    return () => unsubscribe();
  }, []);

  const {
    data: user,
    error,
    isLoading,
  } = useQuery<SelectUser | null, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  // Enhanced login mutation with Firebase
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      // First attempt Firebase authentication
      const firebaseResult = await signInWithEmail(
        credentials.username, // Using username as email for simplicity
        credentials.password
      );
      
      if (!firebaseResult.success) {
        throw new Error(firebaseResult.error);
      }
      
      // Then authenticate with our backend
      const res = await apiRequest("POST", "/api/login", credentials);
      return await res.json();
    },
    onSuccess: (user: SelectUser) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Login successful",
        description: `Welcome back, ${user.fullName}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message || "Invalid username or password",
        variant: "destructive",
      });
    },
  });

  // Google login mutation
  const loginWithGoogleMutation = useMutation({
    mutationFn: async () => {
      const googleResult = await signInWithGoogle();
      
      if (!googleResult.success || !googleResult.user) {
        throw new Error(googleResult.error || "Failed to sign in with Google");
      }
      
      // We'd need to handle this on the backend to either find or create a user
      // based on the Google account info
      const googleUser = googleResult.user;
      
      // For now, we'll just use the email to log in if it exists in our system
      if (!googleUser.email) {
        throw new Error("Failed to get email from Google account");
      }
      
      const res = await apiRequest("POST", "/api/login-with-google", {
        email: googleUser.email,
        displayName: googleUser.displayName || googleUser.email.split('@')[0],
        photoURL: googleUser.photoURL || null,
        uid: googleUser.uid
      });
      return await res.json();
    },
    onSuccess: (user: SelectUser) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Login successful",
        description: `Welcome, ${user.fullName}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Google login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Enhanced registration with Firebase
  const registerMutation = useMutation({
    mutationFn: async (userData: RegisterData) => {
      // First create Firebase user
      const firebaseResult = await createUserWithEmail(
        userData.email, 
        userData.password
      );
      
      if (!firebaseResult.success || !firebaseResult.user) {
        throw new Error(firebaseResult.error || "Failed to create Firebase user");
      }
      
      // Then register with our backend
      const { confirmPassword, ...userDataWithoutConfirm } = userData;
      const dataToSend = {
        ...userDataWithoutConfirm,
        // Add Firebase UID to link accounts
        firebaseUid: firebaseResult.user.uid,
        emailVerified: false, // Initially false until they verify email
        onboardingCompleted: false
      };
      
      const res = await apiRequest("POST", "/api/register", dataToSend);
      return await res.json();
    },
    onSuccess: (user: SelectUser) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Registration successful",
        description: "Welcome to PipaPal! Please check your email to verify your account.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Resend verification email
  const resendVerificationEmailMutation = useMutation({
    mutationFn: async () => {
      if (!firebaseUser) {
        throw new Error("No user is currently logged in");
      }
      
      const result = await resendVerificationEmail(firebaseUser);
      
      if (!result.success) {
        throw new Error(result.error);
      }
    },
    onSuccess: () => {
      toast({
        title: "Verification email sent",
        description: "Please check your inbox and follow the link to verify your account",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send verification email",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Enhanced logout with Firebase
  const logoutMutation = useMutation({
    mutationFn: async () => {
      // Logout from Firebase first
      const firebaseResult = await firebaseSignOut();
      
      if (!firebaseResult.success) {
        throw new Error(firebaseResult.error);
      }
      
      // Then logout from our backend
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      toast({
        title: "Logout successful",
        description: "You have been logged out successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        firebaseUser,
        isEmailVerified,
        isLoading,
        error,
        loginMutation,
        loginWithGoogleMutation,
        logoutMutation,
        registerMutation,
        resendVerificationEmailMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
