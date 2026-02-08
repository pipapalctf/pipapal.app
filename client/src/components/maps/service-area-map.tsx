import React, { useState, useCallback, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker, Circle } from '@react-google-maps/api';
import { MapPin, AlertTriangle, Loader2 } from 'lucide-react';
import { Collection } from '@shared/schema';

// Define the libraries to load for Google Maps
const libraries = ['places'] as Array<'places'>;

// Default map settings
const containerStyle = {
  width: '100%',
  height: '400px'
};

const defaultCenter = {
  lat: -1.2921,  // Default to Nairobi, Kenya
  lng: 36.8219
};

interface ServiceAreaMapProps {
  collections: Collection[];
  collectorAddress?: string;
}

export function ServiceAreaMap({ collections, collectorAddress }: ServiceAreaMapProps) {
  const [center, setCenter] = useState(defaultCenter);
  const [mapRef, setMapRef] = useState<google.maps.Map | null>(null);
  const [serviceArea, setServiceArea] = useState<{ lat: number, lng: number, radius: number } | null>(null);

  // Load Google Maps API
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string,
    libraries
  });

  // Get all valid collection locations with coordinates
  const collectionMarkers = collections
    .filter(collection => 
      collection.location && 
      typeof collection.location === 'object' &&
      collection.location !== null &&
      'lat' in (collection.location as any) && 
      'lng' in (collection.location as any)
    )
    .map(collection => ({
      id: collection.id,
      position: {
        lat: (collection.location as any).lat as number,
        lng: (collection.location as any).lng as number
      },
      status: collection.status,
      address: collection.address
    }));

  // Calculate service area center and radius based on collection points
  useEffect(() => {
    if (collectionMarkers.length > 0) {
      // Calculate the center of all collection points
      const totalLat = collectionMarkers.reduce((sum, marker) => sum + marker.position.lat, 0);
      const totalLng = collectionMarkers.reduce((sum, marker) => sum + marker.position.lng, 0);
      
      const centerLat = totalLat / collectionMarkers.length;
      const centerLng = totalLng / collectionMarkers.length;
      
      // Calculate the maximum distance from center to any point to determine radius
      let maxDistance = 0;
      
      collectionMarkers.forEach(marker => {
        const distance = getDistanceFromLatLonInKm(
          centerLat, 
          centerLng, 
          marker.position.lat, 
          marker.position.lng
        );
        
        if (distance > maxDistance) {
          maxDistance = distance;
        }
      });
      
      // Set service area with some padding (convert km to meters)
      setServiceArea({
        lat: centerLat,
        lng: centerLng,
        radius: (maxDistance * 1000) * 1.2 // Add 20% padding
      });
      
      // Update map center
      setCenter({ lat: centerLat, lng: centerLng });
    }
  }, [collectionMarkers]);

  // Function to calculate distance between coordinates
  function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
  }

  function deg2rad(deg: number) {
    return deg * (Math.PI / 180);
  }

  // Callback when the map is loaded
  const onLoad = useCallback((map: google.maps.Map) => {
    setMapRef(map);
  }, []);

  const onUnmount = useCallback(() => {
    setMapRef(null);
  }, []);

  // Set the marker color based on collection status
  const getMarkerIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return 'http://maps.google.com/mapfiles/ms/icons/green-dot.png';
      case 'in_progress':
        return 'http://maps.google.com/mapfiles/ms/icons/yellow-dot.png';
      case 'scheduled':
        return 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png';
      default:
        return 'http://maps.google.com/mapfiles/ms/icons/red-dot.png';
    }
  };

  // Create fallback locations if there are no collections with coordinates
  const getFallbackLocations = () => {
    // Nairobi neighborhoods
    return [
      { id: 'downtown', position: { lat: -1.2921, lng: 36.8219 }, status: 'completed', address: 'Downtown Nairobi' },
      { id: 'karen', position: { lat: -1.3218, lng: 36.7116 }, status: 'scheduled', address: 'Karen' },
      { id: 'westlands', position: { lat: -1.2683, lng: 36.8106 }, status: 'in_progress', address: 'Westlands' },
      { id: 'kilimani', position: { lat: -1.2857, lng: 36.7886 }, status: 'scheduled', address: 'Kilimani' },
      { id: 'parklands', position: { lat: -1.2639, lng: 36.8273 }, status: 'completed', address: 'Parklands' }
    ];
  };

  // Use real or fallback locations
  const markersToDisplay = collectionMarkers.length > 0 
    ? collectionMarkers 
    : getFallbackLocations();

  // Handle loading error
  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] bg-muted rounded-lg">
        <AlertTriangle className="h-12 w-12 text-destructive mb-2" />
        <h3 className="text-lg font-medium">Map Loading Error</h3>
        <p className="text-sm text-muted-foreground text-center max-w-md mt-2">
          Failed to load Google Maps. Please check your internet connection or API key.
        </p>
      </div>
    );
  }

  // Loading state
  if (!isLoaded) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] bg-muted rounded-lg">
        <Loader2 className="h-12 w-12 text-primary animate-spin mb-2" />
        <h3 className="text-lg font-medium">Loading Map</h3>
        <p className="text-sm text-muted-foreground">
          Please wait while we load the service area map...
        </p>
      </div>
    );
  }

  return (
    <div className="relative">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={12}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={{
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: true,
          zoomControl: true,
        }}
      >
        {/* Service Area Circle */}
        {serviceArea && (
          <Circle
            center={{ lat: serviceArea.lat, lng: serviceArea.lng }}
            radius={serviceArea.radius}
            options={{
              fillColor: '#0088FE',
              fillOpacity: 0.1,
              strokeColor: '#0088FE',
              strokeOpacity: 0.8,
              strokeWeight: 2,
            }}
          />
        )}

        {/* Collection Markers */}
        {markersToDisplay.map(marker => (
          <Marker
            key={marker.id}
            position={marker.position}
            icon={getMarkerIcon(marker.status)}
            title={marker.address}
          />
        ))}

        {/* Collector Home Base */}
        {collectorAddress && (
          <Marker
            position={center}
            icon={{
              url: 'http://maps.google.com/mapfiles/ms/icons/purple-dot.png',
              scaledSize: new google.maps.Size(40, 40)
            }}
            title="Collector Home Base"
          />
        )}
      </GoogleMap>
      
      {/* Map Legend */}
      <div className="absolute bottom-3 left-3 bg-background/90 p-2 rounded-md shadow-md border border-border text-xs">
        <div className="font-semibold mb-1">Map Legend:</div>
        <div className="flex items-center mb-1">
          <div className="w-3 h-3 rounded-full bg-green-500 mr-1"></div>
          <span>Completed Collections</span>
        </div>
        <div className="flex items-center mb-1">
          <div className="w-3 h-3 rounded-full bg-yellow-500 mr-1"></div>
          <span>In Progress Collections</span>
        </div>
        <div className="flex items-center mb-1">
          <div className="w-3 h-3 rounded-full bg-blue-500 mr-1"></div>
          <span>Scheduled Collections</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-purple-500 mr-1"></div>
          <span>Collector Base</span>
        </div>
      </div>
    </div>
  );
}