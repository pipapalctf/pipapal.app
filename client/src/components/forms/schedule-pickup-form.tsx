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
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon, Loader2, Trash2, BadgeCheck } from "lucide-react";
import { iconMap } from "@/components/ui/icon-badge";
import { WasteType, Collection } from "@shared/schema";
import { wasteTypeConfig } from "@/lib/types";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";

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
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface SchedulePickupFormProps {
  collectionToEdit?: Collection | null;
  onSuccess?: () => void;
}

export default function SchedulePickupForm({ collectionToEdit, onSuccess }: SchedulePickupFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [location, navigate] = useLocation();
  
  // Form states
  const [isRescheduling, setIsRescheduling] = useState<boolean>(false);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      address: user?.address || "",
      wasteAmount: 10, // Default to 10kg
      notes: "",
    },
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
  
  function onSubmit(values: FormValues) {
    if (isRescheduling && collectionToEdit) {
      reschedulePickupMutation.mutate({ ...values, id: collectionToEdit.id });
    } else {
      schedulePickupMutation.mutate(values);
    }
  }
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="wasteType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Waste Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select waste type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.entries(WasteType).map(([key, value]) => {
                    const wasteConfig = wasteTypeConfig[value];
                    const IconComponent = iconMap[wasteConfig.icon] || Trash2;
                    
                    // Set standard waste weight in kg (for calculation purposes)
                    const standardWeight = 10; // kg
                    
                    return (
                      <SelectItem key={value} value={value} className="px-0 py-0.5">
                        <div className="flex items-center w-full pl-2 pr-3 py-1.5 hover:bg-muted/20 rounded-sm">
                          <div className="flex items-center flex-1">
                            <div className={`flex items-center justify-center rounded-full ${wasteConfig.bgColor} p-1.5 mr-3`}>
                              <IconComponent className="h-4 w-4" 
                                style={{ color: wasteConfig.textColor.replace('text-', '').includes('-') 
                                  ? `var(--${wasteConfig.textColor.replace('text-', '')})` 
                                  : `var(--${wasteConfig.textColor.replace('text-', '')}-500)` 
                                }} 
                              />
                            </div>
                            <span className="font-medium">{wasteConfig.label}:</span>
                            <span className="ml-2 font-medium text-primary">
                              {wasteConfig.points} pts
                            </span>
                            <span className="text-xs text-muted-foreground ml-1">
                              per {standardWeight}kg
                            </span>
                            <span className="text-xs ml-1 text-primary font-medium">
                              ({(wasteConfig.points / standardWeight).toFixed(1)} pts/kg)
                            </span>
                          </div>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <FormDescription>
                Select the main type of waste for this collection
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="wasteDescription"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Waste Description</FormLabel>
              <FormControl>
                <Input placeholder="e.g., apple Organic, pineapple byproducts" {...field} />
              </FormControl>
              <FormDescription>
                Add specific details about your waste (e.g., apple Organic, expired canned goods)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="wasteAmount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Waste Amount (kg)</FormLabel>
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
                Enter the estimated weight of your waste in kilograms
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
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
                        format(field.value, "PPP 'at' h:mm a")
                      ) : (
                        <span>Select date and time</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
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
                Choose a date and time for your waste collection
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
              <FormLabel>Pickup Address</FormLabel>
              <FormControl>
                <Input placeholder="123 Green Street, Eco City" {...field} />
              </FormControl>
              <FormDescription>
                Enter the address where the waste will be collected
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Additional Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Any special instructions for the collector"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Optional: Add any additional information for the waste collector
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button 
          type="submit" 
          className="w-full"
          disabled={schedulePickupMutation.isPending || reschedulePickupMutation.isPending}
        >
          {schedulePickupMutation.isPending || reschedulePickupMutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <BadgeCheck className="mr-2 h-4 w-4" />
          )}
          {isRescheduling ? 'Reschedule Pickup' : 'Schedule Pickup'}
        </Button>
      </form>
    </Form>
  );
}
