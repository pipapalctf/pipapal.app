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
import LocationPicker from "./location-picker";

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
        
        {/* Collection Details Section */}
        <div className="bg-muted/50 rounded-lg p-4 border border-border/50 mt-6">
          <h3 className="text-base font-medium mb-4">Collection Details</h3>
          
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
                    <Input placeholder="e.g., apple Organic, pineapple byproducts" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        
        {/* Collection Scheduling Section */}
        <div className="bg-muted/50 rounded-lg p-4 border border-border/50">
          <h3 className="text-base font-medium mb-4">Collection Scheduling</h3>
          
          <div className="grid gap-6 sm:grid-cols-2">
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
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Pickup Address */}
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pickup Address</FormLabel>
                  <FormControl>
                    <LocationPicker 
                      defaultValue={field.value}
                      onChange={(address) => {
                        field.onChange(address);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          {/* Additional Notes - Full Width */}
          <div className="mt-4">
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any special instructions for the collector (optional)"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        
        {/* Submit Button with Animation */}
        <Button 
          type="submit" 
          className="w-full relative overflow-hidden transition-all py-6 mt-8"
          disabled={schedulePickupMutation.isPending || reschedulePickupMutation.isPending}
        >
          <div className="relative z-10 flex items-center justify-center">
            {schedulePickupMutation.isPending || reschedulePickupMutation.isPending ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <BadgeCheck className="mr-2 h-5 w-5" />
            )}
            <span className="font-medium">
              {isRescheduling ? 'Reschedule Pickup' : 'Schedule Pickup'}
            </span>
          </div>
        </Button>
      </form>
    </Form>
  );
}
