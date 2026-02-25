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
  AlertCircle,
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
import { useState, useEffect } from "react";
import LocationPicker from "./location-picker";

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

export default function MultiStepPickupForm({ collectionToEdit, onSuccess }: MultiStepPickupFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [location, navigate] = useLocation();
  
  const [currentStep, setCurrentStep] = useState<FormStep>(FormStep.WASTE_DETAILS);
  const [isRescheduling, setIsRescheduling] = useState<boolean>(false);
  
  const [mapCenter, setMapCenter] = useState<LocationType>({ lat: -1.2921, lng: 36.8219 });
  
  const isMapsLoaded = false;
  
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
  
  const KENYA_COUNTIES = [
    { name: "Baringo", lat: 0.4913, lng: 35.7426 },
    { name: "Bomet", lat: -0.7813, lng: 35.3416 },
    { name: "Bungoma", lat: 0.5635, lng: 34.5608 },
    { name: "Busia", lat: 0.4347, lng: 34.2422 },
    { name: "Elgeyo-Marakwet", lat: 0.6780, lng: 35.5082 },
    { name: "Embu", lat: -0.5388, lng: 37.4593 },
    { name: "Garissa", lat: -0.4532, lng: 39.6461 },
    { name: "Homa Bay", lat: -0.5273, lng: 34.4571 },
    { name: "Isiolo", lat: 0.3546, lng: 37.5822 },
    { name: "Kajiado", lat: -2.0981, lng: 36.7820 },
    { name: "Kakamega", lat: 0.2827, lng: 34.7519 },
    { name: "Kericho", lat: -0.3692, lng: 35.2863 },
    { name: "Kiambu", lat: -1.1714, lng: 36.8355 },
    { name: "Kilifi", lat: -3.5107, lng: 39.9093 },
    { name: "Kirinyaga", lat: -0.4989, lng: 37.2803 },
    { name: "Kisii", lat: -0.6813, lng: 34.7668 },
    { name: "Kisumu", lat: -0.1022, lng: 34.7617 },
    { name: "Kitui", lat: -1.3679, lng: 38.0106 },
    { name: "Kwale", lat: -4.1816, lng: 39.4521 },
    { name: "Laikipia", lat: 0.3606, lng: 36.7819 },
    { name: "Lamu", lat: -2.2717, lng: 40.9020 },
    { name: "Machakos", lat: -1.5177, lng: 37.2634 },
    { name: "Makueni", lat: -1.8039, lng: 37.6195 },
    { name: "Mandera", lat: 3.9373, lng: 41.8569 },
    { name: "Marsabit", lat: 2.3284, lng: 37.9909 },
    { name: "Meru", lat: 0.0480, lng: 37.6559 },
    { name: "Migori", lat: -1.0634, lng: 34.4731 },
    { name: "Mombasa", lat: -4.0435, lng: 39.6682 },
    { name: "Murang'a", lat: -0.7839, lng: 37.1522 },
    { name: "Nairobi", lat: -1.2921, lng: 36.8219 },
    { name: "Nakuru", lat: -0.3031, lng: 36.0800 },
    { name: "Nandi", lat: 0.1836, lng: 35.1269 },
    { name: "Narok", lat: -1.0878, lng: 35.8605 },
    { name: "Nyamira", lat: -0.5633, lng: 34.9349 },
    { name: "Nyandarua", lat: -0.1804, lng: 36.5234 },
    { name: "Nyeri", lat: -0.4197, lng: 36.9510 },
    { name: "Samburu", lat: 1.2150, lng: 36.9541 },
    { name: "Siaya", lat: -0.0617, lng: 34.2422 },
    { name: "Taita-Taveta", lat: -3.3162, lng: 38.4850 },
    { name: "Tana River", lat: -1.8012, lng: 39.6397 },
    { name: "Tharaka-Nithi", lat: -0.3070, lng: 37.7230 },
    { name: "Trans Nzoia", lat: 1.0567, lng: 34.9507 },
    { name: "Turkana", lat: 3.3122, lng: 35.5658 },
    { name: "Uasin Gishu", lat: 0.5143, lng: 35.2698 },
    { name: "Vihiga", lat: 0.0837, lng: 34.7073 },
    { name: "Wajir", lat: 1.7471, lng: 40.0573 },
    { name: "West Pokot", lat: 1.6210, lng: 35.1190 },
  ];

  const renderLocationStep = () => {
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

          form.setValue('citySelection', `${closestCounty.lat},${closestCounty.lng},${closestCounty.name} County`);
          form.setValue('location', { lat: userLat, lng: userLng });
          setMapCenter({ lat: userLat, lng: userLng });

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
              form.setValue('address', detectedAddress);
              toast({
                title: "Location Detected",
                description: detectedAddress,
              });
            } else {
              form.setValue('address', `${closestCounty.name} County, Kenya`);
              toast({
                title: "Location Detected",
                description: `${closestCounty.name} County, Kenya`,
              });
            }
          } catch {
            form.setValue('address', `${closestCounty.name} County, Kenya`);
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
          name="citySelection"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Select Your County</FormLabel>
              <Select
                onValueChange={(value) => {
                  field.onChange(value);
                  const [lat, lng, ...nameParts] = value.split(',');
                  const name = nameParts.join(',').trim();
                  form.setValue('location', {
                    lat: parseFloat(lat),
                    lng: parseFloat(lng)
                  });
                  setMapCenter({
                    lat: parseFloat(lat),
                    lng: parseFloat(lng)
                  });
                  const currentAddress = form.getValues('address');
                  if (!currentAddress || currentAddress.endsWith('County, Kenya') || currentAddress.endsWith(', Kenya')) {
                    form.setValue('address', `${name}, Kenya`);
                  }
                }}
                value={field.value || ""}
                disabled={isDetecting}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select the county where collection will take place" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="max-h-[300px]">
                  {KENYA_COUNTIES.map((county) => (
                    <SelectItem
                      key={county.name}
                      value={`${county.lat},${county.lng},${county.name} County`}
                    >
                      {county.name} County
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Select the county where collection will take place
              </FormDescription>
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
                <div className="relative">
                  <Input
                    placeholder="Provide exact address (e.g., street name, building, landmark)"
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value)}
                    disabled={isDetecting}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => detectUserLocation()}
                    disabled={isDetecting}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors disabled:opacity-50"
                    title="Detect my location"
                  >
                    {isDetecting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <LocateFixed className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </FormControl>
              <FormDescription>
                Enter your address manually or tap the location icon to auto-detect
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {watchedValues.address && (
          <div className="mt-4 bg-primary/10 border border-primary/20 rounded-md p-4">
            <div className="flex items-start space-x-3">
              <MapPin className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h4 className="font-medium">Selected Location</h4>
                <p className="text-sm text-muted-foreground mt-1 break-words">
                  {watchedValues.address}
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