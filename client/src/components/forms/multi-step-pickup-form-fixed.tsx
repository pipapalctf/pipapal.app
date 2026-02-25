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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Card, 
  CardContent, 
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";
import { 
  CalendarIcon, 
  Loader2, 
  Trash2, 
  BadgeCheck,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Check,
  MapPin,
  Clock,
  Scale,
  FileText,
  Clipboard,
  AlertCircle,
  Building,
  Gift as GiftIcon,
  LocateFixed
} from "lucide-react";
import { iconMap } from "@/components/ui/icon-badge";
import { WasteType, WasteTypeValue, Collection } from "@shared/schema";
import { wasteTypeConfig } from "@/lib/types";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import React, { useState, useEffect } from "react";

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
  city: z.string({
    required_error: "Please select a county",
  }),
  address: z.string().min(5, "Address must be at least 5 characters"),
  notes: z.string().optional(),
  // Confirmation checkbox for submission
  confirmSubmission: z.boolean().optional().default(false),
});

type FormValues = z.infer<typeof formSchema>;

interface MultiStepPickupFormProps {
  collectionToEdit?: Collection | null;
  onSuccess?: () => void;
}

// Define step names for clarity
enum FormStep {
  WASTE_DETAILS = 0,
  LOCATION = 1,
  SCHEDULE = 2,
  REVIEW = 3
}

const KENYA_COUNTIES = [
  { value: "baringo", name: "Baringo", lat: 0.4913, lng: 35.7426 },
  { value: "bomet", name: "Bomet", lat: -0.7813, lng: 35.3416 },
  { value: "bungoma", name: "Bungoma", lat: 0.5635, lng: 34.5608 },
  { value: "busia", name: "Busia", lat: 0.4347, lng: 34.2422 },
  { value: "elgeyo-marakwet", name: "Elgeyo-Marakwet", lat: 0.6780, lng: 35.5082 },
  { value: "embu", name: "Embu", lat: -0.5388, lng: 37.4593 },
  { value: "garissa", name: "Garissa", lat: -0.4532, lng: 39.6461 },
  { value: "homa-bay", name: "Homa Bay", lat: -0.5273, lng: 34.4571 },
  { value: "isiolo", name: "Isiolo", lat: 0.3546, lng: 37.5822 },
  { value: "kajiado", name: "Kajiado", lat: -2.0981, lng: 36.7820 },
  { value: "kakamega", name: "Kakamega", lat: 0.2827, lng: 34.7519 },
  { value: "kericho", name: "Kericho", lat: -0.3692, lng: 35.2863 },
  { value: "kiambu", name: "Kiambu", lat: -1.1714, lng: 36.8355 },
  { value: "kilifi", name: "Kilifi", lat: -3.5107, lng: 39.9093 },
  { value: "kirinyaga", name: "Kirinyaga", lat: -0.4989, lng: 37.2803 },
  { value: "kisii", name: "Kisii", lat: -0.6813, lng: 34.7668 },
  { value: "kisumu", name: "Kisumu", lat: -0.1022, lng: 34.7617 },
  { value: "kitui", name: "Kitui", lat: -1.3679, lng: 38.0106 },
  { value: "kwale", name: "Kwale", lat: -4.1816, lng: 39.4521 },
  { value: "laikipia", name: "Laikipia", lat: 0.3606, lng: 36.7819 },
  { value: "lamu", name: "Lamu", lat: -2.2717, lng: 40.9020 },
  { value: "machakos", name: "Machakos", lat: -1.5177, lng: 37.2634 },
  { value: "makueni", name: "Makueni", lat: -1.8039, lng: 37.6195 },
  { value: "mandera", name: "Mandera", lat: 3.9373, lng: 41.8569 },
  { value: "marsabit", name: "Marsabit", lat: 2.3284, lng: 37.9909 },
  { value: "meru", name: "Meru", lat: 0.0480, lng: 37.6559 },
  { value: "migori", name: "Migori", lat: -1.0634, lng: 34.4731 },
  { value: "mombasa", name: "Mombasa", lat: -4.0435, lng: 39.6682 },
  { value: "muranga", name: "Murang'a", lat: -0.7839, lng: 37.1522 },
  { value: "nairobi", name: "Nairobi", lat: -1.2921, lng: 36.8219 },
  { value: "nakuru", name: "Nakuru", lat: -0.3031, lng: 36.0800 },
  { value: "nandi", name: "Nandi", lat: 0.1836, lng: 35.1269 },
  { value: "narok", name: "Narok", lat: -1.0878, lng: 35.8605 },
  { value: "nyamira", name: "Nyamira", lat: -0.5633, lng: 34.9349 },
  { value: "nyandarua", name: "Nyandarua", lat: -0.1804, lng: 36.5234 },
  { value: "nyeri", name: "Nyeri", lat: -0.4197, lng: 36.9510 },
  { value: "samburu", name: "Samburu", lat: 1.2150, lng: 36.9541 },
  { value: "siaya", name: "Siaya", lat: -0.0617, lng: 34.2422 },
  { value: "taita-taveta", name: "Taita-Taveta", lat: -3.3162, lng: 38.4850 },
  { value: "tana-river", name: "Tana River", lat: -1.8012, lng: 39.6397 },
  { value: "tharaka-nithi", name: "Tharaka-Nithi", lat: -0.3070, lng: 37.7230 },
  { value: "trans-nzoia", name: "Trans Nzoia", lat: 1.0567, lng: 34.9507 },
  { value: "turkana", name: "Turkana", lat: 3.3122, lng: 35.5658 },
  { value: "uasin-gishu", name: "Uasin Gishu", lat: 0.5143, lng: 35.2698 },
  { value: "vihiga", name: "Vihiga", lat: 0.0837, lng: 34.7073 },
  { value: "wajir", name: "Wajir", lat: 1.7471, lng: 40.0573 },
  { value: "west-pokot", name: "West Pokot", lat: 1.6210, lng: 35.1190 },
];

