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
import { CalendarIcon, Loader2, Trash2, SquareCode, Newspaper, Wine, Utensils, Recycle, BadgeCheck } from "lucide-react";
import { WasteType } from "@shared/schema";
import { wasteTypeConfig } from "@/lib/types";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";

const formSchema = z.object({
  wasteType: z.string({
    required_error: "Please select the type of waste",
  }),
  scheduledDate: z.date({
    required_error: "Please select a date and time",
  }),
  address: z.string().min(5, "Address must be at least 5 characters"),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function SchedulePickupForm() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [_, navigate] = useLocation();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      address: user?.address || "",
      notes: "",
    },
  });
  
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
      queryClient.invalidateQueries({ queryKey: ["/api/collections"] });
      queryClient.invalidateQueries({ queryKey: ["/api/collections/upcoming"] });
      navigate("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to schedule pickup",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  function onSubmit(values: FormValues) {
    schedulePickupMutation.mutate(values);
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
                    return (
                      <SelectItem key={value} value={value}>
                        <div className="flex items-center">
                          {value === 'general' ? <Trash2 className="mr-2 h-4 w-4 text-primary" /> :
                           value === 'plastic' ? <SquareCode className="mr-2 h-4 w-4 text-blue-600" /> :
                           value === 'paper' ? <Newspaper className="mr-2 h-4 w-4 text-yellow-600" /> :
                           value === 'glass' ? <Wine className="mr-2 h-4 w-4 text-blue-600" /> :
                           value === 'metal' ? <Utensils className="mr-2 h-4 w-4 text-gray-600" /> :
                           value === 'organic' ? <Recycle className="mr-2 h-4 w-4 text-green-600" /> :
                           <Trash2 className="mr-2 h-4 w-4 text-primary" />}
                          {wasteConfig.label}
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
          disabled={schedulePickupMutation.isPending}
        >
          {schedulePickupMutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <BadgeCheck className="mr-2 h-4 w-4" />
          )}
          Schedule Pickup
        </Button>
      </form>
    </Form>
  );
}
