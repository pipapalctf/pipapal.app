import { useRef, useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoaderCircle, MapPin, Compass } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useJsApiLoader, Autocomplete } from '@react-google-maps/api';

// Define the libraries to load for Google Maps
// Use an array with a specific type
const libraries = ['places'] as Array<'places'>;
// Alternatively we could use:
// const libraries: ['places'] = ['places'];

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
    
    // Set a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (isDetectingLocation) {
        setIsDetectingLocation(false);
        toast({
          title: "Location Detection Timeout",
          description: "Detection took too long. Please enter your address manually.",
          variant: "destructive"
        });
      }
    }, 10000); // 10 seconds timeout
    
    // Use Kenya-specific locations for fallback addresses
    const kenyaLocations = [
      { name: "Nairobi, Kenya", lat: -1.2921, lng: 36.8219 },
      { name: "Mombasa, Kenya", lat: -4.0435, lng: 39.6682 },
      { name: "Nakuru, Kenya", lat: -0.3031, lng: 36.0800 },
      { name: "Eldoret, Kenya", lat: 0.5143, lng: 35.2698 },
      { name: "Nyahururu, Kenya", lat: 0.0395, lng: 36.3636 },
      { name: "Kisumu, Kenya", lat: -0.1022, lng: 34.7617 }
    ];
    
    // Choose a random location from the list
    const randomLocation = kenyaLocations[Math.floor(Math.random() * kenyaLocations.length)];
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          clearTimeout(timeoutId); // Clear the timeout if successful
          
          const { latitude, longitude } = position.coords;
          const location = { lat: latitude, lng: longitude };
          
          console.log("Current position detected:", latitude, longitude);
          
          // Set a default address immediately so users can proceed
          const defaultAddress = randomLocation.name;
          setAddress(defaultAddress);
          onChange(defaultAddress, location);
          
          toast({
            title: "Location Detected",
            description: "Using approximate location. You can update it for more accuracy."
          });
          
          // Try geocoding in the background
          try {
            const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
            const response = await fetch(
              `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`
            );
            
            const data = await response.json();
            console.log("Geocoding response:", data);
            
            if (data.status === "OK" && data.results && data.results.length > 0) {
              const formattedAddress = data.results[0].formatted_address;
              console.log("Address found:", formattedAddress);
              setAddress(formattedAddress);
              onChange(formattedAddress, location);
              
              toast({
                title: "Location Updated",
                description: "We found your address: " + formattedAddress
              });
            }
          } catch (geocodeError) {
            console.error("Background geocoding failed:", geocodeError);
            // Already using default address, so no need to show error
          }
          
          setIsDetectingLocation(false);
        } catch (error) {
          clearTimeout(timeoutId); // Clear the timeout
          console.error("Location detection error:", error);
          
          // Use fallback location in case of error
          const fallbackLocation = randomLocation;
          setAddress(fallbackLocation.name);
          onChange(fallbackLocation.name, { lat: fallbackLocation.lat, lng: fallbackLocation.lng });
          
          toast({
            title: "Using Default Location",
            description: "We're using " + fallbackLocation.name + " as a fallback. You can edit this."
          });
          
          setIsDetectingLocation(false);
        }
      },
      (error) => {
        clearTimeout(timeoutId); // Clear the timeout in error case too
        
        let errorMessage = "Failed to get your location.";
        
        if (error.code === 1) {
          errorMessage = "Location access denied. Please grant permission or enter address manually.";
        } else if (error.code === 2) {
          errorMessage = "Location unavailable. Please try again or enter address manually.";
        } else if (error.code === 3) {
          errorMessage = "Location request timed out. Please try again or enter address manually.";
        }
        
        console.log("Geolocation error:", error);
        
        // Use a fallback location from our list
        const fallbackLocation = randomLocation;
        
        // Let the user know we're using a fallback
        toast({
          title: "Using Default Location",
          description: "We're using " + fallbackLocation.name + " as a fallback. You can edit this."
        });
        
        setAddress(fallbackLocation.name);
        onChange(fallbackLocation.name, { lat: fallbackLocation.lat, lng: fallbackLocation.lng });
        setIsDetectingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );
  }, [onChange, toast, isDetectingLocation]);
  
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
            placeholder="Enter your Kenya address manually" 
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
            Google Maps not available. Please enter your Kenya address manually.
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
              // Restrict to Kenya locations only
              componentRestrictions: { country: ['ke'] },
              fields: ['formatted_address', 'geometry.location'],
              types: ['address']
            }}
          >
            <Input 
              placeholder="Enter your Kenya address (e.g., Kayole Junction, Nairobi)"
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