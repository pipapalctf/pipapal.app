import React, { useState, useCallback, useEffect } from 'react';
import { 
  GoogleMap, 
  useJsApiLoader, 
  Marker, 
  DirectionsRenderer, 
  InfoWindow 
} from '@react-google-maps/api';
import { 
  Loader2, 
  AlertTriangle, 
  MapPin, 
  Navigation, 
  Clock, 
  Fuel,
  Truck
} from 'lucide-react';
import { Collection } from '@shared/schema';
import { formatNumber } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Define the libraries to load for Google Maps
const libraries = ['places'] as Array<'places'>;

// Default map settings
const containerStyle = {
  width: '100%',
  height: '500px'
};

const defaultCenter = {
  lat: -1.2921, // Default to Nairobi, Kenya
  lng: 36.8219
};

interface RouteOptimizationMapProps {
  collections: Collection[];
  collectorAddress?: string;
}

export function RouteOptimizationMap({ collections, collectorAddress }: RouteOptimizationMapProps) {
  const [center, setCenter] = useState(defaultCenter);
  const [mapRef, setMapRef] = useState<google.maps.Map | null>(null);
  const [activeCollections, setActiveCollections] = useState<Collection[]>([]);
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [selectedMarker, setSelectedMarker] = useState<Collection | null>(null);
  const [routeStats, setRouteStats] = useState({
    totalDistance: '',
    totalDuration: '',
    etaTime: '',
    fuelEstimate: ''
  });
  const [routeType, setRouteType] = useState<'optimal' | 'byWasteType'>('optimal');
  const [selectedWasteType, setSelectedWasteType] = useState<string>('all');
  const [availableWasteTypes, setAvailableWasteTypes] = useState<string[]>([]);

  // Load Google Maps API
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string,
    libraries
  });

  // Get active collections (in progress or scheduled)
  useEffect(() => {
    const filteredCollections = collections.filter(c => 
      c.status === 'scheduled' || c.status === 'in_progress'
    );
    setActiveCollections(filteredCollections);
    
    // Extract unique waste types
    const wasteTypes = Array.from(new Set(
      filteredCollections.map(c => c.wasteType)
    )).filter(Boolean) as string[];
    
    setAvailableWasteTypes(wasteTypes);
    
    // Set center to Nairobi or collector's address if available
    if (collectorAddress) {
      // If we had geocoding we'd convert address to coordinates here
      // For now we'll use the default center
    }
  }, [collections, collectorAddress]);

  // Get filtered collections based on waste type selection
  const getFilteredCollections = () => {
    if (selectedWasteType === 'all') {
      return activeCollections;
    }
    return activeCollections.filter(c => c.wasteType === selectedWasteType);
  };

  // Function to calculate and display the route
  const calculateRoute = useCallback(async () => {
    if (!isLoaded || !mapRef) return;
    
    // Get filtered collections
    const filteredCollections = getFilteredCollections();
    if (filteredCollections.length === 0) return;
    
    // Convert collections to waypoints
    const waypoints = filteredCollections.map(collection => {
      // Use location if available, otherwise try to get coordinates from address
      // For demo purposes, we'll use a slight offset from center for each point
      const randomLat = center.lat + (Math.random() - 0.5) * 0.05;
      const randomLng = center.lng + (Math.random() - 0.5) * 0.05;
      
      return {
        location: new google.maps.LatLng(
          // If collection has location use it, otherwise use random offset
          collection.location ? 
            (collection.location as any).lat : 
            randomLat,
          collection.location ? 
            (collection.location as any).lng : 
            randomLng
        ),
        stopover: true
      };
    });
    
    // Need at least one waypoint for directions
    if (waypoints.length === 0) return;
    
    // Create DirectionsService
    const directionsService = new google.maps.DirectionsService();
    
    try {
      // Request optimized route or route by waste type
      const request: google.maps.DirectionsRequest = {
        origin: center, // Start from collector's address or center
        destination: center, // Return to origin
        waypoints: waypoints,
        optimizeWaypoints: routeType === 'optimal',
        travelMode: google.maps.TravelMode.DRIVING
      };
      
      const result = await directionsService.route(request);
      setDirections(result);
      
      // Calculate route statistics
      if (result.routes.length > 0) {
        const route = result.routes[0];
        let totalDistance = 0;
        let totalDuration = 0;
        
        route.legs.forEach(leg => {
          if (leg.distance && leg.duration) {
            totalDistance += leg.distance.value;
            totalDuration += leg.duration.value;
          }
        });
        
        // Convert to km and minutes
        const distanceKm = totalDistance / 1000;
        const durationMin = totalDuration / 60;
        
        // Calculate ETA
        const now = new Date();
        const eta = new Date(now.getTime() + totalDuration * 1000);
        
        // Estimate fuel usage (rough estimate: 10L/100km)
        const fuelLiters = (distanceKm / 100) * 10;
        
        setRouteStats({
          totalDistance: `${distanceKm.toFixed(1)} km`,
          totalDuration: `${Math.round(durationMin)} min`,
          etaTime: eta.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          fuelEstimate: `${fuelLiters.toFixed(1)} L`
        });
      }
    } catch (error) {
      console.error("Error calculating route:", error);
    }
  }, [isLoaded, mapRef, center, activeCollections, routeType, selectedWasteType]);

  // Callback when the map is loaded
  const onLoad = useCallback((map: google.maps.Map) => {
    setMapRef(map);
  }, []);

  const onUnmount = useCallback(() => {
    setMapRef(null);
  }, []);

  // Handle waste type change
  const handleWasteTypeChange = (value: string) => {
    setSelectedWasteType(value);
    setDirections(null); // Reset directions when filter changes
  };

  // Handle route type change
  const handleRouteTypeChange = (value: 'optimal' | 'byWasteType') => {
    setRouteType(value);
    setDirections(null); // Reset directions when route type changes
  };

  // Set the marker color based on collection status and waste type
  const getMarkerIcon = (collection: Collection) => {
    // Basic colors by status
    const statusColors = {
      'scheduled': 'blue',
      'in_progress': 'yellow',
      'completed': 'green',
      'default': 'red'
    };
    
    const status = collection.status || 'default';
    return `http://maps.google.com/mapfiles/ms/icons/${statusColors[status as keyof typeof statusColors]}-dot.png`;
  };

  // Handle loading error
  if (loadError) {
    console.error("Google Maps API loading error:", loadError);
    
    // Fallback display - Simple visual representation of collections
    return (
      <div className="space-y-4">
        <div className="flex flex-col items-center justify-center py-4 bg-muted rounded-lg">
          <AlertTriangle className="h-8 w-8 text-amber-600 mb-2" />
          <h3 className="text-lg font-medium">Map Loading Error</h3>
          <p className="text-sm text-muted-foreground text-center max-w-md mt-1">
            Failed to load Google Maps. Using simplified visualization instead.
          </p>
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-800">
            <p>To enable the full Google Maps experience:</p>
            <ol className="list-decimal pl-4 mt-1 space-y-1">
              <li>Ensure the API key has Directions API enabled</li>
              <li>Check if billing is enabled for your Google Maps account</li>
            </ol>
          </div>
        </div>
        
        {/* Fallback visualization */}
        <div className="border rounded-lg p-4 bg-gray-50">
          <h3 className="font-medium mb-4">Collection Points (Simplified View)</h3>
          
          <div className="relative w-full h-[300px] border border-dashed rounded-lg bg-white">
            {/* Collector base in center */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white">
                <Truck className="h-4 w-4" />
              </div>
              <div className="text-xs text-center mt-1 font-medium">Base</div>
            </div>
            
            {/* Collection points */}
            {activeCollections.map((collection, index) => {
              // Position points in a circle around the base
              const angle = (index / activeCollections.length) * Math.PI * 2;
              const radius = 120; // Pixels from center
              const top = `calc(50% + ${Math.sin(angle) * radius}px)`;
              const left = `calc(50% + ${Math.cos(angle) * radius}px)`;
              
              // Determine color based on collection status
              const colors = {
                'scheduled': 'bg-blue-500',
                'in_progress': 'bg-yellow-500',
                'completed': 'bg-green-500',
                'default': 'bg-gray-500'
              };
              
              const status = collection.status || 'default';
              const bgColor = colors[status as keyof typeof colors];
              
              return (
                <div 
                  key={collection.id}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2"
                  style={{ top, left }}
                >
                  <div className={`w-6 h-6 ${bgColor} rounded-full flex items-center justify-center text-white`}>
                    {index + 1}
                  </div>
                  <div className="text-xs text-center mt-1">
                    {(collection.address || '').split(',')[0]}
                  </div>
                </div>
              );
            })}
            
            {/* Show connections */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              {activeCollections.map((_, index) => {
                const angle = (index / activeCollections.length) * Math.PI * 2;
                const radius = 120;
                const x = 150 + Math.cos(angle) * radius;
                const y = 150 + Math.sin(angle) * radius;
                
                return (
                  <line 
                    key={index}
                    x1="50%"
                    y1="50%"
                    x2={x}
                    y2={y}
                    stroke="#9333ea"
                    strokeWidth="2"
                    strokeDasharray="5,5"
                    strokeOpacity="0.6"
                  />
                );
              })}
            </svg>
          </div>
          
          <div className="mt-4">
            <h4 className="text-sm font-medium mb-2">Collection Sequence</h4>
            <div className="space-y-2">
              {activeCollections.length === 0 ? (
                <p className="text-sm text-muted-foreground">No active collections to route</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {activeCollections.map((collection, index) => (
                    <div key={collection.id} className="flex items-center border rounded p-2 bg-white">
                      <div className="mr-3 w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white text-sm font-medium">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium capitalize text-sm">{collection.wasteType}</div>
                        <div className="text-xs text-muted-foreground truncate">{collection.address}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (!isLoaded) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px] bg-muted rounded-lg">
        <Loader2 className="h-12 w-12 text-primary animate-spin mb-2" />
        <h3 className="text-lg font-medium">Loading Map</h3>
        <p className="text-sm text-muted-foreground">
          Please wait while we load the route optimization map...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
        <Card className="p-4 flex-1">
          <h3 className="font-medium mb-3">Route Options</h3>
          
          <div className="space-y-4">
            <RadioGroup 
              defaultValue="optimal" 
              value={routeType}
              onValueChange={(value) => handleRouteTypeChange(value as 'optimal' | 'byWasteType')}
              className="flex flex-col space-y-1"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="optimal" id="optimal" />
                <Label htmlFor="optimal">Optimize Route (Shortest Path)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="byWasteType" id="byWasteType" />
                <Label htmlFor="byWasteType">Group By Waste Type</Label>
              </div>
            </RadioGroup>
            
            <div className="space-y-2">
              <Label htmlFor="wasteType">Filter by Waste Type</Label>
              <Select
                value={selectedWasteType}
                onValueChange={handleWasteTypeChange}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Waste Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Waste Types</SelectItem>
                  {availableWasteTypes.map(type => (
                    <SelectItem key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Button 
              onClick={calculateRoute} 
              disabled={activeCollections.length === 0}
              className="w-full"
            >
              <Navigation className="mr-2 h-4 w-4" />
              Calculate Route
            </Button>
          </div>
        </Card>
        
        <Card className="p-4 flex-1">
          <h3 className="font-medium mb-3">Route Statistics</h3>
          
          {directions ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Total Distance</div>
                <div className="font-medium flex items-center">
                  <MapPin className="mr-1 h-4 w-4 text-primary" />
                  {routeStats.totalDistance}
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Total Duration</div>
                <div className="font-medium flex items-center">
                  <Clock className="mr-1 h-4 w-4 text-primary" />
                  {routeStats.totalDuration}
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Estimated Arrival</div>
                <div className="font-medium flex items-center">
                  <Clock className="mr-1 h-4 w-4 text-primary" />
                  {routeStats.etaTime}
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Est. Fuel Usage</div>
                <div className="font-medium flex items-center">
                  <Fuel className="mr-1 h-4 w-4 text-primary" />
                  {routeStats.fuelEstimate}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-4">
              {activeCollections.length === 0 ? (
                <p>No active collections to route</p>
              ) : (
                <p>Click "Calculate Route" to see statistics</p>
              )}
            </div>
          )}
        </Card>
      </div>
      
      <div className="relative rounded-lg overflow-hidden border">
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={center}
          zoom={12}
          onLoad={onLoad}
          onUnmount={onUnmount}
          options={{
            streetViewControl: false,
            mapTypeControl: true,
            fullscreenControl: true,
            zoomControl: true,
          }}
        >
          {/* Collector's base marker */}
          <Marker
            position={center}
            icon={{
              url: 'http://maps.google.com/mapfiles/ms/icons/purple-dot.png',
              scaledSize: new google.maps.Size(40, 40)
            }}
            title="Collector Base"
          />
          
          {/* Collection point markers */}
          {!directions && getFilteredCollections().map(collection => (
            <Marker
              key={collection.id}
              position={{
                lat: collection.location ? (collection.location as any).lat as number : 
                  (center.lat + (Math.random() - 0.5) * 0.05),
                lng: collection.location ? (collection.location as any).lng as number : 
                  (center.lng + (Math.random() - 0.5) * 0.05)
              }}
              icon={getMarkerIcon(collection)}
              title={`${collection.wasteType} collection at ${collection.address}`}
              onClick={() => setSelectedMarker(collection)}
            />
          ))}
          
          {/* Selected marker info window */}
          {selectedMarker && (
            <InfoWindow
              position={{
                lat: selectedMarker.location ? (selectedMarker.location as any).lat as number : 
                  (center.lat + (Math.random() - 0.5) * 0.05),
                lng: selectedMarker.location ? (selectedMarker.location as any).lng as number : 
                  (center.lng + (Math.random() - 0.5) * 0.05)
              }}
              onCloseClick={() => setSelectedMarker(null)}
            >
              <div className="p-2 max-w-xs">
                <h4 className="font-medium capitalize">{selectedMarker.wasteType} Collection</h4>
                <p className="text-sm">{selectedMarker.address}</p>
                {selectedMarker.wasteAmount && (
                  <p className="text-sm">Amount: {formatNumber(selectedMarker.wasteAmount)} kg</p>
                )}
                <p className="text-sm capitalize">Status: {selectedMarker.status}</p>
                {selectedMarker.notes && (
                  <p className="text-sm mt-1">Notes: {selectedMarker.notes}</p>
                )}
              </div>
            </InfoWindow>
          )}
          
          {/* Directions renderer */}
          {directions && (
            <DirectionsRenderer
              directions={directions}
              options={{
                suppressMarkers: false,
                polylineOptions: {
                  strokeColor: '#4CAF50',
                  strokeWeight: 5,
                  strokeOpacity: 0.7
                }
              }}
            />
          )}
        </GoogleMap>
        
        {/* Map Legend */}
        <div className="absolute bottom-3 left-3 bg-background/90 p-2 rounded-md shadow-md border border-border text-xs">
          <div className="font-semibold mb-1">Map Legend:</div>
          <div className="flex items-center mb-1">
            <div className="w-3 h-3 rounded-full bg-blue-500 mr-1"></div>
            <span>Scheduled Collections</span>
          </div>
          <div className="flex items-center mb-1">
            <div className="w-3 h-3 rounded-full bg-yellow-500 mr-1"></div>
            <span>In Progress Collections</span>
          </div>
          <div className="flex items-center mb-1">
            <div className="w-3 h-3 rounded-full bg-purple-500 mr-1"></div>
            <span>Collector Base</span>
          </div>
          {directions && (
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 mr-1"></div>
              <span>Optimized Route</span>
            </div>
          )}
        </div>
      </div>
      
      {activeCollections.length === 0 && (
        <div className="bg-amber-50 border-amber-200 border p-4 rounded-lg text-amber-800">
          <h4 className="font-medium flex items-center">
            <AlertTriangle className="h-4 w-4 mr-2 text-amber-600" />
            No Active Collections
          </h4>
          <p className="text-sm mt-1">
            There are no scheduled or in-progress collections to route. 
            When you have active collections, you can use this tool to plan your pickup routes.
          </p>
        </div>
      )}
    </div>
  );
}