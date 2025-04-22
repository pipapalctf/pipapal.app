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
import { Loader2 } from "lucide-react";
import Logo from "@/components/logo";
import { UserRole } from "@shared/schema";
import { FcGoogle } from "react-icons/fc";
import { Separator } from "@/components/ui/separator";
import { RoleSelectionDialog } from "@/components/auth/role-selection-dialog";

// Login form schema
const loginFormSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
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
  phone: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerFormSchema>;

export default function AuthPage() {
  const { 
    user, 
    loginMutation, 
    registerMutation, 
    loginWithGoogleMutation,
    isLoading 
  } = useAuth();
  const [location, navigate] = useLocation();
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  
  // Check URL for tab parameter
  const getTabFromUrl = () => {
    const searchParams = new URLSearchParams(window.location.search);
    const tab = searchParams.get('tab');
    return tab === 'register' ? 'register' : 'login';
  };
  
  const [activeTab, setActiveTab] = useState<string>(getTabFromUrl());
  
  const handleGoogleSignIn = () => {
    // Open role selection dialog instead of immediately signing in
    setRoleDialogOpen(true);
  };
  
  const handleRoleSelect = (role: string) => {
    // After role is selected, proceed with Google sign-in with the selected role
    loginWithGoogleMutation.mutate(role);
  };
  
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
      email: "",
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
  
  function onLoginSubmit(values: LoginFormValues) {
    loginMutation.mutate(values);
  }
  
  function onRegisterSubmit(values: RegisterFormValues) {
    registerMutation.mutate(values);
  }
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div>
      <RoleSelectionDialog 
        open={roleDialogOpen} 
        onOpenChange={setRoleDialogOpen}
        onRoleSelect={handleRoleSelect}
        isLoading={loginWithGoogleMutation.isPending}
      />
        
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
                      <Button 
                        variant="outline" 
                        type="button" 
                        className="w-full mb-6" 
                        onClick={handleGoogleSignIn}
                        disabled={loginWithGoogleMutation.isPending}
                      >
                        {loginWithGoogleMutation.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <FcGoogle className="mr-2 h-5 w-5" />
                        )}
                        Sign in with Google
                      </Button>
                        
                      <div className="relative mb-6">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-background px-2 text-muted-foreground">
                            Or sign in with email
                          </span>
                        </div>
                      </div>
                      
                      <Form {...loginForm}>
                        <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-6">
                          <FormField
                            control={loginForm.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email Address</FormLabel>
                                <FormControl>
                                  <Input type="email" placeholder="your.email@example.com" {...field} />
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
                      <CardTitle className="text-2xl font-montserrat text-secondary">Create Account</CardTitle>
                      <CardDescription>Join PipaPal and start your sustainability journey</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button 
                        variant="outline" 
                        type="button" 
                        className="w-full mb-6" 
                        onClick={handleGoogleSignIn}
                        disabled={loginWithGoogleMutation.isPending}
                      >
                        {loginWithGoogleMutation.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <FcGoogle className="mr-2 h-5 w-5" />
                        )}
                        Continue with Google
                      </Button>
                        
                      <div className="relative mb-6">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-background px-2 text-muted-foreground">
                            Or register with email
                          </span>
                        </div>
                      </div>
                      
                      <Form {...registerForm}>
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
                                  <Input placeholder="123 Green Street, Eco City" {...field} />
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
                                <FormLabel>Phone Number (Optional)</FormLabel>
                                <FormControl>
                                  <Input placeholder="+1 (555) 123-4567" {...field} />
                                </FormControl>
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
                            Create Account
                          </Button>
                        </form>
                      </Form>
                      
                      <div className="mt-6 text-center">
                        <p className="text-sm text-gray-600">
                          Already have an account?{" "}
                          <Button variant="link" className="p-0" onClick={() => setActiveTab("login")}>
                            Sign In
                          </Button>
                        </p>
                      </div>
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
    </div>
  );
}
