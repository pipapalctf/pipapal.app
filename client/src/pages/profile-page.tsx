import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { WasteType } from "@shared/schema";

// UI Components
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Layout Components
import Navbar from "@/components/shared/navbar";
import Footer from "@/components/shared/footer";
import MobileNavigation from "@/components/shared/mobile-navigation";

// Icons
import { Check, Loader2, UserIcon, KeyIcon, MapPinIcon, PhoneIcon, AtSign, AlertCircle, 
  BriefcaseIcon, CheckCircleIcon, Building2Icon, Clock4Icon, MapIcon } from "lucide-react";

// Profile form schema
const profileFormSchema = z.object({
  fullName: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  address: z.string().optional(),
  phone: z.string().optional(),
});

// Business details form schema
const businessFormSchema = z.object({
  businessName: z.string().optional(),
  businessType: z.enum(["individual", "organization"]).optional(),
  serviceLocation: z.string().optional(),
  serviceType: z.enum(["pickup", "drop_off", "both"]).optional(),
  operatingHours: z.string().optional(),
  wasteSpecialization: z.array(z.string()).optional(),
  isCertified: z.boolean().optional(),
  certificationDetails: z.string().optional(),
  contactPersonName: z.string().optional(),
  contactPersonEmail: z.string().email().optional(),
  contactPersonPhone: z.string().optional(),
  contactPersonPosition: z.string().optional(),
});

