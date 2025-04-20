import { UseFormReturn } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import LocationPicker from "../../location-picker";

interface LocationStepProps {
  form: UseFormReturn<any>;
}

export default function LocationStep({ form }: LocationStepProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Location</h2>
      
      <FormField
        control={form.control}
        name="address"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Pickup Address</FormLabel>
            <FormControl>
              <LocationPicker 
                defaultValue={field.value}
                onChange={(address, location) => {
                  // Update the address field
                  field.onChange(address);
                  
                  // Update the location field if coordinates are available
                  if (location) {
                    form.setValue("location", location);
                  } else {
                    form.unregister("location");
                  }
                }}
              />
            </FormControl>
            <FormDescription>
              Start typing your address or use the detect location button
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
                className="resize-none min-h-[120px]"
                {...field}
              />
            </FormControl>
            <FormDescription>
              Optional: Add any additional information for the waste collector (e.g., gate access code, landmark, etc.)
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}