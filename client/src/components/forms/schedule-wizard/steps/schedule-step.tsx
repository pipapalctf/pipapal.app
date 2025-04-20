import { UseFormReturn } from "react-hook-form";
import { format } from "date-fns";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon, Clock } from "lucide-react";

interface ScheduleStepProps {
  form: UseFormReturn<any>;
}

export default function ScheduleStep({ form }: ScheduleStepProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Schedule</h2>
      
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
                        {format(field.value, "PPP")}
                        <span className="ml-auto flex items-center text-muted-foreground">
                          <Clock className="mr-2 h-4 w-4" />
                          {format(field.value, "p")}
                        </span>
                      </span>
                    ) : (
                      <span>Select date and time</span>
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
              Choose a date and time for your waste collection. Collections are available Monday-Friday, 8AM-5PM.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      
      {/* Schedule information */}
      <div className="p-4 bg-muted/30 rounded-lg border space-y-3">
        <h3 className="font-medium text-sm">Collection Schedule Tips:</h3>
        <ul className="text-sm space-y-2 text-muted-foreground">
          <li className="flex items-start">
            <div className="min-w-4 mr-2">•</div>
            <div>Schedule at least 24 hours in advance for guaranteed service</div>
          </li>
          <li className="flex items-start">
            <div className="min-w-4 mr-2">•</div>
            <div>Our team typically arrives within the selected hour window</div>
          </li>
          <li className="flex items-start">
            <div className="min-w-4 mr-2">•</div>
            <div>You'll receive notifications when the collector is on the way</div>
          </li>
          <li className="flex items-start">
            <div className="min-w-4 mr-2">•</div>
            <div>Same-day emergency pickups are available for hazardous waste (additional fee may apply)</div>
          </li>
        </ul>
      </div>
    </div>
  );
}