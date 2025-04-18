import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

export default function CollectionMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // This would be replaced with actual collection points from the API
    const demoCollectionPoints = [
      { lat: 40.7128, lng: -74.0060, title: "Downtown Collection Point" },
      { lat: 40.7282, lng: -73.9942, title: "Eastside Recycling Center" },
      { lat: 40.7031, lng: -74.0102, title: "Upcoming Pickup Location" }
    ];
    
    // Function to initialize the map once the API is loaded
    window.initMap = () => {
      if (!mapRef.current) return;
      
      try {
        // Create the map centered at the first collection point or a default location
        const map = new window.google.maps.Map(mapRef.current, {
          center: demoCollectionPoints[0] || { lat: 40.7128, lng: -74.0060 },
          zoom: 13,
          mapTypeControl: false,
          fullscreenControl: false,
          streetViewControl: false,
        });
        
        // Add markers for each collection point
        demoCollectionPoints.forEach(point => {
          const marker = new window.google.maps.Marker({
            position: { lat: point.lat, lng: point.lng },
            map,
            title: point.title,
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              fillColor: '#2ECC71',
              fillOpacity: 1,
              strokeWeight: 0,
              scale: 8
            }
          });
          
          // Add an info window with more details
          const infoWindow = new window.google.maps.InfoWindow({
            content: `<div><strong>${point.title}</strong></div>`
          });
          
          marker.addListener('click', () => {
            infoWindow.open(map, marker);
          });
        });
        
        setMapLoaded(true);
      } catch (err) {
        console.error("Error initializing map:", err);
        setError("Failed to load the map");
      }
    };
    
    // Load the Google Maps API
    const googleMapsApiKey = process.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!googleMapsApiKey) {
      setError("Google Maps API key is missing");
      return;
    }
    
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&callback=initMap`;
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      setError("Failed to load Google Maps");
    };
    
    document.head.appendChild(script);
    
    return () => {
      document.head.removeChild(script);
    };
  }, []);
  
  return (
    <Card>
      <CardHeader className="border-b border-gray-100">
        <CardTitle>Collection Map</CardTitle>
        <CardDescription>Nearby collection points and scheduled pickups</CardDescription>
      </CardHeader>
      <CardContent className="p-0 h-80 relative bg-gray-100">
        {error ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <i className="fas fa-map-marker-alt text-4xl text-primary mb-3"></i>
              <p>{error}</p>
            </div>
          </div>
        ) : !mapLoaded ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <i className="fas fa-map-marker-alt text-4xl text-primary mb-3"></i>
              <p className="text-gray-600">Loading map...</p>
            </div>
          </div>
        ) : (
          <div ref={mapRef} className="w-full h-full" />
        )}
        
        {/* Map Controls Overlay */}
        <div className="absolute bottom-5 right-5 flex flex-col space-y-2">
          <Button 
            variant="secondary" 
            size="icon" 
            className="h-10 w-10 rounded-full shadow-md bg-white text-secondary hover:bg-gray-100"
          >
            <i className="fas fa-plus"></i>
          </Button>
          <Button 
            variant="secondary" 
            size="icon" 
            className="h-10 w-10 rounded-full shadow-md bg-white text-secondary hover:bg-gray-100"
          >
            <i className="fas fa-minus"></i>
          </Button>
          <Button 
            variant="secondary" 
            size="icon" 
            className="h-10 w-10 rounded-full shadow-md bg-white text-secondary hover:bg-gray-100"
          >
            <i className="fas fa-location-arrow"></i>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
