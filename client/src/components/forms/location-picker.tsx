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
  
  // Handle detect current location with improved accuracy and error handling
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
    }, 15000); // 15 seconds timeout for slower devices/connections
    
    // Show initial toast to let user know we're detecting location
    toast({
      title: "Detecting Location",
      description: "Please allow location access if prompted"
    });
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          clearTimeout(timeoutId); // Clear the timeout if successful
          
          const { latitude, longitude } = position.coords;
          const location = { lat: latitude, lng: longitude };
          
          console.log("Current position detected:", latitude, longitude);
          
          // Prepare loading state
          toast({
            title: "Location Found",
            description: "Getting your address details..."
          });
          
          // Try reverse geocoding with the Google Maps Geocoding API
          try {
            const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
            
            // First try with the Google Maps Geocoding API
            const response = await fetch(
              `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}&result_type=street_address|premise|subpremise|route|neighborhood`
            );
            
            const data = await response.json();
            console.log("Geocoding response:", data);
            
            if (data.status === "OK" && data.results && data.results.length > 0) {
              // Find the most detailed result (usually the first one)
              const bestResult = data.results[0];
              const formattedAddress = bestResult.formatted_address;
              
              console.log("Address found:", formattedAddress);
              setAddress(formattedAddress);
              onChange(formattedAddress, location);
              
              toast({
                title: "Location Detected Successfully",
                description: "Using your current location: " + formattedAddress
              });
              
              setIsDetectingLocation(false);
              return; // Exit early if we have a good result
            } else if (data.status === "ZERO_RESULTS") {
              // If we get no results, try again with fewer restrictions
              const fallbackResponse = await fetch(
                `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`
              );
              
              const fallbackData = await fallbackResponse.json();
              
              if (fallbackData.status === "OK" && fallbackData.results && fallbackData.results.length > 0) {
                const formattedAddress = fallbackData.results[0].formatted_address;
                setAddress(formattedAddress);
                onChange(formattedAddress, location);
                
                toast({
                  title: "Location Detected",
                  description: "Using approximate address: " + formattedAddress
                });
                
                setIsDetectingLocation(false);
                return;
              }
            } else if (data.status === "REQUEST_DENIED" || data.status === "INVALID_REQUEST") {
              throw new Error(`Google API Error: ${data.error_message || data.status}`);
            }
            
            // If we reach here, we couldn't get a good address
            throw new Error("Could not get a valid address for your location");
            
          } catch (geocodeError) {
            console.error("Geocoding failed:", geocodeError);
            // Fallback to default address
            const defaultAddress = "Nairobi, Kenya";
            setAddress(defaultAddress);
            onChange(defaultAddress, location);
            
            toast({
              title: "Address Not Found",
              description: "Using your GPS coordinates, but could not determine exact address. Please enter it manually for accuracy.",
              variant: "destructive"
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
        let errorTitle = "Location Detection Failed";
        
        if (error.code === 1) {
          errorMessage = "Location access was denied. Please click 'Allow' when prompted for location access or enter your address manually.";
          errorTitle = "Permission Denied";
        } else if (error.code === 2) {
          errorMessage = "Location unavailable. Your device cannot determine your current position. Please enter your address manually.";
          errorTitle = "Location Unavailable";
        } else if (error.code === 3) {
          errorMessage = "Location request timed out. Please check your GPS or internet connection and try again.";
          errorTitle = "Request Timeout";
        }
        
        toast({
          title: errorTitle,
          description: errorMessage,
          variant: "destructive"
        });
        setIsDetectingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000, // Increased timeout for GPS acquisition
        maximumAge: 0 // Always get fresh position
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
        <div className="flex flex-col md:flex-row w-full items-start md:items-center gap-2">
          <div className="relative flex-1 w-full">
            <Input 
              placeholder="Enter your Kenya address manually" 
              value={address}
              onChange={handleAddressChange}
              className="w-full pr-8"
            />
            <MapPin className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          </div>
          <Button 
            variant="secondary" 
            size="default"
            onClick={detectCurrentLocation}
            disabled={isDetectingLocation || !!loadError}
            title="Detect my current location"
            className="relative overflow-hidden w-full md:w-auto whitespace-nowrap"
          >
            {isDetectingLocation ? (
              <>
                <LoaderCircle className="h-4 w-4 animate-spin mr-2" />
                <span>Detecting...</span>
              </>
            ) : (
              <>
                <Compass className="h-4 w-4 mr-2" />
                <span>Detect Location</span>
              </>
            )}
            {isDetectingLocation && (
              <div className="absolute bottom-0 left-0 h-1 bg-primary animate-pulse" style={{ 
                width: '100%', 
                animation: 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite'
              }}></div>
            )}
          </Button>
        </div>
        {loadError ? (
          <p className="text-xs text-destructive flex items-center">
            <MapPin className="h-3 w-3 mr-1 inline" />
            Google Maps not available. Please enter your Kenya address manually.
          </p>
        ) : (
          <p className="text-xs text-muted-foreground flex items-center">
            <MapPin className="h-3 w-3 mr-1 inline" />
            For accurate pickup, please allow location access or type your precise address
          </p>
        )}
      </div>
    );
  }
  
  return (
    <div className="space-y-2">
      <div className="flex flex-col md:flex-row w-full items-start md:items-center gap-2">
        <div className="relative flex-1 w-full">
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
          variant="secondary" 
          size="default"
          onClick={detectCurrentLocation}
          disabled={isDetectingLocation}
          title="Detect my current location"
          className="relative overflow-hidden w-full md:w-auto whitespace-nowrap"
        >
          {isDetectingLocation ? (
            <>
              <LoaderCircle className="h-4 w-4 animate-spin mr-2" />
              <span>Detecting...</span>
            </>
          ) : (
            <>
              <Compass className="h-4 w-4 mr-2" />
              <span>Detect Location</span>
            </>
          )}
          {isDetectingLocation && (
            <div className="absolute bottom-0 left-0 h-1 bg-primary animate-pulse" style={{ 
              width: '100%', 
              animation: 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite'
            }}></div>
          )}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground flex items-center">
        <MapPin className="h-3 w-3 mr-1 inline" />
        For accurate pickup, please allow location access or type your precise address
      </p>
    </div>
  );
}