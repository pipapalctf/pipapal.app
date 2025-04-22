import { useRef, useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoaderCircle, MapPin, Compass } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useJsApiLoader, Autocomplete } from '@react-google-maps/api';

// Define a simplified interface for geocoding results
interface GeocodingResult {
  formatted_address?: string;
  types?: string[];
}

// Helper function to find the best address from geocoding results
function findBestAddress(results: GeocodingResult[]): string {
  if (!results || results.length === 0) {
    return "Unknown Location, Kenya";
  }
  
  // First, try to find a result with premise or street_address type
  // These are typically the most specific
  for (const type of ['premise', 'street_address', 'point_of_interest']) {
    const addressResult = results.find(result => 
      result.types && result.types.includes(type)
    );
    
    if (addressResult?.formatted_address) {
      return addressResult.formatted_address;
    }
  }
  
  // If no specific address found, find the most appropriate level of location
  // in order from most specific to least specific
  for (const type of [
    'sublocality_level_1', 'sublocality', 'locality', 
    'administrative_area_level_2', 'administrative_area_level_1'
  ]) {
    const result = results.find(r => 
      r.types && r.types.includes(type)
    );
    
    if (result?.formatted_address) {
      return result.formatted_address;
    }
  }
  
  // Fall back to the first result if none of the above found
  return results[0].formatted_address || "Unknown Location, Kenya";
}

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
      console.log("Selected place:", place);
      
      if (place.geometry?.location) {
        // Always prioritize getting coordinates
        const location = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng()
        };
        
        // Use the best address representation available
        let selectedAddress = "";
        
        if (place.formatted_address) {
          // First choice: formatted address
          selectedAddress = place.formatted_address;
        } else if (place.name) {
          // Second choice: place name
          selectedAddress = place.name;
        } else {
          // Fallback: use coordinates
          selectedAddress = `Location at ${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`;
        }
        
        console.log("Using address:", selectedAddress);
        setAddress(selectedAddress);
        onChange(selectedAddress, location);
        
        toast({
          title: "Location Selected",
          description: selectedAddress
        });
      } else if (place.formatted_address) {
        // If we have address but no coordinates (rare)
        setAddress(place.formatted_address);
        onChange(place.formatted_address);
        
        toast({
          title: "Address Selected",
          description: "Note: No precise coordinates available for this location."
        });
      } else {
        console.error("Selected place has no location data:", place);
        toast({
          title: "Location Error",
          description: "This location doesn't have coordinates. Please try another location.",
          variant: "destructive"
        });
      }
    }
  }, [onChange, toast]);
  
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
    }, 15000); // 15 seconds timeout - increased from 10s
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          clearTimeout(timeoutId); // Clear the timeout if successful
          
          const { latitude, longitude } = position.coords;
          const location = { lat: latitude, lng: longitude };
          
          console.log("Current position detected:", latitude, longitude);
          
          // Add a loading toast to indicate processing
          toast({
            title: "Location Detected",
            description: "Getting your address from coordinates..."
          });
          
          // Immediately geocode without setting a default address first
          try {
            const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
            
            // Validate API key before making the request
            if (!apiKey || apiKey === "your-google-maps-api-key") {
              console.error("Invalid Google Maps API key");
              throw new Error("Invalid Google Maps API key configuration");
            }
            
            // Make the geocoding request with region biasing for Kenya
            const response = await fetch(
              `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}&region=ke`
            );
            
            const data = await response.json();
            console.log("Geocoding response:", data);
            
            if (data.status === "OK" && data.results && data.results.length > 0) {
              // Find the best address from the results
              const bestAddress = findBestAddress(data.results);
              console.log("Address found:", bestAddress);
              setAddress(bestAddress);
              onChange(bestAddress, location);
              
              toast({
                title: "Address Found",
                description: bestAddress
              });
            } else if (data.status === "ZERO_RESULTS") {
              throw new Error("No address found for this location");
            } else if (data.status === "REQUEST_DENIED") {
              throw new Error("API key error: " + (data.error_message || "Request denied"));
            } else {
              throw new Error("Geocoding failed: " + data.status);
            }
          } catch (geocodeError: any) {
            console.error("Geocoding failed:", geocodeError);
            
            // Set a fallback address if geocoding fails, but keep the correct coordinates
            // For Kenya, we'll use a specific location in Nyahururu as the default
            const defaultAddress = "Nyahururu, Laikipia County, Kenya";
            setAddress(defaultAddress);
            onChange(defaultAddress, location);
            
            toast({
              title: "Address Lookup Available",
              description: "Using your precise location coordinates with a general address. You can edit it for better accuracy.",
              variant: "default"
            });
          }
          
          setIsDetectingLocation(false);
        } catch (error) {
          clearTimeout(timeoutId); // Clear the timeout
          console.error("Location detection error:", error);
          toast({
            title: "Location Detection Failed",
            description: "Failed to process your location. Please enter your address manually.",
            variant: "destructive"
          });
          setIsDetectingLocation(false);
        }
      },
      (error) => {
        clearTimeout(timeoutId); // Clear the timeout in error case too
        
        let errorMessage = "Failed to get your location.";
        
        if (error.code === 1) {
          errorMessage = "Location access denied. Please grant permission in your browser settings and try again.";
        } else if (error.code === 2) {
          errorMessage = "Location unavailable. Please check your device's location services and try again.";
        } else if (error.code === 3) {
          errorMessage = "Location request timed out. Please try again with a better connection.";
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
        timeout: 10000, // Increased timeout to 10 seconds
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
              fields: ['formatted_address', 'geometry.location', 'name', 'place_id'],
              types: ['geocode', 'address', 'establishment'], // Broaden types to include more results
              bounds: {
                north: 5.5, // Northern Kenya bound
                south: -4.8, // Southern Kenya bound
                east: 41.9, // Eastern Kenya bound
                west: 33.9  // Western Kenya bound
              }
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