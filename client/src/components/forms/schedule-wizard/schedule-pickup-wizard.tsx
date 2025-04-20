import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Collection, WasteType } from "@shared/schema";
import { wasteTypeConfig } from "@/lib/types";
import { Loader2, Package2, BadgeCheck, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

// Steps
import WasteDetailsStep from "./steps/waste-details-step";
import LocationStep from "./steps/location-step";
import ScheduleStep from "./steps/schedule-step";
import ReviewStep from "./steps/review-step";

// Define form schema
const formSchema = z.object({
  wasteType: z.string({
    required_error: "Please select the type of waste",
  }),
  wasteDescription: z.string().optional(),
  wasteAmount: z.coerce
    .number({ 
      required_error: "Please enter the amount of waste",
      invalid_type_error: "Amount must be a number"
    })
    .min(1, "Amount must be at least 1 kg")
    .max(1000, "Amount cannot exceed 1000 kg"),
  scheduledDate: z.date({
    required_error: "Please select a date and time",
  }),
  address: z.string().min(5, "Address must be at least 5 characters"),
  location: z.object({
    lat: z.number(),
    lng: z.number()
  }).optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface SchedulePickupWizardProps {
  collectionToEdit?: Collection | null;
  onSuccess?: () => void;
}

export default function SchedulePickupWizard({ collectionToEdit, onSuccess }: SchedulePickupWizardProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [location, navigate] = useLocation();
  const [currentStep, setCurrentStep] = useState(0);
  const [isRescheduling, setIsRescheduling] = useState<boolean>(false);
  
  // Define steps
  const steps = [
    { id: "waste-details", title: "Waste Details", subtitle: "Classify your waste" },
    { id: "location", title: "Location", subtitle: "Where to collect" },
    { id: "schedule", title: "Schedule", subtitle: "Pick a time" },
    { id: "review", title: "Review & Confirm", subtitle: "Verify details" },
  ];
  
  // Form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      address: user?.address || "",
      wasteAmount: 10, // Default to 10kg
      notes: "",
    },
    mode: "onChange", // Validate on change for immediate feedback
  });
  
  // Initialize form with collection data if provided directly
  useEffect(() => {
    if (collectionToEdit) {
      setIsRescheduling(true);
      form.reset({
        wasteType: collectionToEdit.wasteType,
        wasteDescription: collectionToEdit.wasteDescription || "",
        wasteAmount: collectionToEdit.wasteAmount || 10,
        scheduledDate: new Date(collectionToEdit.scheduledDate),
        address: collectionToEdit.address,
        notes: collectionToEdit.notes || "",
      });
    } else {
      // Reset the form if no collection is being edited
      setIsRescheduling(false);
      form.reset({
        address: user?.address || "",
        wasteAmount: 10,
        wasteDescription: "",
        notes: "",
      });
    }
  }, [collectionToEdit, form, user?.address]);
  
  // Create new collection
  const schedulePickupMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      // Ensure the date is passed as a string in ISO format
      const formattedValues = {
        ...values,
        scheduledDate: values.scheduledDate.toISOString(),
      };
      
      const res = await apiRequest("POST", "/api/collections", formattedValues);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Pickup scheduled",
        description: "Your waste collection has been scheduled successfully"
      });
      // Invalidate all relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/collections"] });
      queryClient.invalidateQueries({ queryKey: ["/api/collections/upcoming"] });
      queryClient.invalidateQueries({ queryKey: ["/api/impact"] });
      queryClient.invalidateQueries({ queryKey: ["/api/impact/waste-types"] });
      queryClient.invalidateQueries({ queryKey: ["/api/impact/monthly"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] }); // Important: Also refresh user data for points
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      } else {
        navigate("/");
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to schedule pickup",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Update existing collection
  const reschedulePickupMutation = useMutation({
    mutationFn: async (values: FormValues & { id: number }) => {
      const { id, ...formValues } = values;
      
      // Ensure the date is passed as a string in ISO format
      const formattedValues = {
        ...formValues,
        scheduledDate: values.scheduledDate.toISOString(),
      };
      
      const res = await apiRequest("PATCH", `/api/collections/${id}`, formattedValues);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Pickup rescheduled",
        description: "Your waste collection has been rescheduled successfully"
      });
      // Invalidate all relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/collections"] });
      queryClient.invalidateQueries({ queryKey: ["/api/collections/upcoming"] });
      queryClient.invalidateQueries({ queryKey: ["/api/impact"] });
      queryClient.invalidateQueries({ queryKey: ["/api/impact/waste-types"] });
      queryClient.invalidateQueries({ queryKey: ["/api/impact/monthly"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] }); // Important: Also refresh user data for points
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      } else {
        navigate("/");
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to reschedule pickup",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Handle form submission
  function onSubmit(values: FormValues) {
    if (isRescheduling && collectionToEdit) {
      reschedulePickupMutation.mutate({ ...values, id: collectionToEdit.id });
    } else {
      schedulePickupMutation.mutate(values);
    }
  }
  
  // Form submission is only done in the last step
  const handleNext = async () => {
    // Get the fields that should be validated in the current step
    let fieldsToValidate: string[] = [];
    
    switch (currentStep) {
      case 0: // Waste Details
        fieldsToValidate = ["wasteType", "wasteDescription", "wasteAmount"];
        break;
      case 1: // Location
        fieldsToValidate = ["address"];
        break;
      case 2: // Schedule
        fieldsToValidate = ["scheduledDate"];
        break;
      case 3: // Review & Submit
        await form.handleSubmit(onSubmit)();
        return; // Don't increment step after submission
    }
    
    // Validate only the fields from current step
    const result = await form.trigger(fieldsToValidate as any[]);
    
    if (result) {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
    }
  };
  
  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };
  
  // Calculate estimated points based on waste type and amount
  const calculateEstimatedPoints = (): number => {
    const wasteType = form.watch("wasteType");
    const wasteAmount = form.watch("wasteAmount") || 0;
    
    if (!wasteType) return 0;
    
    const pointsPerKg = wasteTypeConfig[wasteType]?.points / 10 || 0; // Points per kg (standard is per 10kg)
    return Math.round(pointsPerKg * wasteAmount);
  };
  
  // Provide form state and submission handlers to steps
  return (
    <div className="space-y-6">
      {/* Step indicators */}
      <div className="flex justify-between mb-8">
        {steps.map((step, index) => (
          <div key={step.id} className="text-center flex-1">
            <div className="flex flex-col items-center">
              <div 
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  index < currentStep 
                    ? "bg-primary text-primary-foreground" // Completed step
                    : index === currentStep
                      ? "bg-primary text-primary-foreground" // Current step
                      : "bg-muted text-muted-foreground" // Future step
                }`}
              >
                {index < currentStep ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>
              <div className="mt-2">
                <p className={`text-sm font-medium ${index === currentStep ? "text-primary" : "text-muted-foreground"}`}>
                  {step.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  {step.subtitle}
                </p>
              </div>
            </div>
            {/* Connector line between steps */}
            {index < steps.length - 1 && (
              <div className="hidden sm:block w-full h-1 absolute top-5 left-0 transform translate-x-1/2 -z-10">
                <div 
                  className={`h-0.5 ${
                    index < currentStep ? "bg-primary" : "bg-muted"
                  }`} 
                  style={{width: "calc(100% - 2.5rem)"}}
                ></div>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Step content */}
      <div className="mt-8">
        {currentStep === 0 && (
          <WasteDetailsStep 
            form={form} 
            calculateEstimatedPoints={calculateEstimatedPoints}
          />
        )}
        
        {currentStep === 1 && (
          <LocationStep form={form} />
        )}
        
        {currentStep === 2 && (
          <ScheduleStep form={form} />
        )}
        
        {currentStep === 3 && (
          <ReviewStep 
            form={form} 
            calculateEstimatedPoints={calculateEstimatedPoints}
            isRescheduling={isRescheduling}
          />
        )}
      </div>
      
      {/* Navigation buttons */}
      <div className="flex justify-between mt-8">
        <Button
          type="button"
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 0 || schedulePickupMutation.isPending || reschedulePickupMutation.isPending}
        >
          Previous
        </Button>
        
        <Button
          type="button"
          onClick={handleNext}
          disabled={schedulePickupMutation.isPending || reschedulePickupMutation.isPending}
        >
          {schedulePickupMutation.isPending || reschedulePickupMutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : currentStep === steps.length - 1 ? (
            <>
              <BadgeCheck className="mr-2 h-4 w-4" />
              {isRescheduling ? 'Reschedule Pickup' : 'Schedule Pickup'}
            </>
          ) : (
            'Next'
          )}
        </Button>
      </div>
    </div>
  );
}