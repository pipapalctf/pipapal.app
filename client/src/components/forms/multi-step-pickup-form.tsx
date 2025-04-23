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
  AlertCircle
} from "lucide-react";
import { iconMap } from "@/components/ui/icon-badge";
import { WasteType, WasteTypeValue, Collection } from "@shared/schema";
import { wasteTypeConfig } from "@/lib/types";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import LocationPicker from "./location-picker";
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

const libraries = ['places'] as Array<'places'>;

export default function MultiStepPickupForm({ collectionToEdit, onSuccess }: MultiStepPickupFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [location, navigate] = useLocation();
  
  // Form step state
  const [currentStep, setCurrentStep] = useState<FormStep>(FormStep.WASTE_DETAILS);
  // Form states
  const [isRescheduling, setIsRescheduling] = useState<boolean>(false);
  
  // Map state
  const [mapCenter, setMapCenter] = useState<LocationType>({ lat: -1.2921, lng: 36.8219 }); // Default to Nairobi
  
  // Load Google Maps API
  // Check if Google Maps API key exists
  const mapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string;
  console.log("Google Maps API key available:", !!mapsApiKey);
  
  // Load Google Maps API if key is available
  const { isLoaded: isMapsLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: mapsApiKey || "", // Provide empty string if key is missing
    libraries
  });
  
  // Log any errors loading Google Maps
  useEffect(() => {
    if (loadError) {
      console.error("Error loading Google Maps API:", loadError);
    }
  }, [loadError]);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      address: user?.address || "",
      wasteAmount: 10, // Default to 10kg
      notes: "",
    },
    mode: "onChange", // Validate on change for better UX in a multi-step form
  });
  
  // Get the values from the form
  const watchedValues = form.watch();
  
  // Initialize form with collection data if provided
  useEffect(() => {
    if (collectionToEdit) {
      setIsRescheduling(true);
      form.reset({
        wasteType: collectionToEdit.wasteType,
        wasteDescription: collectionToEdit.wasteDescription || "",
        wasteAmount: collectionToEdit.wasteAmount || 10,
        scheduledDate: new Date(collectionToEdit.scheduledDate),
        address: collectionToEdit.address,
        location: collectionToEdit.location || undefined,
        notes: collectionToEdit.notes || "",
      });
      
      // Also update map center if location is available
      if (collectionToEdit.location && 
          typeof collectionToEdit.location === 'object' && 
          collectionToEdit.location !== null) {
        const loc = collectionToEdit.location as any;
        if (typeof loc.lat === 'number' && typeof loc.lng === 'number') {
          setMapCenter({
            lat: loc.lat,
            lng: loc.lng
          });
        }
      }
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
  
  // Update map center when location changes
  useEffect(() => {
    if (watchedValues.location) {
      setMapCenter(watchedValues.location);
    }
  }, [watchedValues.location]);
  
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
      queryClient.invalidateQueries({ queryKey: ["/api/user"] }); // Also refresh user data for points
      
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
      queryClient.invalidateQueries({ queryKey: ["/api/user"] }); // Also refresh user data for points
      
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
  
  // Move to the next step if validation passes
  const handleNext = async () => {
    let isValid = false;
    
    switch (currentStep) {
      case FormStep.WASTE_DETAILS:
        isValid = await form.trigger(['wasteType', 'wasteAmount', 'wasteDescription']);
        break;
      case FormStep.LOCATION:
        isValid = await form.trigger(['address', 'location']);
        break;
      case FormStep.SCHEDULE:
        isValid = await form.trigger(['scheduledDate', 'notes']);
        break;
      case FormStep.REVIEW:
        // No validation needed on review step
        isValid = true;
        break;
    }
    
    if (isValid) {
      // Scroll to the top of the form before changing steps
      const formElement = document.querySelector('form');
      if (formElement) {
        // Get the form's position
        const formRect = formElement.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        // Scroll to the top of the form with smooth behavior
        window.scrollTo({
          top: scrollTop + formRect.top - 100, // Subtract some padding
          behavior: 'smooth'
        });
      }
      
      // Set a small timeout to ensure the scroll happens before the form changes
      setTimeout(() => {
        if (currentStep < FormStep.REVIEW) {
          setCurrentStep(prev => (prev + 1) as FormStep);
        } else {
          // If we're on the review step, submit the form
          handleSubmit();
        }
      }, 100);
    }
  };
  
  // Go back to the previous step
  const handleBack = () => {
    if (currentStep > FormStep.WASTE_DETAILS) {
      // Scroll to the top of the form before changing steps
      const formElement = document.querySelector('form');
      if (formElement) {
        // Get the form's position
        const formRect = formElement.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        // Scroll to the top of the form with smooth behavior
        window.scrollTo({
          top: scrollTop + formRect.top - 100, // Subtract some padding
          behavior: 'smooth'
        });
      }
      
      // Set a small timeout to ensure the scroll happens before the form changes
      setTimeout(() => {
        setCurrentStep(prev => (prev - 1) as FormStep);
      }, 100);
    }
  };
  
  // Handle form submission
  const handleSubmit = () => {
    const values = form.getValues();
    
    if (isRescheduling && collectionToEdit) {
      reschedulePickupMutation.mutate({ ...values, id: collectionToEdit.id });
    } else {
      schedulePickupMutation.mutate(values);
    }
  };
  
  // Calculate progress percentage based on current step
  const calculateProgress = () => {
    return ((currentStep + 1) / (Object.keys(FormStep).length / 2)) * 100;
  };
  
  // Get step title
  const getStepTitle = () => {
    switch (currentStep) {
      case FormStep.WASTE_DETAILS:
        return "Step 1: Waste Details";
      case FormStep.LOCATION:
        return "Step 2: Collection Location";
      case FormStep.SCHEDULE:
        return "Step 3: Schedule & Instructions";
      case FormStep.REVIEW:
        return "Step 4: Review & Submit";
      default:
        return "Schedule Pickup";
    }
  };
  
  // Determine if next button should be disabled
  const isNextDisabled = () => {
    switch (currentStep) {
      case FormStep.WASTE_DETAILS:
        return !form.getValues().wasteType || !form.getValues().wasteAmount;
      case FormStep.LOCATION:
        // When maps aren't loaded, we should still allow proceeding if an address is entered
        if (!isMapsLoaded) {
          // If using the city dropdown, make sure location is set too
          return !form.getValues().address;
        }
        // Normal flow with maps loaded
        return !form.getValues().address;
      case FormStep.SCHEDULE:
        return !form.getValues().scheduledDate;
      default:
        return false;
    }
  };
  
  // Handle location change
  const handleLocationChange = (address: string, loc?: { lat: number; lng: number }) => {
    form.setValue('address', address);
    if (loc) {
      form.setValue('location', loc);
      setMapCenter(loc);
    }
  };
  
  // Format the review section data
  const getWasteTypeLabel = () => {
    const wasteType = form.getValues().wasteType;
    return wasteType ? wasteTypeConfig[wasteType as WasteTypeValue]?.label || wasteType : 'Not selected';
  };
  
  // Render waste details step
  const renderWasteDetailsStep = () => (
    <div className="space-y-6">
      {/* Waste Type Selection with Visual Cards */}
      <FormField
        control={form.control}
        name="wasteType"
        render={({ field }) => (
          <FormItem className="space-y-4">
            <div className="flex items-center justify-between">
              <FormLabel className="text-base font-medium">Waste Type</FormLabel>
              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">
                Earn points per 10kg
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.entries(WasteType).map(([key, value]) => {
                const wasteConfig = wasteTypeConfig[value];
                const IconComponent = iconMap[wasteConfig.icon] || Trash2;
                const isSelected = field.value === value;
                
                return (
                  <div
                    key={value}
                    className={`relative border rounded-md p-3 cursor-pointer transition-all hover:border-primary/50 hover:bg-primary/5 ${
                      isSelected 
                        ? "border-primary ring-1 ring-primary bg-primary/10" 
                        : "border-border"
                    }`}
                    onClick={() => field.onChange(value)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`flex items-center justify-center rounded-full ${wasteConfig.bgColor} p-2.5 mt-0.5`}>
                        <IconComponent 
                          className="h-5 w-5" 
                          style={{ color: wasteConfig.textColor.replace('text-', '').includes('-') 
                            ? `var(--${wasteConfig.textColor.replace('text-', '')})` 
                            : `var(--${wasteConfig.textColor.replace('text-', '')}-500)` 
                          }} 
                        />
                      </div>
                      <div className="space-y-1 flex-1">
                        <div className="font-medium">{wasteConfig.label}</div>
                        <div className="flex items-center">
                          <BadgeCheck className="text-primary h-4 w-4 mr-1" />
                          <span className="text-sm font-medium text-primary">
                            {wasteConfig.points} points
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {wasteConfig.description || `${wasteConfig.label} waste materials for recycling`}
                        </div>
                      </div>
                      
                      {isSelected && (
                        <div className="absolute top-2 right-2 h-3 w-3 rounded-full bg-primary"></div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <FormDescription>
              Select the main type of waste for this collection
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <div className="grid gap-6 sm:grid-cols-2">
        {/* Waste Amount */}
        <FormField
          control={form.control}
          name="wasteAmount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Waste Amount</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input 
                    type="number" 
                    min="1"
                    max="1000"
                    placeholder="10" 
                    {...field}
                    className="pr-12" 
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <span className="text-sm text-muted-foreground">kg</span>
                  </div>
                </div>
              </FormControl>
              <FormDescription>
                The approximate weight of your waste in kilograms
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
              <FormLabel>Waste Description</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Plastic bottles, paper waste" {...field} />
              </FormControl>
              <FormDescription>
                Briefly describe the waste materials (optional)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
  
  // Render location step
  const renderLocationStep = () => (
    <div className="space-y-6">
      <FormField
        control={form.control}
        name="address"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Collection Address</FormLabel>
            <FormControl>
              <LocationPicker 
                defaultValue={field.value} 
                onChange={handleLocationChange}
              />
            </FormControl>
            <FormDescription>
              Enter your address or use the detect location button
            </FormDescription>
            <div className="flex items-center px-3 py-2 mt-2 bg-amber-50 border border-amber-200 rounded-md">
              <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0 mr-2" />
              <p className="text-xs text-amber-700">
                <span className="font-medium">Note:</span> PipaPal service is currently only available in Kenya. Please make sure your location is within our service area.
              </p>
            </div>
            <FormMessage />
          </FormItem>
        )}
      />
      
      {/* Map view section with fallback UI */}
      <div className="mt-4">
        {isMapsLoaded ? (
          watchedValues.location ? (
            // Map with location pin
            <div className="rounded-md overflow-hidden border">
              <GoogleMap
                mapContainerStyle={{
                  width: '100%',
                  height: '300px'
                }}
                center={mapCenter}
                zoom={14}
                options={{
                  disableDefaultUI: true,
                  zoomControl: true,
                  streetViewControl: true,
                }}
              >
                <MarkerF
                  position={mapCenter}
                  title={watchedValues.address}
                />
              </GoogleMap>
            </div>
          ) : (
            // No location selected yet
            <div className="p-4 border rounded-md bg-muted/30 text-center space-y-2">
              <div className="flex justify-center">
                <MapPin className="h-10 w-10 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">Enter an address or use the detect location button to see a map</p>
            </div>
          )
        ) : (
          // Map unavailable - show alternative location picker
          <div className="border rounded-md overflow-hidden">
            <div className="p-4 bg-muted/30">
              <div className="flex flex-col space-y-2">
                <p className="text-sm text-muted-foreground text-center">
                  Maps are currently unavailable. Please select a city from the list below or enter your address manually.
                </p>
                <div className="flex items-center px-3 py-2 bg-amber-50 border border-amber-200 rounded-md">
                  <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0 mr-2" />
                  <p className="text-xs text-amber-700">
                    <span className="font-medium">Note:</span> PipaPal service is currently only available in Kenya. Please make sure your location is within our service area.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="p-4 space-y-4">
              {/* Select a city when maps don't load - using regular state instead of form field */}
              <div className="space-y-2">
                <p className="text-sm font-medium">Select nearest city</p>
                <Select
                  onValueChange={(value) => {
                    // Split the value "lat,lng,name"
                    const [lat, lng, ...nameParts] = value.split(',');
                    const name = nameParts.join(',');
                    
                    // Update form with location and address
                    form.setValue('location', {
                      lat: parseFloat(lat),
                      lng: parseFloat(lng)
                    });
                    form.setValue('address', name);
                    setMapCenter({
                      lat: parseFloat(lat),
                      lng: parseFloat(lng)
                    });
                  }}
                  defaultValue=""
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a nearby city" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="-1.2921,36.8219,Nairobi, Kenya">Nairobi</SelectItem>
                    <SelectItem value="-4.0435,39.6682,Mombasa, Kenya">Mombasa</SelectItem>
                    <SelectItem value="-0.3031,36.0800,Nakuru, Kenya">Nakuru</SelectItem>
                    <SelectItem value="0.5143,35.2698,Eldoret, Kenya">Eldoret</SelectItem>
                    <SelectItem value="0.0395,36.3636,Nyahururu, Kenya">Nyahururu</SelectItem>
                    <SelectItem value="-0.1022,34.7617,Kisumu, Kenya">Kisumu</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Select the city closest to your location
                </p>
              </div>
              
              {/* Show selected location in card format when maps aren't available */}
              {watchedValues.address && watchedValues.location && (
                <div className="bg-primary/5 border border-primary/20 rounded-md p-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-full bg-primary/10">
                      <MapPin className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">Selected Location</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {watchedValues.address}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
  
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
    const IconComponent = wasteConfig?.icon ? iconMap[wasteConfig.icon] : Trash2;
    
    return (
      <div className="space-y-6">
        <div className="bg-primary/5 border border-primary/20 rounded-md p-4">
          <div className="flex items-center space-x-2 text-primary mb-3">
            <Clipboard className="h-5 w-5" />
            <h3 className="font-medium">Review Your Collection Request</h3>
          </div>
          
          <p className="text-sm text-muted-foreground mb-4">
            Please review your waste collection details before submitting your request.
          </p>
          
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Waste Details Card */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <div className={`p-2 rounded-full ${wasteConfig?.bgColor || 'bg-muted'}`}>
                    <IconComponent className="h-4 w-4" style={{ 
                      color: wasteConfig?.textColor 
                        ? wasteConfig.textColor.replace('text-', '').includes('-') 
                          ? `var(--${wasteConfig.textColor.replace('text-', '')})` 
                          : `var(--${wasteConfig.textColor.replace('text-', '')}-500)` 
                        : 'currentColor'
                    }} />
                  </div>
                  <div>
                    <h4 className="font-medium">Waste Details</h4>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type:</span>
                    <span className="font-medium">{getWasteTypeLabel()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount:</span>
                    <span className="font-medium">{values.wasteAmount} kg</span>
                  </div>
                  {values.wasteDescription && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Description:</span>
                      <span className="font-medium">{values.wasteDescription}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Est. Points:</span>
                    <span className="font-medium text-primary">
                      +{Math.ceil(values.wasteAmount / 10) * (wasteConfig?.points || 5)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Location Card */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="p-2 rounded-full bg-blue-100">
                    <MapPin className="h-4 w-4 text-blue-500" />
                  </div>
                  <div>
                    <h4 className="font-medium">Location</h4>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex flex-col">
                    <span className="text-muted-foreground mb-1">Address:</span>
                    <span className="font-medium break-words">{values.address}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Schedule Card */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="p-2 rounded-full bg-green-100">
                    <Clock className="h-4 w-4 text-green-500" />
                  </div>
                  <div>
                    <h4 className="font-medium">Schedule</h4>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex flex-col">
                    <span className="text-muted-foreground mb-1">Date & Time:</span>
                    <span className="font-medium">
                      {values.scheduledDate ? format(values.scheduledDate, "EEEE, MMMM d, yyyy 'at' h:mm a") : 'Not selected'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Special Instructions Card */}
            {values.notes && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="p-2 rounded-full bg-purple-100">
                      <FileText className="h-4 w-4 text-purple-500" />
                    </div>
                    <div>
                      <h4 className="font-medium">Special Instructions</h4>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex flex-col">
                      <span className="text-muted-foreground mb-1">Notes:</span>
                      <span className="font-medium break-words">{values.notes}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
          
          <div className="mt-4 bg-muted/50 rounded p-3 flex items-start space-x-2">
            <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium">Important Information</p>
              <p className="text-muted-foreground">
                By submitting this request, you confirm that the waste will be properly segregated and accessible at the specified location and time. Our collection team will contact you if there are any changes or issues.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  // Render the current step content
  const renderStepContent = () => {
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
    <Form {...form}>
      <form className="space-y-8">
        {/* Progress header */}
        <div className="space-y-4">
          <h2 className="text-xl font-medium">{getStepTitle()}</h2>
          <Progress value={calculateProgress()} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground px-1">
            <span className={currentStep >= FormStep.WASTE_DETAILS ? "text-primary font-medium" : ""}>Waste Details</span>
            <span className={currentStep >= FormStep.LOCATION ? "text-primary font-medium" : ""}>Location</span>
            <span className={currentStep >= FormStep.SCHEDULE ? "text-primary font-medium" : ""}>Schedule</span>
            <span className={currentStep >= FormStep.REVIEW ? "text-primary font-medium" : ""}>Review</span>
          </div>
        </div>
        
        <Separator />
        
        {/* Step content */}
        <div className="py-2">
          {renderStepContent()}
        </div>
        
        <Separator />
        
        {/* Navigation buttons */}
        <div className="flex justify-between pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === FormStep.WASTE_DETAILS}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          
          <Button
            type="button"
            onClick={handleNext}
            disabled={isNextDisabled() || schedulePickupMutation.isPending || reschedulePickupMutation.isPending}
          >
            {schedulePickupMutation.isPending || reschedulePickupMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isRescheduling ? "Updating..." : "Scheduling..."}
              </>
            ) : (
              <>
                {currentStep === FormStep.REVIEW ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    {isRescheduling ? "Update Pickup" : "Schedule Pickup"}
                  </>
                ) : (
                  <>
                    Next
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}