// Password form schema
const passwordFormSchema = z.object({
  currentPassword: z.string().min(1, { message: "Current password is required" }),
  newPassword: z.string().min(8, { message: "Password must be at least 8 characters" }),
  confirmPassword: z.string().min(8, { message: "Password must be at least 8 characters" }),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;
type BusinessFormValues = z.infer<typeof businessFormSchema>;
type PasswordFormValues = z.infer<typeof passwordFormSchema>;

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("profile");
  
  // Check if user is a collector or recycler
  const isBusinessUser = user?.role === 'collector' || user?.role === 'recycler';

  // Profile form
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      fullName: user?.fullName || "",
      email: user?.email || "",
      address: user?.address || "",
      phone: user?.phone || "",
    },
  });
  
  // Business details form (for collectors and recyclers)
  const businessForm = useForm<BusinessFormValues>({
    resolver: zodResolver(businessFormSchema),
    defaultValues: {
      businessType: (user?.businessType as "individual" | "organization") || "individual",
      businessName: user?.businessName || "",
      serviceLocation: user?.serviceLocation || "",
      serviceType: (user?.serviceType as "pickup" | "drop_off" | "both") || "pickup",
      operatingHours: user?.operatingHours || "",
      wasteSpecialization: user?.wasteSpecialization || [],
      isCertified: user?.isCertified || false,
      certificationDetails: user?.certificationDetails || "",
      contactPersonName: user?.contactPersonName || "",
      contactPersonEmail: user?.contactPersonEmail || "",
      contactPersonPhone: user?.contactPersonPhone || "",
      contactPersonPosition: user?.contactPersonPosition || "",
    },
  });

  // Password form
  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormValues) => {
      const res = await apiRequest("PATCH", "/api/user", data);
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating profile",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update password mutation
  const updatePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      const res = await apiRequest("POST", "/api/user/password", data);
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Password updated",
        description: "Your password has been updated successfully.",
        variant: "default",
      });
      passwordForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating password",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Update business information mutation
  const updateBusinessMutation = useMutation({
    mutationFn: async (data: BusinessFormValues) => {
      const res = await apiRequest("PATCH", "/api/user", data);
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Business information updated",
        description: "Your business details have been updated successfully.",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating business information",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Submit profile form
  function onProfileSubmit(data: ProfileFormValues) {
    updateProfileMutation.mutate(data);
  }

  // Submit password form
  function onPasswordSubmit(data: PasswordFormValues) {
    updatePasswordMutation.mutate({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    });
  }
  
  // Submit business form
  function onBusinessSubmit(data: BusinessFormValues) {
    updateBusinessMutation.mutate(data);
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-montserrat font-bold text-secondary">
            Account Settings
          </h1>
          <p className="text-gray-600 mt-1">
            Manage your personal information and password
          </p>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-3xl mx-auto">
          <TabsList className={`grid w-full ${isBusinessUser ? 'grid-cols-3' : 'grid-cols-2'} mb-8`}>
            <TabsTrigger value="profile" className="flex items-center">
              <UserIcon className="mr-2 h-4 w-4" />
              Profile Information
            </TabsTrigger>
            {isBusinessUser && (
              <TabsTrigger value="business" className="flex items-center">
                <BriefcaseIcon className="mr-2 h-4 w-4" />
                Business Details
              </TabsTrigger>
            )}
            <TabsTrigger value="security" className="flex items-center">
              <KeyIcon className="mr-2 h-4 w-4" />
              Security
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>
                  Update your personal details and contact information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...profileForm}>
                  <form id="profile-form" onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                    <FormField
                      control={profileForm.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <div className="flex items-center border rounded-md focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary">
                              <UserIcon className="h-4 w-4 ml-3 text-gray-400" />
                              <Input placeholder="Your full name" className="border-0 focus-visible:ring-0" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={profileForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <div className="flex items-center border rounded-md focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary">
                              <AtSign className="h-4 w-4 ml-3 text-gray-400" />
                              <Input placeholder="Your email address" className="border-0 focus-visible:ring-0" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={profileForm.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address</FormLabel>
                          <FormControl>
                            <div className="flex items-center border rounded-md focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary">
                              <MapPinIcon className="h-4 w-4 ml-3 text-gray-400" />
                              <Input placeholder="Your address" className="border-0 focus-visible:ring-0" {...field} />
                            </div>
                          </FormControl>
                          <FormDescription>
                            Your home address for pickups
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={profileForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <div className="flex items-center border rounded-md focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary">
                              <PhoneIcon className="h-4 w-4 ml-3 text-gray-400" />
                              <Input placeholder="Your phone number" className="border-0 focus-visible:ring-0" {...field} />
                            </div>
                          </FormControl>
                          <FormDescription>
                            For pickup confirmation and notifications
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </form>
                </Form>
              </CardContent>
              <CardFooter className="flex justify-end border-t p-6">
                <Button form="profile-form" type="submit" disabled={updateProfileMutation.isPending}>
                  {updateProfileMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {isBusinessUser && (
            <TabsContent value="business">
              <Card>
                <CardHeader>
                  <CardTitle>{user?.role === 'collector' ? 'Collector' : 'Recycler'} Business Information</CardTitle>
                  <CardDescription>
                    Update your business details and certification information
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...businessForm}>
                    <form id="business-form" onSubmit={businessForm.handleSubmit(onBusinessSubmit)} className="space-y-6">
                      {/* Business Type and Name Section */}
                      <div className="border-b border-border pb-6">
                        <h3 className="text-lg font-semibold mb-4">Business Information</h3>
                        
                        <FormField
                          control={businessForm.control}
                          name="businessType"
                          render={({ field }) => (
                            <FormItem className="mb-4">
                              <FormLabel>Business Type</FormLabel>
                              <FormControl>
                                <RadioGroup
                                  onValueChange={field.onChange}
                                  value={field.value}
                                  className="flex flex-col space-y-1"
                                >
                                  <FormItem className="flex items-center space-x-3 space-y-0">
                                    <FormControl>
                                      <RadioGroupItem value="individual" />
                                    </FormControl>
                                    <FormLabel className="font-normal">
                                      Individual Operator
                                    </FormLabel>
                                  </FormItem>
                                  <FormItem className="flex items-center space-x-3 space-y-0">
                                    <FormControl>
                                      <RadioGroupItem value="organization" />
                                    </FormControl>
                                    <FormLabel className="font-normal">
                                      Organization/Company
                                    </FormLabel>
                                  </FormItem>
                                </RadioGroup>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={businessForm.control}
                          name="businessName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Business Name</FormLabel>
                              <FormControl>
                                <div className="flex items-center border rounded-md focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary">
                                  <Building2Icon className="h-4 w-4 ml-3 text-gray-400" />
                                  <Input 
                                    placeholder={businessForm.watch("businessType") === "individual" 
                                      ? "Your business or trading name" 
                                      : "Official company name"} 
                                    className="border-0 focus-visible:ring-0" 
                                    {...field} 
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      {/* Service Details Section */}
                      <div className="border-b border-border pb-6">
                        <h3 className="text-lg font-semibold mb-4">Service Details</h3>
                        
                        <FormField
                          control={businessForm.control}
                          name="serviceLocation"
                          render={({ field }) => (
                            <FormItem className="mb-4">
                              <FormLabel>Service Area/Location</FormLabel>
                              <FormControl>
                                <div className="flex items-center border rounded-md focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary">
                                  <MapIcon className="h-4 w-4 ml-3 text-gray-400" />
                                  <Input 
                                    placeholder="e.g. Nyahururu, Laikipia County" 
                                    className="border-0 focus-visible:ring-0" 
                                    {...field} 
                                  />
                                </div>
                              </FormControl>
                              <FormDescription>
                                Specify the areas where you operate
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={businessForm.control}
                          name="serviceType"
                          render={({ field }) => (
                            <FormItem className="mb-4">
                              <FormLabel>Service Type</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select service type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="pickup">Pickup Only</SelectItem>
                                  <SelectItem value="drop_off">Drop-off Only</SelectItem>
                                  <SelectItem value="both">Both Pickup and Drop-off</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={businessForm.control}
                          name="operatingHours"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Operating Hours</FormLabel>
                              <FormControl>
                                <div className="flex items-center border rounded-md focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary">
                                  <Clock4Icon className="h-4 w-4 ml-3 text-gray-400" />
                                  <Input 
                                    placeholder="e.g. Mon-Fri: 8am-5pm, Sat: 9am-2pm" 
                                    className="border-0 focus-visible:ring-0" 
                                    {...field} 
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      {/* Waste Specialization Section */}
                      <div className="border-b border-border pb-6">
                        <h3 className="text-lg font-semibold mb-4">Waste Specialization</h3>
                        
                        <FormField
                          control={businessForm.control}
                          name="wasteSpecialization"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>What types of waste do you handle?</FormLabel>
                              <FormDescription className="mb-3">
                                Select all that apply
                              </FormDescription>
                              <div className="grid grid-cols-2 gap-4">
                                {Object.entries(WasteType).map(([key, value]) => (
                                  <FormItem
                                    key={key}
                                    className="flex flex-row items-start space-x-3 space-y-0"
                                  >
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(value)}
                                        onCheckedChange={(checked) => {
                                          const currentValues = field.value || [];
                                          if (checked) {
                                            field.onChange([...currentValues, value]);
                                          } else {
                                            field.onChange(
                                              currentValues.filter((v) => v !== value)
                                            );
                                          }
                                        }}
                                      />
                                    </FormControl>
                                    <FormLabel className="font-normal cursor-pointer">
                                      {value.charAt(0).toUpperCase() + value.slice(1)}
                                    </FormLabel>
                                  </FormItem>
                                ))}
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Certification Section */}
                      <div className="border-b border-border pb-6">
                        <h3 className="text-lg font-semibold mb-4">Certification Information</h3>
                        
                        <FormField
                          control={businessForm.control}
                          name="isCertified"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 mb-4">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>
                                  I have waste management certification
                                </FormLabel>
                                <FormDescription>
                                  Check this if you have any certification from NEMA or other waste management authorities
                                </FormDescription>
                              </div>
                            </FormItem>
                          )}
                        />
                        
                        {businessForm.watch("isCertified") && (
                          <FormField
                            control={businessForm.control}
                            name="certificationDetails"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Certification Details</FormLabel>
                                <FormControl>
                                  <Textarea
                                    placeholder="Provide details about your certification (e.g. NEMA certification number, date issued, etc.)"
                                    className="min-h-[100px]"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}
                      </div>
                      
                      {/* Contact Person Section (only for organizations) */}
                      {businessForm.watch("businessType") === "organization" && (
                        <div className="border-b border-border pb-6">
                          <h3 className="text-lg font-semibold mb-4">Contact Person Information</h3>
                          
                          <FormField
                            control={businessForm.control}
                            name="contactPersonName"
                            render={({ field }) => (
                              <FormItem className="mb-4">
                                <FormLabel>Contact Person Name</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="Full name of the primary contact person" 
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={businessForm.control}
                            name="contactPersonPosition"
                            render={({ field }) => (
                              <FormItem className="mb-4">
                                <FormLabel>Position</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="e.g. Manager, Environmental Officer, etc." 
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={businessForm.control}
                              name="contactPersonEmail"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Email</FormLabel>
                                  <FormControl>
                                    <Input 
                                      type="email"
                                      placeholder="Contact person's email address" 
                                      {...field} 
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={businessForm.control}
                              name="contactPersonPhone"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Phone Number</FormLabel>
                                  <FormControl>
                                    <Input 
                                      placeholder="Contact person's phone number" 
                                      {...field} 
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      )}
                    </form>
                  </Form>
                </CardContent>
                <CardFooter className="flex justify-end border-t p-6">
                  <Button form="business-form" type="submit" disabled={updateBusinessMutation.isPending}>
                    {updateBusinessMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Update Business Information
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          )}
          
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>
                  Update your password to keep your account secure
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...passwordForm}>
                  <form id="password-form" onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6">
                    <Alert className="bg-muted/50">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Password requirements</AlertTitle>
                      <AlertDescription>
                        Your password must be at least 8 characters long
                      </AlertDescription>
                    </Alert>
                  
                    <FormField
                      control={passwordForm.control}
                      name="currentPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Enter your current password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={passwordForm.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Enter your new password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={passwordForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm New Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Confirm your new password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </form>
                </Form>
              </CardContent>
              <CardFooter className="flex justify-end border-t p-6">
                <Button form="password-form" type="submit" disabled={updatePasswordMutation.isPending}>
                  {updatePasswordMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Update Password
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      
      <MobileNavigation />
      <Footer />
    </div>
  );
}