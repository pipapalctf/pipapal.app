import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { RecyclingCenter } from "@shared/schema";
import { UserRole } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";

// UI components
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Filter, List, MapIcon, MapPin, Mail, Map } from "lucide-react";

// Google Maps components
import { GoogleMap, Marker, LoadScript } from "@react-google-maps/api";

export default function RecyclingCentersPageNew() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterWasteType, setFilterWasteType] = useState<string | null>(null);
  const [filterCity, setFilterCity] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Fetch recycling centers - no authentication required
  const {
    data: recyclingCenters = [],
    isLoading,
    error,
    refetch,
  } = useQuery<RecyclingCenter[]>({
    queryKey: ["/api/recycling-centers"],
  });
  
  // Reference to the Tabs component for programmatically changing tabs
  const tabsRef = React.useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Log data for debugging
    console.log("Recycling centers data:", recyclingCenters);
  }, [recyclingCenters]);

  // Get current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Error getting location:", error);
          // Default to Nairobi coordinates if location not available
          setUserLocation({ lat: -1.2921, lng: 36.8219 });
        }
      );
    }
  }, []);

  // Get unique cities for filtering
  const citiesMap: Record<string, boolean> = {};
  recyclingCenters.forEach(center => {
    if (center.city) citiesMap[center.city] = true;
  });
  const cities = Object.keys(citiesMap).sort();
  
  // Get unique waste types for filtering
  const wasteTypesMap: Record<string, boolean> = {};
  recyclingCenters.forEach(center => {
    if (center.wasteTypes) {
      center.wasteTypes.forEach(type => {
        wasteTypesMap[type] = true;
      });
    }
  });
  const availableWasteTypes = Object.keys(wasteTypesMap).sort();

  // Filter centers based on search and filters
  const getFilteredCenters = () => {
    if (!recyclingCenters || recyclingCenters.length === 0) {
      return [];
    }
    
    // Always show all centers if there are no filters
    if (!searchTerm && !filterWasteType && !filterCity) {
      return recyclingCenters;
    }
    
    return recyclingCenters.filter((center) => {
      // Search by name or location
      const matchesSearch =
        !searchTerm ||
        center.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        center.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (center.address && center.address.toLowerCase().includes(searchTerm.toLowerCase()));

      // Filter by waste type
      const matchesWasteType =
        !filterWasteType ||
        (center.wasteTypes && center.wasteTypes.some(type => 
          type.toLowerCase() === filterWasteType.toLowerCase()
        ));

      // Filter by city
      const matchesCity = !filterCity || center.city === filterCity;

      return matchesSearch && matchesWasteType && matchesCity;
    });
  };

  const filteredCenters = getFilteredCenters();

  const clearFilters = () => {
    setSearchTerm("");
    setFilterWasteType(null);
    setFilterCity(null);
  };
  
  // State for map zoom level
  const [mapZoom, setMapZoom] = useState(10);

  // Handle View on Map button click
  const handleViewOnMap = (center: RecyclingCenter) => {
    console.log("Viewing center on map:", center.name);
    
    // Update the view mode to "map"
    setViewMode("map");
    
    // Center the map on the recycling center's location if coordinates exist
    if (center.latitude && center.longitude) {
      setUserLocation({
        lat: center.latitude,
        lng: center.longitude
      });
      // Set a closer zoom level for better visibility
      setMapZoom(14);
    }
  };

  return (
    <div className="container mx-auto px-4 pb-20">
      <h1 className="text-3xl font-bold mb-6 mt-6">Recycling Centers</h1>
      <p className="text-gray-600 mb-8">
        Find recycling centers near you that accept specific types of waste.
      </p>
      
      {isLoading ? (
        <div className="py-8 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 text-red-700 rounded-md mb-8">
          An error occurred: {String(error)}. Please try again later.
        </div>
      ) : recyclingCenters.length === 0 ? (
        <div className="p-4 bg-yellow-50 text-yellow-700 rounded-md mb-8">
          No recycling centers found. Please check back later.
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500 mb-4">
            Found {recyclingCenters.length} recycling centers{' '}
            {filterCity || filterWasteType || searchTerm ? `(showing ${filteredCenters.length} results)` : ''}
          </p>

          {/* View mode toggle */}
          <Tabs
            ref={tabsRef}
            value={viewMode}
            defaultValue="list"
            className="w-full mb-6"
            onValueChange={(value) => setViewMode(value as "list" | "map")}
          >
            <div className="flex justify-between items-center mb-4">
              <TabsList>
                <TabsTrigger value="list" className="flex items-center gap-1">
                  <List className="h-4 w-4" />
                  List View
                </TabsTrigger>
                <TabsTrigger value="map" className="flex items-center gap-1">
                  <MapIcon className="h-4 w-4" />
                  Map View
                </TabsTrigger>
              </TabsList>

              {/* User is admin - can create new recycling center */}
              {user?.role === UserRole.ADMIN && (
                <Button size="sm" className="ml-auto">
                  Add Recycling Center
                </Button>
              )}
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1">
                <Input
                  placeholder="Search by name or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="w-full md:w-48">
                <Select
                  value={filterWasteType || "all"}
                  onValueChange={(value) => setFilterWasteType(value === "all" ? null : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Waste Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {availableWasteTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full md:w-48">
                <Select
                  value={filterCity || "all"}
                  onValueChange={(value) => setFilterCity(value === "all" ? null : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="City" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Cities</SelectItem>
                    {cities.map((city) => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline" onClick={clearFilters} className="w-full md:w-auto">
                <Filter className="mr-2 h-4 w-4" />
                Clear Filters
              </Button>
            </div>

            {/* List view */}
            <TabsContent value="list">
              {filteredCenters.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-md">
                  <p className="text-gray-500">
                    No recycling centers found matching your criteria.
                  </p>
                  <Button variant="link" onClick={clearFilters} className="mt-2">
                    Clear all filters
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredCenters.map((center) => (
                    <Card key={center.id} className="h-full">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">{center.name}</CardTitle>
                        <CardDescription>{center.facilityType}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-start">
                          <MapPin className="h-4 w-4 mr-2 mt-1 text-gray-500" />
                          <div>
                            <p className="text-sm">{center.address}</p>
                            <p className="text-sm text-gray-500">
                              {center.city}, {center.county}
                            </p>
                          </div>
                        </div>

                        {center.poBox && (
                          <div className="flex items-center">
                            <Mail className="h-4 w-4 mr-2 text-gray-500" />
                            <p className="text-sm">{center.poBox}</p>
                          </div>
                        )}

                        {center.operator && (
                          <div>
                            <p className="text-sm text-gray-500">
                              Operated by: {center.operator}
                            </p>
                          </div>
                        )}

                        {center.wasteTypes && center.wasteTypes.length > 0 && (
                          <div>
                            <p className="text-sm font-medium mb-1">Accepted waste types:</p>
                            <div className="flex flex-wrap gap-1">
                              {center.wasteTypes.map((type) => (
                                <Badge key={type} variant="outline" className="capitalize">
                                  {type}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                      <CardFooter>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full"
                          onClick={() => handleViewOnMap(center)}
                        >
                          <Map className="h-4 w-4 mr-2" />
                          View on Map
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Map view */}
            <TabsContent value="map">
              <div className="h-[500px] bg-gray-100 rounded-lg overflow-hidden transition-all duration-300">
                {!import.meta.env.VITE_GOOGLE_MAPS_API_KEY ? (
                  <div className="flex h-full items-center justify-center">
                    <div className="text-center p-4">
                      <MapIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">
                        Map view showing {filteredCenters.length} recycling centers
                      </p>
                      <p className="text-sm text-gray-400">
                        Google Maps API key is required for interactive map view
                      </p>
                    </div>
                  </div>
                ) : (
                  <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
                    <GoogleMap
                      mapContainerStyle={{ width: '100%', height: '100%' }}
                      center={userLocation || { lat: -1.2921, lng: 36.8219 }}
                      zoom={mapZoom}
                      options={{
                        streetViewControl: false,
                        mapTypeControl: true,
                        fullscreenControl: true
                      }}
                    >
                      {/* User location marker with custom icon */}
                      {userLocation && (
                        <Marker 
                          position={userLocation} 
                          title="Your location"
                          // Default is blue marker
                        />
                      )}
                      
                      {filteredCenters.map((center) => {
                        if (center.latitude && center.longitude) {
                          const isSelected = 
                            userLocation && 
                            userLocation.lat === center.latitude && 
                            userLocation.lng === center.longitude;
                          
                          return (
                            <Marker
                              key={center.id}
                              position={{ lat: center.latitude, lng: center.longitude }}
                              title={center.name}
                              // Add animation to the selected marker
                              animation={isSelected ? 1 : undefined}
                              // 1 is BOUNCE in Google Maps API
                            />
                          );
                        }
                        return null;
                      })}
                    </GoogleMap>
                  </LoadScript>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}