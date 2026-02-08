import { useState } from 'react';
import { Input } from "@/components/ui/input";
import { MapPin } from "lucide-react";

interface LocationPickerProps {
  defaultValue?: string;
  onChange: (address: string) => void;
}

export default function LocationPicker({ defaultValue, onChange }: LocationPickerProps) {
  const [address, setAddress] = useState<string>(defaultValue || '');
  
  // Handle manual address input
  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAddress(e.target.value);
    onChange(e.target.value);
  };
  
  return (
    <div className="space-y-3">
      <div className="w-full">
        <div className="relative flex-1">
          <Input 
            placeholder="Enter your detailed address (e.g., Kayole Junction, School Lane)"
            value={address}
            onChange={handleAddressChange}
            className="w-full pr-8"
          />
          <MapPin className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        </div>
      </div>
      
      {/* Informational tooltip */}
      <div className="flex items-start gap-2 p-3 bg-primary/5 border border-primary/20 rounded-md">
        <MapPin className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
        <div className="space-y-1">
          <p className="text-xs font-medium">Address Information</p>
          <p className="text-xs text-muted-foreground">
            Please provide a specific address in Kenya, including street name, nearby landmarks or building name.
          </p>
          <p className="text-xs text-muted-foreground">
            Examples: "27 Kenyatta Ave" or "Near Junction Mall, Ngong Road"
          </p>
        </div>
      </div>
    </div>
  );
}