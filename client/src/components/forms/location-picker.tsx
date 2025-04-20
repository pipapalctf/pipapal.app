import { useRef, useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoaderCircle, MapPin, Compass } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useJsApiLoader, Autocomplete } from '@react-google-maps/api';

// Define the libraries to load for Google Maps
const libraries = ["places"] as const;

interface LocationPickerProps {
  defaultValue?: string;
  onChange: (address: string, location?: { lat: number, lng: number }) => void;
}

export default function LocationPicker({ defaultValue, onChange }: LocationPickerProps) {
  const { toast } = useToast();
  const [address, setAddress] = useState<string>(defaultValue || '');
  const [isDetectingLocation, setIsDetectingLocation] = useState<boolean>(false);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  
  // Load Google Maps API
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string,
    libraries
  });
  
  // Handle API loading error
  useEffect(() => {
    if (loadError) {
      toast({
        title: "Google Maps Error",
        description: "Failed to load Google Maps. Please enter your address manually.",
        variant: "destructive"
      });
    }
  }, [loadError, toast]);
  
  // Handle autocomplete selection
  const onPlaceSelected = useCallback(() => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace();
      if (place.formatted_address) {
        setAddress(place.formatted_address);
        
        // Get location coordinates if available
        const location = place.geometry?.location 
          ? { 
              lat: place.geometry.location.lat(), 
              lng: place.geometry.location.lng() 
            } 
          : undefined;
        
        onChange(place.formatted_address, location);
      }
    }
  }, [onChange]);
  
  // Handle detect current location
  const detectCurrentLocation = useCallback(() => {
    setIsDetectingLocation(true);
    
    if (!navigator.geolocation) {
      toast({
        title: "Location Detection Failed",
        description: "Geolocation is not supported by your browser. Please enter your address manually.",
        variant: "destructive"
      });
      setIsDetectingLocation(false);
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const location = { lat: latitude, lng: longitude };
          
          // Reverse geocode to get address from coordinates
          const response = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`
          );
          
          const data = await response.json();
          
          if (data.status === "OK" && data.results && data.results.length > 0) {
            const formattedAddress = data.results[0].formatted_address;
            setAddress(formattedAddress);
            onChange(formattedAddress, location);
          } else {
            throw new Error("No address found");
          }
        } catch (error) {
          toast({
            title: "Geocoding Failed",
            description: "Failed to get your address. Please enter it manually.",
            variant: "destructive"
          });
        } finally {
          setIsDetectingLocation(false);
        }
      },
      (error) => {
        let errorMessage = "Failed to get your location.";
        
        if (error.code === 1) {
          errorMessage = "Location access denied. Please grant permission or enter address manually.";
        } else if (error.code === 2) {
          errorMessage = "Location unavailable. Please try again or enter address manually.";
        } else if (error.code === 3) {
          errorMessage = "Location request timed out. Please try again or enter address manually.";
        }
        
        toast({
          title: "Location Detection Failed",
          description: errorMessage,
          variant: "destructive"
        });
        setIsDetectingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );
  }, [onChange, toast]);
  
  // Handle manual address input
  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAddress(e.target.value);
    onChange(e.target.value);
  };
  
  // If Google Maps API is loading or has an error, provide a basic input
  if (!isLoaded || loadError) {
    return (
      <div className="space-y-2">
        <div className="flex w-full items-center gap-2">
          <Input 
            placeholder="Enter your address manually" 
            value={address}
            onChange={handleAddressChange}
            className="flex-1"
          />
          <Button 
            variant="outline" 
            size="icon"
            onClick={detectCurrentLocation}
            disabled={isDetectingLocation || !!loadError}
            title="Detect my location"
          >
            {isDetectingLocation ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <Compass className="h-4 w-4" />
            )}
          </Button>
        </div>
        {loadError && (
          <p className="text-xs text-destructive">
            Google Maps not available. Please enter your address manually.
          </p>
        )}
      </div>
    );
  }
  
  return (
    <div className="space-y-2">
      <div className="flex w-full items-center gap-2">
        <div className="relative flex-1">
          <Autocomplete
            onLoad={(autocomplete) => {
              autocompleteRef.current = autocomplete;
            }}
            onPlaceChanged={onPlaceSelected}
            options={{
              componentRestrictions: { country: ['us', 'ca'] }, // Restrict to US and Canada (modify as needed)
              fields: ['formatted_address', 'geometry.location'],
              types: ['address']
            }}
          >
            <Input 
              placeholder="Start typing your address or detect location"
              value={address}
              onChange={handleAddressChange}
              className="w-full pr-8"
            />
          </Autocomplete>
          <MapPin className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        </div>
        <Button 
          variant="outline" 
          size="icon"
          onClick={detectCurrentLocation}
          disabled={isDetectingLocation}
          title="Detect my location"
        >
          {isDetectingLocation ? (
            <LoaderCircle className="h-4 w-4 animate-spin" />
          ) : (
            <Compass className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}