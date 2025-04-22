import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Loader2, ArrowLeft, ArrowRight, CheckCircle } from "lucide-react";
import Logo from "@/components/logo";
import { UserRole } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Login form schema
const loginFormSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

// Registration form schema
const registerFormSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  role: z.string({
    required_error: "Please select a role",
  }),
  address: z.string().min(5, "Address must be at least 5 characters"),
  phone: z.string().min(10, "Phone number must be at least 10 digits").regex(/^\+?[0-9]+$/, "Please enter a valid phone number"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

// OTP verification schema
const otpVerificationSchema = z.object({
  otp: z.string()
    .length(6, { message: "OTP must be 6 digits" })
    .regex(/^[0-9]+$/, { message: "OTP must contain only numbers" }),
});

// Use the same type as expected by registerMutation in use-auth.tsx
import { RegisterData } from "@/hooks/use-auth";
type RegisterFormValues = RegisterData;

export default function AuthPage() {
  const { user, loginMutation, registerMutation, isLoading } = useAuth();
  const [location, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<string>("login");
  const [registrationStep, setRegistrationStep] = useState<"accountInfo" | "verification" | "complete">("accountInfo");
  const [userFormData, setUserFormData] = useState<RegisterFormValues | null>(null);
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [isLoadingOtp, setIsLoadingOtp] = useState<boolean>(false);
  const [otpSent, setOtpSent] = useState<boolean>(false);
  const [devOtpCode, setDevOtpCode] = useState<string | null>(null);
  const { toast } = useToast();

  // OTP form
  const otpForm = useForm({
    resolver: zodResolver(otpVerificationSchema),
    defaultValues: {
      otp: "",
    },
  });
  
  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);
  
  // Login form
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });
  
  // Register form
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
      fullName: "",
      email: "",
      role: UserRole.HOUSEHOLD,
      address: "",
      phone: "",
    },
  });
  
  // Login form submission
  function onLoginSubmit(values: LoginFormValues) {
    loginMutation.mutate(values);
  }
  
  // Registration first step submission - collect user data
  function onRegisterSubmit(values: RegisterFormValues) {
    setUserFormData(values);
    // Ensure phone has a value before setting it
    if (values.phone) {
      setPhoneNumber(values.phone);
      // Send OTP to the provided phone number
      sendVerificationCode(values.phone);
    } else {
      toast({
        title: "Error",
        description: "Please provide a valid phone number",
        variant: "destructive",
      });
      return;
    }
    setRegistrationStep("verification");
  }
  
  // Send OTP verification code
  const sendVerificationCode = async (phone: string) => {
    if (!phone || phone.trim() === '') {
      toast({
        title: "Error",
        description: "Please provide a valid phone number",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoadingOtp(true);
    setDevOtpCode(null); // Reset any previous dev code
    
    try {
      const response = await apiRequest("POST", "/api/otp/send", {
        phoneNumber: phone,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send verification code");
      }
      
      // Get the response data
      const responseData = await response.json();
      
      // Check if we're in development mode (server sends a developmentMode flag)
      if (responseData.developmentMode && responseData.otp) {
        // Use the OTP directly from the response if available
        setDevOtpCode(responseData.otp);
        
        // If message contains Twilio verification instructions, show that in a special toast
        if (responseData.message.includes('verify your number in Twilio')) {
          toast({
            title: "Twilio Account Notice",
            description: "Phone number needs to be verified in your Twilio account first. Using test code for now.",
            duration: 8000,
            variant: "destructive"
          });
        } else {
          toast({
            title: "Test Mode",
            description: "A verification code has been generated for testing",
          });
        }
      } else if (responseData.message && 
                (responseData.message.includes('Development mode') || 
                 responseData.message.includes('Use code') || 
                 responseData.message.includes('trial account'))) {
        // Fallback: try to extract the OTP code from the message (for backward compatibility)
        const match = responseData.message.match(/code:? ([0-9]{6})/i);
        if (match && match[1]) {
          setDevOtpCode(match[1]);
          toast({
            title: "Test Mode",
            description: "A verification code has been generated for testing",
          });
        } else {
          toast({
            title: "Verification Code",
            description: responseData.message,
          });
        }
      } else {
        // Standard notification for production mode
        toast({
          title: "Verification code sent",
          description: "Please check your phone for a 6-digit verification code",
        });
      }
      
      setOtpSent(true);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send verification code. Please try again.",
        variant: "destructive",
      });
      
      // Go back to account info step if OTP sending fails
      setRegistrationStep("accountInfo");
    } finally {
      setIsLoadingOtp(false);
    }
  };
  
  // Verify OTP and complete registration
  const verifyOtpAndRegister = async (otpData: { otp: string }) => {
    if (!userFormData) return;
    
    setIsLoadingOtp(true);
    
    try {
      // Verify OTP first
      const verifyResponse = await apiRequest("POST", "/api/otp/verify-registration", {
        phoneNumber: phoneNumber,
        otp: otpData.otp
      });
      
      if (!verifyResponse.ok) {
        const errorData = await verifyResponse.json();
        throw new Error(errorData.error || "Invalid verification code");
      }
      
      // If OTP is valid, submit registration
      // Note: RegisterData type from use-auth.tsx requires confirmPassword
      // The registerMutation handles removing it before API call
      registerMutation.mutate({
        ...userFormData,
        phoneVerified: true,
        phone: phoneNumber
      }, {
        onSuccess: () => {
          setRegistrationStep("complete");
        },
        onError: (error) => {
          toast({
            title: "Registration failed",
            description: error.message || "Failed to create account. Please try again.",
            variant: "destructive",
          });
          // Go back to account info step if registration fails
          setRegistrationStep("accountInfo");
        }
      });
    } catch (error: any) {
      toast({
        title: "Verification failed",
        description: error.message || "Invalid verification code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingOtp(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 container mx-auto px-4 py-8 md:py-12 flex flex-col items-center justify-center">
        <div className="w-full max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row bg-white rounded-lg shadow-lg overflow-hidden">
            {/* Form Section */}
            <div className="lg:w-1/2 p-6 md:p-10">
              <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex flex-col">
                  <div className="flex items-center">
                    <Logo size="md" />
                    <span className="ml-2 text-2xl font-montserrat font-bold text-secondary">PipaPal</span>
                  </div>
                  <span className="ml-10 text-xs text-primary">Your Waste Buddy</span>
                </div>
                <Button 
                  variant="ghost" 
                  onClick={() => navigate("/")}
                  className="flex items-center text-secondary hover:text-primary transition-colors text-sm p-2"
                  size="sm"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                    <path d="m11 17-5-5 5-5"/>
                    <path d="m18 17-5-5 5-5"/>
                  </svg>
                  Back to Home
                </Button>
              </div>
              
              <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid grid-cols-2 mb-8 w-full">
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="register">Register</TabsTrigger>
                </TabsList>
                
                {/* Login Form */}
                <TabsContent value="login">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-2xl font-montserrat text-secondary">Welcome Back</CardTitle>
                      <CardDescription>Sign in to your PipaPal account</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Form {...loginForm}>
                        <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-6">
                          <FormField
                            control={loginForm.control}
                            name="username"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Username</FormLabel>
                                <FormControl>
                                  <Input placeholder="yourusername" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={loginForm.control}
                            name="password"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Password</FormLabel>
                                <FormControl>
                                  <Input type="password" placeholder="••••••••" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <Button 
                            type="submit" 
                            className="w-full" 
                            disabled={loginMutation.isPending}
                          >
                            {loginMutation.isPending ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : null}
                            Sign In
                          </Button>
                        </form>
                      </Form>
                      
                      <div className="mt-6 text-center">
                        <p className="text-sm text-gray-600">
                          Don't have an account?{" "}
                          <Button variant="link" className="p-0" onClick={() => setActiveTab("register")}>
                            Register
                          </Button>
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                {/* Register Form */}
                <TabsContent value="register">
                  <Card>
                    <CardHeader>
                      {registrationStep === "accountInfo" && (
                        <>
                          <CardTitle className="text-2xl font-montserrat text-secondary">Create Account</CardTitle>
                          <CardDescription>Join PipaPal and start your sustainability journey</CardDescription>
                        </>
                      )}
                      
                      {registrationStep === "verification" && (
                        <>
                          <CardTitle className="text-2xl font-montserrat text-secondary">Verify Your Phone</CardTitle>
                          <CardDescription>We've sent a verification code to your phone</CardDescription>
                        </>
                      )}
                      
                      {registrationStep === "complete" && (
                        <>
                          <CardTitle className="text-2xl font-montserrat text-primary text-center">
                            <CheckCircle className="inline-block h-10 w-10 mb-2 mx-auto" />
                            <div>Registration Complete!</div>
                          </CardTitle>
                          <CardDescription className="text-center">
                            Your account has been created successfully. You can now log in.
                          </CardDescription>
                        </>
                      )}
                    </CardHeader>
                    <CardContent>
                      {/* Account Information Step */}
                      {registrationStep === "accountInfo" && (
                      <Form {...registerForm}>
                        <div className="p-4 bg-primary/10 rounded-lg mb-6">
                          <p className="text-sm text-secondary">
                            <strong>Step 1 of 3:</strong> Enter your account details to get started.
                          </p>
                        </div>
                        <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-5">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <FormField
                              control={registerForm.control}
                              name="fullName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Full Name</FormLabel>
                                  <FormControl>
                                    <Input placeholder="John Doe" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={registerForm.control}
                              name="username"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Username</FormLabel>
                                  <FormControl>
                                    <Input placeholder="johndoe" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <FormField
                            control={registerForm.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email Address</FormLabel>
                                <FormControl>
                                  <Input type="email" placeholder="john@example.com" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <FormField
                              control={registerForm.control}
                              name="password"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Password</FormLabel>
                                  <FormControl>
                                    <Input type="password" placeholder="••••••••" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={registerForm.control}
                              name="confirmPassword"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Confirm Password</FormLabel>
                                  <FormControl>
                                    <Input type="password" placeholder="••••••••" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <FormField
                            control={registerForm.control}
                            name="role"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Account Type</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select account type" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value={UserRole.HOUSEHOLD}>Household</SelectItem>
                                    <SelectItem value={UserRole.COLLECTOR}>Waste Collector</SelectItem>
                                    <SelectItem value={UserRole.RECYCLER}>Recycler</SelectItem>
                                    <SelectItem value={UserRole.ORGANIZATION}>Organization</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormDescription>
                                  Select the type of account you want to create
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={registerForm.control}
                            name="address"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Address</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="123 Green Street, Eco City" 
                                    value={field.value || ''} 
                                    onChange={field.onChange}
                                    onBlur={field.onBlur}
                                    ref={field.ref}
                                    name={field.name}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={registerForm.control}
                            name="phone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Phone Number</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="+254 7XX XXX XXX" 
                                    value={field.value || ''} 
                                    onChange={field.onChange}
                                    onBlur={field.onBlur}
                                    ref={field.ref}
                                    name={field.name}
                                  />
                                </FormControl>
                                <FormDescription>
                                  Enter your phone number with country code (e.g., +254 for Kenya)
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <Button 
                            type="submit" 
                            className="w-full mt-6" 
                            disabled={registerMutation.isPending}
                          >
                            {registerMutation.isPending ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : null}
                            Continue to Verification
                          </Button>
                        </form>
                      </Form>
                      )}
                      
                      {/* Phone Verification Step */}
                      {registrationStep === "verification" && (
                        <div className="space-y-6">
                          <div className="p-4 bg-primary/10 rounded-lg mb-6">
                            <p className="text-sm text-secondary">
                              <strong>Step 2 of 3:</strong> Verify your phone number before creating your account.
                            </p>
                          </div>
                          
                          <div className="text-center mb-6">
                            <p className="text-sm text-gray-600 mb-2">
                              We've sent a 6-digit verification code to
                            </p>
                            <p className="font-medium text-secondary">{phoneNumber}</p>
                          </div>
                          
                          <Form {...otpForm}>
                            <form onSubmit={otpForm.handleSubmit(verifyOtpAndRegister)} className="space-y-6">
                              <FormField
                                control={otpForm.control}
                                name="otp"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Verification Code</FormLabel>
                                    <FormControl>
                                      <Input 
                                        placeholder="Enter 6-digit code" 
                                        maxLength={6}
                                        className="text-center text-lg"
                                        {...field} 
                                      />
                                    </FormControl>
                                    {devOtpCode && (
                                      <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                                        <p className="text-yellow-800 font-medium text-xs">
                                          Development Mode: Use code <span className="font-bold">{devOtpCode}</span>
                                        </p>
                                      </div>
                                    )}
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <div className="flex justify-between gap-4">
                                <Button 
                                  type="button" 
                                  variant="outline"
                                  className="flex-1"
                                  onClick={() => setRegistrationStep("accountInfo")}
                                  disabled={isLoadingOtp}
                                >
                                  <ArrowLeft className="mr-2 h-4 w-4" />
                                  Back
                                </Button>
                                <Button 
                                  type="submit" 
                                  className="flex-1"
                                  disabled={isLoadingOtp}
                                >
                                  {isLoadingOtp ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  ) : null}
                                  Verify & Create Account
                                </Button>
                              </div>
                            </form>
                          </Form>
                          
                          <div className="text-center mt-4">
                            <p className="text-sm text-gray-600 mb-2">
                              Didn't receive the code?
                            </p>
                            <Button 
                              variant="link" 
                              onClick={() => sendVerificationCode(phoneNumber)}
                              disabled={isLoadingOtp}
                              className="p-0 h-auto"
                            >
                              Resend Code
                            </Button>
                          </div>
                        </div>
                      )}
                      
                      {/* Registration Complete Step */}
                      {registrationStep === "complete" && (
                        <div className="text-center space-y-6">
                          <div className="p-4 bg-primary/10 rounded-lg mb-6">
                            <p className="text-sm text-secondary">
                              <strong>Step 3 of 3:</strong> Registration complete! You can now log in to your account.
                            </p>
                          </div>
                          <p className="text-gray-600">
                            You can now log in with your username and password to access your account.
                          </p>
                          <Button
                            onClick={() => setActiveTab("login")}
                            className="w-full mt-4"
                          >
                            Go to Login
                          </Button>
                        </div>
                      )}
                      
                      {registrationStep === "accountInfo" && (
                        <div className="mt-6 text-center">
                          <p className="text-sm text-gray-600">
                            Already have an account?{" "}
                            <Button variant="link" className="p-0" onClick={() => setActiveTab("login")}>
                              Sign In
                            </Button>
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
            
            {/* Hero Section */}
            <div className="lg:w-1/2 bg-gradient-to-br from-primary to-primary-dark text-white p-6 md:p-10 flex flex-col justify-center">
              <div className="max-w-md mx-auto">
                <h1 className="text-3xl md:text-4xl font-montserrat font-bold mb-2">
                  Sustainable Waste Management
                </h1>
                <h2 className="text-xl font-medium mb-4">
                  Your Waste Buddy
                </h2>
                <p className="text-lg opacity-90 mb-6">
                  Join PipaPal and be part of the solution for a cleaner environment. Connect with waste collectors, track your environmental impact, and learn sustainable practices.
                </p>
                
                <div className="space-y-4 mt-8">
                  <div className="flex items-start">
                    <div className="bg-white/20 rounded-full p-2 mr-3">
                      <i className="fas fa-recycle text-white"></i>
                    </div>
                    <div>
                      <h3 className="font-bold">Schedule Waste Collection</h3>
                      <p className="opacity-80">Easily schedule pickups with local collectors for various waste types</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="bg-white/20 rounded-full p-2 mr-3">
                      <i className="fas fa-chart-line text-white"></i>
                    </div>
                    <div>
                      <h3 className="font-bold">Track Your Impact</h3>
                      <p className="opacity-80">See how your recycling efforts contribute to environmental sustainability</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="bg-white/20 rounded-full p-2 mr-3">
                      <i className="fas fa-lightbulb text-white"></i>
                    </div>
                    <div>
                      <h3 className="font-bold">Learn Eco-Friendly Tips</h3>
                      <p className="opacity-80">Get personalized AI-powered tips to improve your waste management practices</p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-8 p-4 bg-white/10 rounded-lg">
                  <p className="text-white/90 font-medium flex items-center">
                    <i className="fas fa-gift text-accent mr-2"></i>
                    New users receive free compostable trash bags upon registration!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
