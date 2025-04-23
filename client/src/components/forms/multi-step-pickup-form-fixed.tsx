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
  Gift as GiftIcon
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
import { GoogleMap, useJsApiLoader, MarkerF } from "@react-google-maps/api";

// Define location type
type LocationType = { lat: number; lng: number };

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
  location: z.custom<LocationType>().optional(),
  notes: z.string().optional(),
  // This field is only used for UI interaction, not stored in the database
  citySelection: z.string().optional(),
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

// Define Kenya cities with coordinates
const kenyaCities = [
  { value: "-1.2921,36.8219,Nairobi, Kenya", name: "Nairobi", lat: -1.2921, lng: 36.8219 },
  { value: "-4.0435,39.6682,Mombasa, Kenya", name: "Mombasa", lat: -4.0435, lng: 39.6682 },
  { value: "-0.3031,36.0800,Nakuru, Kenya", name: "Nakuru", lat: -0.3031, lng: 36.0800 },
  { value: "0.5143,35.2698,Eldoret, Kenya", name: "Eldoret", lat: 0.5143, lng: 35.2698 },
  { value: "0.0395,36.3636,Nyahururu, Kenya", name: "Nyahururu", lat: 0.0395, lng: 36.3636 },
  { value: "-0.1022,34.7617,Kisumu, Kenya", name: "Kisumu", lat: -0.1022, lng: 34.7617 },
  { value: "-0.3696,34.8861,Kericho, Kenya", name: "Kericho", lat: -0.3696, lng: 34.8861 },
  { value: "-0.5182,37.2709,Embu, Kenya", name: "Embu", lat: -0.5182, lng: 37.2709 },
  { value: "-0.1018,35.0728,Kapsabet, Kenya", name: "Kapsabet", lat: -0.1018, lng: 35.0728 },
  { value: "-0.0916,36.9733,Nyeri, Kenya", name: "Nyeri", lat: -0.0916, lng: 36.9733 },
  { value: "-0.7983,36.9976,Machakos, Kenya", name: "Machakos", lat: -0.7983, lng: 36.9976 },
  { value: "-0.5333,37.4515,Meru, Kenya", name: "Meru", lat: -0.5333, lng: 37.4515 }
];

const libraries = ['places'] as Array<'places'>;

