import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Loader2, CheckCircle2 } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { UserRole } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";

// Define the organization onboarding schema
const organizationOnboardingSchema = z.object({
  organizationType: z.string({
    required_error: "Please select an organization type",
  }),
  organizationName: z.string().min(2, "Organization name must be at least 2 characters"),
  contactPersonName: z.string().min(2, "Contact person name must be at least 2 characters"),
  contactPersonPosition: z.string().min(2, "Position must be at least 2 characters"),
  contactPersonPhone: z.string().min(5, "Phone number must be at least 5 characters"),
  contactPersonEmail: z.string().email("Please enter a valid email address"),
});

type OrganizationOnboardingValues = z.infer<typeof organizationOnboardingSchema>;

// Define the collector/recycler onboarding schema
const collectorRecyclerOnboardingSchema = z.object({
  // Business information
  businessType: z.enum(["individual", "organization"], {
    required_error: "Please select business type",
  }),
  businessName: z.string().min(2, "Business name must be at least 2 characters"),
  
  // Contact information (required for organizations)
  contactPersonName: z.string().min(2, "Name must be at least 2 characters").optional()
    .refine(val => val !== undefined && val !== "", {
      message: "Contact person name is required for organizations",
      path: ["contactPersonName"],
    }),
  contactPersonPosition: z.string().optional(),
  contactPersonPhone: z.string().optional()
    .refine(val => val !== undefined && val !== "", {
      message: "Contact phone is required for organizations",
      path: ["contactPersonPhone"],
    }),
  contactPersonEmail: z.string().email("Please enter a valid email").optional()
    .refine(val => val !== undefined && val !== "", {
      message: "Contact email is required for organizations",
      path: ["contactPersonEmail"],
    }),
  
  // Service details
  serviceLocation: z.string().min(2, "Service location is required"),
  serviceType: z.enum(["pickup", "drop_off", "both"], {
    required_error: "Please select service type",
  }),
  operatingHours: z.string().optional(),
  
  // Waste specialization - Multi-select
  wasteSpecialization: z.array(z.string()).min(1, "Select at least one waste type"),
  
  // Certification
  isCertified: z.enum(["true", "false"]),
  certificationDetails: z.string().optional(),
});

type CollectorRecyclerOnboardingValues = z.infer<typeof collectorRecyclerOnboardingSchema>;

// For submission, transform the string to boolean
type CollectorRecyclerSubmitValues = {
  businessType: string;
  businessName: string;
  contactPersonName?: string;
  contactPersonPosition?: string;
  contactPersonPhone?: string;
  contactPersonEmail?: string;
  serviceLocation: string;
  serviceType: string;
  operatingHours?: string;
  wasteSpecialization: string[];
  isCertified: boolean;
  certificationDetails?: string;
  onboardingCompleted: boolean;
};

