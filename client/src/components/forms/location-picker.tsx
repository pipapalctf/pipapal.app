import { useRef, useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoaderCircle, MapPin, Compass } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useJsApiLoader, Autocomplete } from '@react-google-maps/api';

// Define the libraries to load for Google Maps
const libraries = ['places'] as Array<'places'>;

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
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string || "", // Provide empty string as fallback
    libraries
  });
  
  // Handle API loading error
  useEffect(() => {
    if (loadError) {
      console.error("Google Maps API loading error:", loadError);
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
  
  // Define Kenya locations for fallbacks
  const kenyaLocations = [
    { name: "Nairobi, Kenya", lat: -1.2921, lng: 36.8219 },
    { name: "Mombasa, Kenya", lat: -4.0435, lng: 39.6682 },
    { name: "Nakuru, Kenya", lat: -0.3031, lng: 36.0800 },
    { name: "Eldoret, Kenya", lat: 0.5143, lng: 35.2698 },
    { name: "Nyahururu, Kenya", lat: 0.0395, lng: 36.3636 },
    { name: "Kisumu, Kenya", lat: -0.1022, lng: 34.7617 }
  ];
  
  // Function to use a fallback location
  const useFallbackLocation = useCallback((reason: string) => {
    const randomIndex = Math.floor(Math.random() * kenyaLocations.length);
    const fallbackLocation = kenyaLocations[randomIndex];
    
    console.log(`Using fallback location (${reason}):`, fallbackLocation);
    
    setAddress(fallbackLocation.name);
    onChange(fallbackLocation.name, { 
      lat: fallbackLocation.lat, 
      lng: fallbackLocation.lng 
    });
    
    toast({
      title: "Using Default Location",
      description: `${reason}. Using ${fallbackLocation.name} as a fallback.`
    });
    
    setIsDetectingLocation(false);
  }, [kenyaLocations, onChange, toast]);
  
  // Handle detect current location
  const detectCurrentLocation = useCallback(() => {
    setIsDetectingLocation(true);
    
    // Log environment details for debugging
    console.log("Environment check:");
    console.log("- Geolocation supported:", !!navigator.geolocation);
    console.log("- Protocol:", window.location.protocol);
    console.log("- Secure context:", window.isSecureContext);
    
    // Check if geolocation is supported
    if (!navigator.geolocation) {
      console.warn("Geolocation not supported by browser");
      useFallbackLocation("Geolocation is not supported by your browser");
      return;
    }
    
    // Check for secure context (required for geolocation)
    if (!window.isSecureContext) {
      console.warn("Not in secure context - geolocation may fail");
      // In non-secure contexts, try geolocation anyway but be prepared for it to fail
    }
    
    // Set a timeout to prevent hanging
    const timeoutId = setTimeout(() => {
      if (isDetectingLocation) {
        console.warn("Geolocation request timed out after 10 seconds");
        useFallbackLocation("Location detection timed out");
      }
    }, 10000);
    
    try {
      // Request the user's location
      console.log("Requesting geolocation...");
      navigator.geolocation.getCurrentPosition(
        // Success handler
        (position) => {
          clearTimeout(timeoutId);
          console.log("Geolocation success:", position);
          
          const { latitude, longitude } = position.coords;
          const location = { lat: latitude, lng: longitude };
          
          // First set a city-level location so user can proceed
          const closestCity = findClosestCity(latitude, longitude);
          setAddress(closestCity.name);
          onChange(closestCity.name, location);
          
          toast({
            title: "Location Detected",
            description: "Using approximate location. You can update it for more accuracy."
          });
          
          // Then try to get the precise address via geocoding
          getAddressFromCoords(latitude, longitude);
          
          setIsDetectingLocation(false);
        },
        // Error handler
        (error) => {
          clearTimeout(timeoutId);
          console.error("Geolocation error:", error);
          
          let message = "Failed to get your location";
          
          if (error.code === 1) {
            message = "Location access denied. Please grant permission";
          } else if (error.code === 2) {
            message = "Location unavailable on your device";
          } else if (error.code === 3) {
            message = "Location request timed out";
          }
          
          useFallbackLocation(message);
        },
        // Options
        {
          enableHighAccuracy: true,
          timeout: 8000,
          maximumAge: 0
        }
      );
    } catch (error) {
      console.error("Exception with geolocation API:", error);
      useFallbackLocation("Unexpected error accessing location services");
    }
  }, [useFallbackLocation, isDetectingLocation]);
  
  // Find the closest city from our predefined list
  const findClosestCity = (latitude: number, longitude: number) => {
    let closestCity = kenyaLocations[0];
    let minDistance = Number.MAX_VALUE;
    
    kenyaLocations.forEach(city => {
      const distance = Math.sqrt(
        Math.pow(city.lat - latitude, 2) + 
        Math.pow(city.lng - longitude, 2)
      );
      
      if (distance < minDistance) {
        minDistance = distance;
        closestCity = city;
      }
    });
    
    return closestCity;
  };
  
  // Get address from coordinates using Google's Geocoding API
  const getAddressFromCoords = async (latitude: number, longitude: number) => {
    try {
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      console.log("Geocoding with API key available:", !!apiKey);
      
      if (!apiKey) {
        console.warn("No Google Maps API key - skipping geocoding");
        return;
      }
      
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`
      );
      
      const data = await response.json();
      console.log("Geocoding response status:", data.status);
      
      if (data.status === "OK" && data.results && data.results.length > 0) {
        const formattedAddress = data.results[0].formatted_address;
        console.log("Found address:", formattedAddress);
        
        setAddress(formattedAddress);
        onChange(formattedAddress, { lat: latitude, lng: longitude });
        
        toast({
          title: "Location Updated",
          description: "We found your address: " + formattedAddress
        });
      } else {
        console.warn("Geocoding failed:", data.status, data.error_message);
      }
    } catch (error) {
      console.error("Geocoding request failed:", error);
    }
  };
  
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