export default function MultiStepPickupForm({ collectionToEdit, onSuccess }: MultiStepPickupFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [, navigate] = useLocation();
  
  // Form state
  const [currentStep, setCurrentStep] = useState<FormStep>(FormStep.WASTE_DETAILS);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [mapCenter, setMapCenter] = useState<LocationType>({ lat: -1.2921, lng: 36.8219 }); // Default to Nairobi
  
  // Load Google Maps API
  const { isLoaded: isMapsLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string,
    libraries
  });
  
  // Initialize form with default values or edit values
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      wasteType: collectionToEdit?.wasteType || "",
      wasteDescription: collectionToEdit?.wasteDescription || "",
      wasteAmount: collectionToEdit?.wasteAmount || 0,
      address: collectionToEdit?.address || "",
      notes: collectionToEdit?.notes || "",
      scheduledDate: collectionToEdit?.scheduledDate 
        ? new Date(collectionToEdit.scheduledDate) 
        : new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      location: collectionToEdit?.location as LocationType | undefined,
      citySelection: "",
      confirmSubmission: false,
    },
  });
  
  // Watch form values for use in UI
  const watchedValues = form.watch();
  
  // When location changes, update map center
  useEffect(() => {
    if (watchedValues.location) {
      setMapCenter(watchedValues.location);
    }
  }, [watchedValues.location]);
  
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
            scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
            location: undefined,
            citySelection: "",
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
    
    setIsSubmitting(true);
    createCollectionMutation.mutate(values);
  };
  
  // Function to handle location change
  const handleLocationChange = (address: string, location?: LocationType) => {
    form.setValue('address', address);
    if (location) {
      form.setValue('location', location);
      setMapCenter(location);
    }
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
        fieldsToValidate = ['address'];
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
        }
      }
    });
  };
  
  // Navigate to previous step
  const prevStep = () => {
    if (currentStep > FormStep.WASTE_DETAILS) {
      setCurrentStep(prevStep => (prevStep - 1) as FormStep);
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
  
  // Render location step with manual city selection only
  const renderLocationStep = () => {
    const kenyaCities = [
      { value: "-1.2921,36.8219,Nairobi, Kenya", name: "Nairobi", lat: -1.2921, lng: 36.8219 },
      { value: "-4.0435,39.6682,Mombasa, Kenya", name: "Mombasa", lat: -4.0435, lng: 39.6682 },
      { value: "-0.3031,36.0800,Nakuru, Kenya", name: "Nakuru", lat: -0.3031, lng: 36.0800 },
      { value: "0.5143,35.2698,Eldoret, Kenya", name: "Eldoret", lat: 0.5143, lng: 35.2698 },
      { value: "0.0395,36.3636,Nyahururu, Kenya", name: "Nyahururu", lat: 0.0395, lng: 36.3636 },
      { value: "-0.1022,34.7617,Kisumu, Kenya", name: "Kisumu", lat: -0.1022, lng: 34.7617 },
      { value: "-0.3696,34.8861,Kericho, Kenya", name: "Kericho", lat: -0.3696, lng: 34.8861 },
      { value: "-0.5182,37.2709,Embu, Kenya", name: "Embu", lat: -0.5182, lng: 37.2709 },
      { value: "-0.1018,35.0728,Kapsabet, Kenya", name: "Kapsabet", lat: -0.1018, lng: 35.0728 },
      { value: "-0.0916,36.9733,Nyeri, Kenya", name: "Nyeri", lat: -0.0916, lng: 36.9733 },
      { value: "-0.7983,36.9976,Machakos, Kenya", name: "Machakos", lat: -0.7983, lng: 36.9976 },
      { value: "-0.5333,37.4515,Meru, Kenya", name: "Meru", lat: -0.5333, lng: 37.4515 }
    ];
    
    return (
      <div className="space-y-6">
        <div className="bg-primary/5 border border-primary/20 rounded-md p-4">
          <div className="flex items-start space-x-2">
            <MapPin className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <h3 className="font-medium">Collection Location</h3>
              <p className="text-sm text-muted-foreground mt-1">
                PipaPal service is currently only available in Kenya. Please select your city and provide your address details.
              </p>
            </div>
          </div>
        </div>
        
        {/* City Selection */}
        <FormField
          control={form.control}
          name="citySelection"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Select Your City</FormLabel>
              <Select
                onValueChange={(value) => {
                  field.onChange(value);
                  
                  // Find the selected city from our array
                  const selectedCity = kenyaCities.find(city => city.value === value);
                  
                  if (selectedCity) {
                    // Update form with location and address
                    form.setValue('location', {
                      lat: selectedCity.lat,
                      lng: selectedCity.lng
                    });
                    form.setValue('address', `${selectedCity.name}, Kenya`);
                    setMapCenter({
                      lat: selectedCity.lat,
                      lng: selectedCity.lng
                    });
                  }
                }}
                defaultValue={field.value || ""}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose your city" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {kenyaCities.map((city) => (
                    <SelectItem key={city.name} value={city.value}>
                      {city.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Select the city where collection will take place
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Address Details */}
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
                  onChange={(e) => {
                    // Keep city information if already selected
                    if (watchedValues.citySelection) {
                      const selectedCity = kenyaCities.find(city => city.value === watchedValues.citySelection);
                      const locationText = e.target.value;
                      
                      if (selectedCity) {
                        // Keep the city name and country
                        field.onChange(`${locationText}, ${selectedCity.name}, Kenya`);
                        
                        // Ensure location coordinates are preserved
                        if (!watchedValues.location) {
                          form.setValue('location', {
                            lat: selectedCity.lat,
                            lng: selectedCity.lng
                          });
                          setMapCenter({
                            lat: selectedCity.lat,
                            lng: selectedCity.lng
                          });
                        }
                      } else {
                        field.onChange(locationText);
                      }
                    } else {
                      field.onChange(e.target.value);
                    }
                  }}
                />
              </FormControl>
              <FormDescription>
                Add detailed address to help the collector find your location
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Display Selected Location */}
        {watchedValues.address && (
          <div className="mt-4 bg-primary/10 border border-primary/20 rounded-md p-4">
            <div className="flex items-start space-x-3">
              <MapPin className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h4 className="font-medium">Selected Location</h4>
                <p className="text-sm text-muted-foreground mt-1 break-words">
                  {watchedValues.address}
                </p>
                
                {/* Show map if coordinates are available and Maps API is loaded */}
                {watchedValues.location && isMapsLoaded && (
                  <div className="mt-3 rounded-md overflow-hidden border border-border">
                    <GoogleMap
                      mapContainerStyle={{
                        width: '100%',
                        height: '200px'
                      }}
                      center={mapCenter}
                      zoom={13}
                      options={{
                        disableDefaultUI: true,
                        zoomControl: true,
                      }}
                    >
                      <MarkerF
                        position={mapCenter}
                        title={watchedValues.address}
                      />
                    </GoogleMap>
                  </div>
                )}
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
      
      {/* Special Notes */}
      <FormField
        control={form.control}
        name="notes"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Special Instructions</FormLabel>
            <FormControl>
              <Textarea 
                placeholder="Any additional details for the collector (e.g., 'Gate code: 1234', 'Call upon arrival')" 
                className="min-h-24 resize-none"
                {...field} 
              />
            </FormControl>
            <FormDescription>
              Add any special instructions or details that will help with the collection (optional)
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
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
                  <div className="text-sm">
                    {values.address || "No address provided"}
                  </div>
                  
                  {values.location && isMapsLoaded && (
                    <div className="mt-2 border rounded-md overflow-hidden">
                      <GoogleMap
                        mapContainerStyle={{
                          width: '100%',
                          height: '150px'
                        }}
                        center={values.location}
                        zoom={14}
                        options={{
                          disableDefaultUI: true,
                          zoomControl: true,
                        }}
                      >
                        <MarkerF
                          position={values.location}
                          title={values.address}
                        />
                      </GoogleMap>
                    </div>
                  )}
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