export default function OnboardingPage() {
  const { user, isLoading } = useAuth();
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  
  // Redirect if not logged in
  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/auth");
    } else if (user?.onboardingCompleted) {
      navigate("/dashboard");
    }
  }, [user, isLoading, navigate]);
  
  // Organization onboarding form
  const organizationForm = useForm<OrganizationOnboardingValues>({
    resolver: zodResolver(organizationOnboardingSchema),
    defaultValues: {
      organizationType: "",
      organizationName: "",
      contactPersonName: "",
      contactPersonPosition: "",
      contactPersonPhone: "",
      contactPersonEmail: "",
    },
  });
  
  // Collector/Recycler onboarding form
  const collectorRecyclerForm = useForm<CollectorRecyclerOnboardingValues>({
    resolver: zodResolver(collectorRecyclerOnboardingSchema),
    defaultValues: {
      businessType: undefined,
      businessName: "",
      contactPersonName: "",
      contactPersonPosition: "",
      contactPersonPhone: "",
      contactPersonEmail: "",
      serviceLocation: "",
      serviceType: undefined,
      operatingHours: "",
      wasteSpecialization: [],
      isCertified: "false",
      certificationDetails: "",
    },
  });
  
  // Onboarding mutation using dedicated endpoint
  const completeOnboardingMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/onboarding", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Onboarding completed!",
        description: "Your profile has been set up successfully.",
        variant: "default",
      });
      navigate("/dashboard");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to complete onboarding. Please try again.",
        variant: "destructive",
      });
      console.error(error);
      setSubmitting(false);
    },
  });
  
  function onOrganizationSubmit(values: OrganizationOnboardingValues) {
    setSubmitting(true);
    completeOnboardingMutation.mutate({
      ...values,
      onboardingCompleted: true,
    });
  }
  
  function onCollectorRecyclerSubmit(values: CollectorRecyclerOnboardingValues) {
    setSubmitting(true);
    // Transform string to boolean for the API
    const submitData: CollectorRecyclerSubmitValues = {
      // Business information
      businessType: values.businessType,
      businessName: values.businessName,
      
      // Contact information (required for organizations)
      ...(values.businessType === "organization" && {
        contactPersonName: values.contactPersonName,
        contactPersonPosition: values.contactPersonPosition,
        contactPersonPhone: values.contactPersonPhone,
        contactPersonEmail: values.contactPersonEmail,
      }),
      
      // Service details
      serviceLocation: values.serviceLocation,
      serviceType: values.serviceType,
      operatingHours: values.operatingHours,
      
      // Waste specialization
      wasteSpecialization: values.wasteSpecialization,
      
      // Certification
      isCertified: values.isCertified === "true",
      certificationDetails: values.certificationDetails,
      
      // Common
      onboardingCompleted: true
    };
    completeOnboardingMutation.mutate(submitData);
  }
  
  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // Content based on user role
  let content;
  if (user.role === UserRole.ORGANIZATION) {
    content = (
      <Card className="w-full max-w-3xl mx-auto shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-montserrat text-secondary">Organization Details</CardTitle>
          <CardDescription>Please provide additional information about your organization</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...organizationForm}>
            <form onSubmit={organizationForm.handleSubmit(onOrganizationSubmit)} className="space-y-6">
              <FormField
                control={organizationForm.control}
                name="organizationType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Organization Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select organization type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="business">Business</SelectItem>
                        <SelectItem value="non_profit">Non-Profit</SelectItem>
                        <SelectItem value="government">Government Agency</SelectItem>
                        <SelectItem value="education">Educational Institution</SelectItem>
                        <SelectItem value="community_group">Community Group</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={organizationForm.control}
                name="organizationName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Organization Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your organization's name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="border-t border-border pt-6 mt-6">
                <h3 className="text-lg font-semibold mb-4">Contact Person Details</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={organizationForm.control}
                    name="contactPersonName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Person Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Full name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={organizationForm.control}
                    name="contactPersonPosition"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Position/Title</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Sustainability Manager" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                  <FormField
                    control={organizationForm.control}
                    name="contactPersonPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="+1 (555) 123-4567" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={organizationForm.control}
                    name="contactPersonEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="contact@organization.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              <Button 
                type="submit" 
                className="w-full mt-6" 
                disabled={submitting}
              >
                {submitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Complete Setup
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    );
  } else if (user.role === UserRole.COLLECTOR || user.role === UserRole.RECYCLER) {
    content = (
      <Card className="w-full max-w-3xl mx-auto shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-montserrat text-secondary">
            {user.role === UserRole.COLLECTOR ? "Collector Certification" : "Recycler Certification"}
          </CardTitle>
          <CardDescription>Please provide additional information about your certification status</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...collectorRecyclerForm}>
            <form onSubmit={collectorRecyclerForm.handleSubmit(onCollectorRecyclerSubmit)} className="space-y-6">
              <FormField
                control={collectorRecyclerForm.control}
                name="isCertified"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Are you certified by a regulatory body?</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value?.toString()}
                        className="flex flex-col space-y-1"
                      >
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="true" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            Yes, I have certification
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="false" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            No, I don't have certification
                          </FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {collectorRecyclerForm.watch("isCertified") === "true" && (
                <FormField
                  control={collectorRecyclerForm.control}
                  name="certificationDetails"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Certification Details</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Please provide details about your certification, including the issuing body, certification number, and expiry date." 
                          className="min-h-[100px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              <div className="bg-secondary/5 rounded-lg p-4 mt-6">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-medium text-secondary">Why this matters</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Having certification information helps us verify that waste is being handled according to regulations. 
                      It also builds trust with users who can see that their waste is being processed properly.
                    </p>
                  </div>
                </div>
              </div>
              
              <Button 
                type="submit" 
                className="w-full mt-6" 
                disabled={submitting}
              >
                {submitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Complete Setup
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    );
  } else {
    // For households, just set onboarding as completed and redirect
    useEffect(() => {
      if (user && user.role === UserRole.HOUSEHOLD && !user.onboardingCompleted) {
        completeOnboardingMutation.mutate({ onboardingCompleted: true });
      }
    }, [user]);
    
    content = (
      <div className="flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-montserrat font-bold text-secondary">Complete Your PipaPal Profile</h1>
          <p className="text-muted-foreground mt-2">We need a few additional details to customize your experience</p>
        </div>
        
        {content}
      </div>
    </div>
  );
}