export default function MultiStepPickupForm({ collectionToEdit, onSuccess }: MultiStepPickupFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [, navigate] = useLocation();
  
  // Form state
  const [currentStep, setCurrentStep] = useState<FormStep>(FormStep.WASTE_DETAILS);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  
  // Initialize form with default values or edit values
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      wasteType: collectionToEdit?.wasteType || "",
      wasteDescription: collectionToEdit?.wasteDescription || "",
      wasteAmount: collectionToEdit?.wasteAmount || 0,
      address: collectionToEdit?.address || "",
      notes: collectionToEdit?.notes || "",
      city: collectionToEdit?.city || "",
      scheduledDate: collectionToEdit?.scheduledDate 
        ? new Date(collectionToEdit.scheduledDate) 
        : new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      confirmSubmission: false,
    },
  });
  
  // Watch form values for use in UI
  const watchedValues = form.watch();
  
  // Track submission success state
  const [isSubmitSuccess, setIsSubmitSuccess] = useState<boolean>(false);
  
  // Create mutation for saving collection
  const createCollectionMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      // Format the date as ISO string and exclude UI-only fields
      const { confirmSubmission, ...dataToSend } = data;
      const formattedData = {
        ...dataToSend,
        scheduledDate: data.scheduledDate.toISOString(),
        // Add the city name to make it easier to read in the database
        cityName: KENYA_COUNTIES.find(c => c.value === data.city)?.name,
      };
      
      // Handle edit vs create
      if (collectionToEdit) {
        const res = await apiRequest(
          "PATCH", 
          `/api/collections/${collectionToEdit.id}`, 
          formattedData
        );
        return await res.json();
      } else {
        const res = await apiRequest("POST", "/api/collections", formattedData);
        return await res.json();
      }
    },
    onSuccess: () => {
      // Set success state
      setIsSubmitSuccess(true);
      setIsSubmitting(false);
      
      toast({
        title: collectionToEdit ? "Collection Updated" : "Collection Scheduled",
        description: collectionToEdit 
          ? "Your collection has been updated successfully."
          : "Your waste collection has been scheduled successfully.",
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/collections'] });
      queryClient.invalidateQueries({ queryKey: ['/api/collections/upcoming'] });
      
      // After a delay, either reset form or navigate away
      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        } else if (collectionToEdit) {
          // Navigate back to dashboard if editing
          navigate("/");
        } else {
          // Reset form if not editing and no callback
          form.reset({
            wasteType: "",
            wasteDescription: "",
            wasteAmount: 0,
            address: "",
            notes: "",
            city: "",
            scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
            confirmSubmission: false,
          });
          setCurrentStep(FormStep.WASTE_DETAILS);
          setIsSubmitSuccess(false);
        }
      }, 2000); // Show success state for 2 seconds
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to schedule collection: ${error.message}`,
        variant: "destructive",
      });
      setIsSubmitting(false);
    },
  });
  
  // Handle form submission
  const onSubmit = (values: FormValues) => {
    // Ensure checkbox is checked before submission
    if (currentStep === FormStep.REVIEW && !values.confirmSubmission) {
      toast({
        title: "Confirmation Required",
        description: "Please confirm your request by checking the confirmation box",
        variant: "destructive",
      });
      return;
    }
    
    // Scroll to top of the page smoothly
    window.scrollTo({ 
      top: 0, 
      behavior: 'smooth' 
    });
    
    setIsSubmitting(true);
    createCollectionMutation.mutate(values);
  };
  
  // Progress bar calculation
  const progress = ((currentStep + 1) / (Object.keys(FormStep).length / 2)) * 100;
  
  // Navigate to next step
  const nextStep = () => {
    // First validate current step
    let fieldsToValidate: (keyof FormValues)[] = [];
    
    // Determine which fields to validate based on current step
    switch (currentStep) {
      case FormStep.WASTE_DETAILS:
        fieldsToValidate = ['wasteType', 'wasteAmount'];
        break;
      case FormStep.LOCATION:
        fieldsToValidate = ['city', 'address'];
        break;
      case FormStep.SCHEDULE:
        fieldsToValidate = ['scheduledDate'];
        break;
      default:
        break;
    }
    
    // Validate the fields for current step
    form.trigger(fieldsToValidate).then((isValid) => {
      if (isValid) {
        if (currentStep < FormStep.REVIEW) {
          setCurrentStep(prevStep => (prevStep + 1) as FormStep);
          
          // Scroll to top of the page smoothly
          window.scrollTo({ 
            top: 0, 
            behavior: 'smooth' 
          });
        }
      }
    });
  };
  
  // Navigate to previous step
  const prevStep = () => {
    if (currentStep > FormStep.WASTE_DETAILS) {
      setCurrentStep(prevStep => (prevStep - 1) as FormStep);
      
      // Scroll to top of the page smoothly
      window.scrollTo({ 
        top: 0, 
        behavior: 'smooth' 
      });
    }
  };
  
  // Render waste type step
  const renderWasteDetailsStep = () => (
    <div className="space-y-6">
      {/* Waste Type */}
      <FormField
        control={form.control}
        name="wasteType"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Waste Type</FormLabel>
            <Select 
              onValueChange={field.onChange} 
              defaultValue={field.value}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select waste type" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {Object.entries(wasteTypeConfig).map(([value, config]) => (
                  <SelectItem key={value} value={value}>
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center">
                        {config.icon && iconMap[config.icon] && (
                          <span className={`mr-2 ${config.textColor}`}>
                            {React.createElement(iconMap[config.icon], { className: "h-4 w-4" })}
                          </span>
                        )}
                        {config.label}
                      </div>
                      <div className="ml-2 px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                        +{config.points} points/kg
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormDescription>
              Select the primary type of waste for collection
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      
      {/* Waste Amount */}
      <FormField
        control={form.control}
        name="wasteAmount"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Estimated Amount (kg)</FormLabel>
            <FormControl>
              <div className="flex items-center">
                <Input
                  type="number"
                  min={1}
                  max={1000}
                  {...field}
                  className="w-full"
                />
                <div className="ml-2 text-sm text-muted-foreground">kg</div>
              </div>
            </FormControl>
            <FormDescription>
              Estimate the weight of waste in kilograms. This helps the collector prepare accordingly.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      
      {/* Waste Description */}
      <FormField
        control={form.control}
        name="wasteDescription"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Description (Optional)</FormLabel>
            <FormControl>
              <Textarea 
                placeholder="Provide more details about the waste (e.g., '3 boxes of paper, 2 bags of plastic bottles')" 
                className="min-h-24 resize-none"
                {...field} 
              />
            </FormControl>
            <FormDescription>
              Add details to help the collector identify your waste
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      
      {/* Show waste info card if waste type is selected */}
      {watchedValues.wasteType && (
        <div className="mt-4">
          <Card className={`border ${
            wasteTypeConfig[watchedValues.wasteType as WasteTypeValue]?.bgColor || 'bg-card'
          }`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center">
                  {wasteTypeConfig[watchedValues.wasteType as WasteTypeValue]?.icon && (
                    <span className={`mr-2 ${wasteTypeConfig[watchedValues.wasteType as WasteTypeValue]?.textColor}`}>
                      {React.createElement(iconMap[wasteTypeConfig[watchedValues.wasteType as WasteTypeValue]?.icon], { className: "h-5 w-5" })}
                    </span>
                  )}
                  {wasteTypeConfig[watchedValues.wasteType as WasteTypeValue]?.label} Waste
                </CardTitle>
                <div className="px-3 py-1 rounded-full bg-primary/20 text-primary font-medium flex items-center">
                  <GiftIcon className="h-3 w-3 mr-1" />
                  {wasteTypeConfig[watchedValues.wasteType as WasteTypeValue]?.points} points/kg
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-sm">
                <p className="mb-2">{wasteTypeConfig[watchedValues.wasteType as WasteTypeValue]?.description}</p>
                {watchedValues.wasteAmount > 0 && (
                  <div className="space-y-3 mt-3 pt-3 border-t border-border">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <Scale className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>Estimated Amount:</span>
                      </div>
                      <span className="font-medium">{watchedValues.wasteAmount} kg</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <GiftIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>Points Earning:</span>
                      </div>
                      <span className="font-medium text-primary">
                        {watchedValues.wasteAmount * (wasteTypeConfig[watchedValues.wasteType as WasteTypeValue]?.points || 5)} points
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
  
  const [isDetecting, setIsDetecting] = useState<boolean>(false);

  const detectUserLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Location Detection Failed",
        description: "Your browser doesn't support geolocation. Please enter your address manually.",
        variant: "destructive"
      });
      return;
    }

    setIsDetecting(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;

        const KENYA_BOUNDS = {
          north: 4.62, south: -4.72, west: 33.90, east: 41.91
        };

        if (userLat < KENYA_BOUNDS.south || userLat > KENYA_BOUNDS.north ||
            userLng < KENYA_BOUNDS.west || userLng > KENYA_BOUNDS.east) {
          toast({
            title: "Location Outside Kenya",
            description: "PipaPal is only available in Kenya. Please select a Kenya county.",
            variant: "destructive"
          });
          setIsDetecting(false);
          return;
        }

        let closestCounty = KENYA_COUNTIES[0];
        let minDistance = Number.MAX_VALUE;
        for (const county of KENYA_COUNTIES) {
          const distance = Math.sqrt(
            Math.pow(county.lat - userLat, 2) + Math.pow(county.lng - userLng, 2)
          );
          if (distance < minDistance) {
            minDistance = distance;
            closestCounty = county;
          }
        }

        form.setValue('city', closestCounty.value, { shouldValidate: true });

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${userLat}&lon=${userLng}&zoom=18&addressdetails=1`,
            { headers: { 'Accept-Language': 'en' } }
          );
          if (response.ok) {
            const data = await response.json();
            const addr = data.address;
            const parts = [
              addr.road || addr.street,
              addr.neighbourhood || addr.suburb,
              addr.town || addr.city || addr.village,
              closestCounty.name + " County"
            ].filter(Boolean);
            const detectedAddress = parts.join(', ');
            form.setValue('address', detectedAddress, { shouldValidate: true });
            toast({
              title: "Location Detected",
              description: detectedAddress,
            });
          } else {
            form.setValue('address', `${closestCounty.name} County, Kenya`, { shouldValidate: true });
            toast({
              title: "Location Detected",
              description: `${closestCounty.name} County, Kenya`,
            });
          }
        } catch {
          form.setValue('address', `${closestCounty.name} County, Kenya`, { shouldValidate: true });
          toast({
            title: "Location Detected",
            description: `${closestCounty.name} County, Kenya`,
          });
        }

        setIsDetecting(false);
      },
      (error) => {
        setIsDetecting(false);
        let errorMessage = "Failed to get your location. Please enter your address manually.";
        if (error.code === 1) {
          errorMessage = "Location access denied. Please grant permission or enter your address manually.";
        } else if (error.code === 2) {
          errorMessage = "Location unavailable. Please select your county and enter your address.";
        } else if (error.code === 3) {
          errorMessage = "Location request timed out. Please try again or enter manually.";
        }
        toast({
          title: "Location Detection Failed",
          description: errorMessage,
          variant: "destructive"
        });
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const renderLocationStep = () => {
    return (
      <div className="space-y-6">
        <div className="bg-primary/5 border border-primary/20 rounded-md p-4">
          <div className="flex items-start space-x-2">
            <MapPin className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <h3 className="font-medium">Collection Location</h3>
              <p className="text-sm text-muted-foreground mt-1">
                PipaPal service is currently only available in Kenya. Please select your county and provide your address details.
              </p>
            </div>
          </div>
        </div>
        
        <FormField
          control={form.control}
          name="city"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Select Your County</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value || undefined}
                disabled={isDetecting}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select the county where collection will take place" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="max-h-[300px]">
                  {KENYA_COUNTIES.map((county) => (
                    <SelectItem key={county.value} value={county.value}>
                      {county.name} County
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Select the county where collection will take place
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address Details</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Provide exact address (e.g., street name, building, landmark)"
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  disabled={isDetecting}
                />
              </FormControl>
              <FormDescription>
                Enter the full address for waste collection, including any building/apartment numbers, floor, and landmark references.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="button"
          variant="outline"
          onClick={detectUserLocation}
          disabled={isDetecting}
          className="w-full"
        >
          {isDetecting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <LocateFixed className="h-4 w-4 mr-2" />
          )}
          {isDetecting ? "Detecting your location..." : "Detect Location"}
        </Button>
        
        {watchedValues.address && watchedValues.city && (
          <div className="mt-4 bg-primary/10 border border-primary/20 rounded-md p-4">
            <div className="flex items-start space-x-3">
              <MapPin className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h4 className="font-medium">Selected Location</h4>
                <p className="text-sm text-muted-foreground mt-1 break-words">
                  {watchedValues.address}, {KENYA_COUNTIES.find(c => c.value === watchedValues.city)?.name} County, Kenya
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };
  
  // Render scheduling step
  const renderSchedulingStep = () => (
    <div className="space-y-6">
      {/* Collection Date & Time */}
      <FormField
        control={form.control}
        name="scheduledDate"
        render={({ field }) => (
          <FormItem className="flex flex-col">
            <FormLabel>Collection Date & Time</FormLabel>
            <Popover>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    variant={"outline"}
                    className={`w-full pl-3 text-left font-normal ${
                      !field.value && "text-muted-foreground"
                    }`}
                  >
                    {field.value ? (
                      <span className="flex items-center">
                        <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                        {format(field.value, "PPP 'at' h:mm a")}
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        Select date and time
                      </span>
                    )}
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={field.value}
                  onSelect={(date) => {
                    if (date) {
                      const now = new Date();
                      date.setHours(now.getHours());
                      date.setMinutes(0);
                      field.onChange(date);
                    }
                  }}
                  initialFocus
                  disabled={(date) => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    return date < today;
                  }}
                />
                <div className="p-3 border-t border-border">
                  <div className="grid gap-2">
                    <FormLabel>Time</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        const [hour, minute] = value.split(":").map(Number);
                        const date = new Date(field.value || new Date());
                        date.setHours(hour);
                        date.setMinutes(minute);
                        field.onChange(date);
                      }}
                      defaultValue={field.value ? `${field.value.getHours()}:00` : "9:00"}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select time" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="8:00">8:00 AM</SelectItem>
                        <SelectItem value="9:00">9:00 AM</SelectItem>
                        <SelectItem value="10:00">10:00 AM</SelectItem>
                        <SelectItem value="11:00">11:00 AM</SelectItem>
                        <SelectItem value="12:00">12:00 PM</SelectItem>
                        <SelectItem value="13:00">1:00 PM</SelectItem>
                        <SelectItem value="14:00">2:00 PM</SelectItem>
                        <SelectItem value="15:00">3:00 PM</SelectItem>
                        <SelectItem value="16:00">4:00 PM</SelectItem>
                        <SelectItem value="17:00">5:00 PM</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            <FormDescription>
              Choose a date and time for waste collection (at least 24h in advance recommended)
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      
      {/* Special Notes - Basic HTML Version */}
      <div>
        <label htmlFor="notes-input" className="text-sm font-medium">Special Instructions</label>
        <div className="mt-2">
          <textarea
            id="notes-input"
            placeholder="Any additional details for the collector (e.g., 'Gate code: 1234', 'Call upon arrival')"
            value={form.getValues().notes || ""}
            onChange={(e) => form.setValue("notes", e.target.value, { shouldValidate: true })}
            className="flex w-full min-h-24 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
          />
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Add any special instructions or details that will help with the collection (optional)
        </p>
        {form.formState.errors.notes && (
          <p className="text-sm font-medium text-destructive mt-1">{form.formState.errors.notes.message}</p>
        )}
      </div>
    </div>
  );
  
  // Render review step
  const renderReviewStep = () => {
    const values = form.getValues();
    const wasteConfig = values.wasteType ? wasteTypeConfig[values.wasteType as WasteTypeValue] : null;
    
    return (
      <div className="space-y-6">
        <div className="bg-primary/5 border border-primary/20 rounded-md p-4">
          <div className="flex items-center space-x-2 text-primary mb-3">
            <Clipboard className="h-5 w-5" />
            <h3 className="font-medium">Review Your Collection Request</h3>
          </div>
          
          <p className="text-sm text-muted-foreground mb-4">
            Please review your collection request details below and confirm when you're ready to submit.
          </p>
          
          <div className="space-y-4">
            {/* Waste Details Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium flex items-center">
                  <Scale className="h-4 w-4 mr-2 text-muted-foreground" /> 
                  Waste Details
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-4 pt-0">
                <div className="grid gap-2">
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-muted-foreground">Type:</div>
                    <div className="font-medium flex items-center">
                      {wasteConfig && wasteConfig.icon && (
                        <span className="mr-1">
                          {React.createElement(iconMap[wasteConfig.icon], { 
                            className: "h-4 w-4",
                            style: { 
                              color: wasteConfig?.textColor 
                                ? wasteConfig.textColor.replace('text-', '').includes('-') 
                                  ? `var(--${wasteConfig.textColor.replace('text-', '')})` 
                                  : `var(--${wasteConfig.textColor.replace('text-', '')}-foreground)` 
                                : undefined
                            }
                          })}
                        </span>
                      )}
                      {wasteConfig?.label || "Not specified"}
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-muted-foreground">Amount:</div>
                    <div className="font-medium">{values.wasteAmount} kg</div>
                  </div>
                  {values.wasteDescription && (
                    <div className="pt-2 mt-2 border-t">
                      <div className="text-sm text-muted-foreground mb-1">Description:</div>
                      <div className="text-sm bg-secondary/20 p-2 rounded-md">
                        {values.wasteDescription}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
                  
            {/* Location Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium flex items-center">
                  <MapPin className="h-4 w-4 mr-2 text-muted-foreground" /> 
                  Collection Location
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-4 pt-0">
                <div className="grid gap-3">
                  <div className="flex flex-col">
                    <div className="flex items-center">
                      <Building className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">County:</span>
                      <span className="text-sm font-medium ml-2">
                        {values.city && KENYA_COUNTIES.find(c => c.value === values.city)?.name || "Not specified"} County
                      </span>
                    </div>
                    <div className="flex items-start mt-2">
                      <MapPin className="h-4 w-4 mr-2 text-muted-foreground mt-0.5" />
                      <div>
                        <span className="text-sm text-muted-foreground">Address:</span>
                        <p className="text-sm mt-1 bg-secondary/20 p-2 rounded-md">
                          {values.address || "No address provided"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Schedule Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-muted-foreground" /> 
                  Collection Schedule
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-4 pt-0">
                <div className="grid gap-2">
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-muted-foreground">Date & Time:</div>
                    <div className="font-medium">
                      {values.scheduledDate ? format(values.scheduledDate, "PPP 'at' h:mm a") : "Not scheduled"}
                    </div>
                  </div>
                  
                  {values.notes && (
                    <div className="pt-2 mt-2 border-t">
                      <div className="text-sm text-muted-foreground mb-1">Special Instructions:</div>
                      <div className="text-sm bg-secondary/20 p-2 rounded-md">
                        {values.notes}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Confirmation Checkbox */}
          <div className="mt-6 bg-primary/10 rounded-md p-4 border border-primary/20">
            <div className="flex flex-row items-start space-x-3 space-y-0">
              <Checkbox
                id="confirm-checkbox"
                checked={!!watchedValues.confirmSubmission}
                onCheckedChange={(checked) => {
                  form.setValue('confirmSubmission', !!checked);
                }}
              />
              <div className="space-y-1 leading-none">
                <label
                  htmlFor="confirm-checkbox"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  I confirm that the information provided is correct and I'd like to schedule this waste collection
                </label>
                <p className="text-sm text-muted-foreground">
                  Once confirmed, a collection request will be sent to available collectors in your area
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  // Render current step
  const renderStep = () => {
    switch (currentStep) {
      case FormStep.WASTE_DETAILS:
        return renderWasteDetailsStep();
      case FormStep.LOCATION:
        return renderLocationStep();
      case FormStep.SCHEDULE:
        return renderSchedulingStep();
      case FormStep.REVIEW:
        return renderReviewStep();
      default:
        return null;
    }
  };
  
  return (
    <div className="max-w-4xl mx-auto">
      {/* Step indicator */}
      <div className="mb-8">
        <Progress value={progress} className="h-2" />
        <div className="flex justify-between text-sm text-muted-foreground mt-2">
          <div className={currentStep >= FormStep.WASTE_DETAILS ? "text-primary font-medium" : ""}>
            Waste Details
          </div>
          <div className={currentStep >= FormStep.LOCATION ? "text-primary font-medium" : ""}>
            Location
          </div>
          <div className={currentStep >= FormStep.SCHEDULE ? "text-primary font-medium" : ""}>
            Schedule
          </div>
          <div className={currentStep >= FormStep.REVIEW ? "text-primary font-medium" : ""}>
            Review
          </div>
        </div>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {renderStep()}
          
          <div className="flex justify-between pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === FormStep.WASTE_DETAILS}
              className="space-x-2"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Back</span>
            </Button>
            
            {currentStep < FormStep.REVIEW ? (
              <Button
                type="button"
                onClick={nextStep}
                className="space-x-2"
              >
                <span>Next</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={isSubmitting || (!watchedValues.confirmSubmission && !isSubmitSuccess)}
                className={`space-x-2 ${isSubmitSuccess ? 'bg-green-600 text-white hover:bg-green-700' : ''}`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : isSubmitSuccess ? (
                  <>
                    <BadgeCheck className="h-4 w-4" />
                    <span>Collection Scheduled!</span>
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    <span>Submit Request</span>
                  </>
                )}
              </Button>
            )}
          </div>
          
          {/* Display note when on review step and checkbox is not checked */}
          {currentStep === FormStep.REVIEW && !watchedValues.confirmSubmission && (
            <p className="text-sm text-muted-foreground text-center">
              Please confirm the details above by checking the box to enable submission
            </p>
          )}
        </form>
      </Form>
    </div>
  );
}