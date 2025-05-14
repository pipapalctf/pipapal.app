import React, { useState, useMemo } from "react";
import { useRecyclingCenters } from "@/hooks/use-recycling-centers";
import { RecyclingCenter, WasteType } from "@shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, MapPin, Phone, Mail, Search, Filter, List, Map } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { GoogleMap, LoadScript, Marker, InfoWindow } from "@react-google-maps/api";
import Navbar from "@/components/shared/navbar";
import Footer from "@/components/shared/footer";

const mapContainerStyle = {
  width: '100%',
  height: '600px'
};

// Default center is Nairobi, Kenya
const defaultCenter = {
  lat: -1.2921,
  lng: 36.8219
};

export default function RecyclingCentersPage() {
  const { recyclingCenters, isLoading, error } = useRecyclingCenters();
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedWasteType, setSelectedWasteType] = useState<string>("");
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("list");
  const [selectedCenter, setSelectedCenter] = useState<RecyclingCenter | null>(null);

  // Get unique cities from recycling centers
  const cities = useMemo(() => {
    if (!recyclingCenters) return [];
    const citySet = new Set<string>();
    recyclingCenters.forEach(center => {
      if (center.city) citySet.add(center.city);
    });
    return Array.from(citySet).sort();
  }, [recyclingCenters]);

  // Filter recycling centers based on search query, waste type, and city
  const filteredCenters = useMemo(() => {
    if (!recyclingCenters) return [];

    return recyclingCenters.filter(center => {
      // Search query filter
      const matchesQuery = !searchQuery || 
        center.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        center.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        center.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (center.operator && center.operator.toLowerCase().includes(searchQuery.toLowerCase()));

      // Waste type filter
      const matchesWasteType = !selectedWasteType || 
        (center.wasteTypes && center.wasteTypes.includes(selectedWasteType));

      // City filter
      const matchesCity = !selectedCity || center.city === selectedCity;

      return matchesQuery && matchesWasteType && matchesCity;
    });
  }, [recyclingCenters, searchQuery, selectedWasteType, selectedCity]);

  // Transform RecyclingCenter to Google Maps LatLng
  const getCenterLocation = (center: RecyclingCenter) => {
    if (center.latitude && center.longitude) {
      return { lat: center.latitude, lng: center.longitude };
    }
    return defaultCenter; // Fallback to default if no coordinates
  };

  // Create map bounds that encompass all centers
  const getBounds = () => {
    if (!filteredCenters || filteredCenters.length === 0) return null;
    
    const bounds = { north: -90, south: 90, east: -180, west: 180 };
    
    filteredCenters.forEach(center => {
      if (center.latitude && center.longitude) {
        bounds.north = Math.max(bounds.north, center.latitude);
        bounds.south = Math.min(bounds.south, center.latitude);
        bounds.east = Math.max(bounds.east, center.longitude);
        bounds.west = Math.min(bounds.west, center.longitude);
      }
    });
    
    return bounds;
  };

  // Get Google Maps API key from environment
  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Recycling Centers</h1>
          <p className="text-muted-foreground">
            Find recycling centers near you to properly dispose of waste materials
          </p>
        </div>

        {/* Search and Filter Bar */}
        <div className="mb-6 flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search recycling centers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-2">
            <Select value={selectedWasteType} onValueChange={setSelectedWasteType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Waste Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Waste Types</SelectItem>
                <SelectItem value={WasteType.PLASTIC}>Plastic</SelectItem>
                <SelectItem value={WasteType.PAPER}>Paper</SelectItem>
                <SelectItem value={WasteType.GLASS}>Glass</SelectItem>
                <SelectItem value={WasteType.METAL}>Metal</SelectItem>
                <SelectItem value={WasteType.ELECTRONIC}>Electronic</SelectItem>
                <SelectItem value={WasteType.ORGANIC}>Organic</SelectItem>
                <SelectItem value={WasteType.HAZARDOUS}>Hazardous</SelectItem>
                <SelectItem value={WasteType.CARDBOARD}>Cardboard</SelectItem>
                <SelectItem value={WasteType.GENERAL}>General</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={selectedCity} onValueChange={setSelectedCity}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="City" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Cities</SelectItem>
                {cities.map(city => (
                  <SelectItem key={city} value={city}>{city}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex">
            <Button
              variant={activeTab === "list" ? "default" : "outline"}
              size="icon"
              onClick={() => setActiveTab("list")}
              className="rounded-r-none"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={activeTab === "map" ? "default" : "outline"}
              size="icon"
              onClick={() => setActiveTab("map")}
              className="rounded-l-none"
            >
              <Map className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Loading recycling centers...</span>
          </div>
        ) : error ? (
          <div className="bg-destructive/10 p-4 rounded-md text-destructive">
            Error loading recycling centers. Please try again.
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsContent value="list" className="space-y-4">
              {filteredCenters.length === 0 ? (
                <div className="text-center p-8 bg-muted rounded-md">
                  <p className="text-lg font-medium">No recycling centers found</p>
                  <p className="text-muted-foreground">Try adjusting your search criteria</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredCenters.map((center) => (
                    <Card key={center.id} className="h-full flex flex-col">
                      <CardHeader>
                        <CardTitle className="text-lg">{center.name}</CardTitle>
                        <CardDescription className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1" /> 
                          {center.address}, {center.city}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="flex-grow">
                        {center.operator && (
                          <p className="text-sm mb-2"><span className="font-medium">Operator:</span> {center.operator}</p>
                        )}
                        {center.facilityType && (
                          <p className="text-sm mb-2"><span className="font-medium">Facility Type:</span> {center.facilityType}</p>
                        )}
                        <div className="mt-3">
                          <p className="text-sm font-medium mb-1">Accepted waste types:</p>
                          <div className="flex flex-wrap gap-2">
                            {center.wasteTypes && center.wasteTypes.map((type) => (
                              <Badge key={type} variant="outline" className="bg-primary/10">
                                {type}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="border-t pt-4">
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={() => {
                            setSelectedCenter(center);
                            setActiveTab("map");
                          }}
                        >
                          <MapPin className="h-4 w-4 mr-2" /> View on Map
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="map" className="h-[600px] bg-muted rounded-md overflow-hidden">
              {googleMapsApiKey ? (
                <LoadScript googleMapsApiKey={googleMapsApiKey}>
                  <GoogleMap
                    mapContainerStyle={mapContainerStyle}
                    center={selectedCenter ? getCenterLocation(selectedCenter) : defaultCenter}
                    zoom={selectedCenter ? 15 : 10}
                  >
                    {filteredCenters.map((center) => (
                      <Marker
                        key={center.id}
                        position={getCenterLocation(center)}
                        onClick={() => setSelectedCenter(center)}
                      />
                    ))}
                    
                    {selectedCenter && (
                      <InfoWindow
                        position={getCenterLocation(selectedCenter)}
                        onCloseClick={() => setSelectedCenter(null)}
                      >
                        <div className="p-2 max-w-[300px]">
                          <h3 className="font-bold text-sm">{selectedCenter.name}</h3>
                          <p className="text-xs mt-1">{selectedCenter.address}, {selectedCenter.city}</p>
                          {selectedCenter.wasteTypes && selectedCenter.wasteTypes.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs font-medium">Accepted waste:</p>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {selectedCenter.wasteTypes.map(type => (
                                  <span key={type} className="text-xs bg-blue-100 text-blue-800 px-1 rounded">
                                    {type}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </InfoWindow>
                    )}
                  </GoogleMap>
                </LoadScript>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p>Google Maps API key not configured. Please add VITE_GOOGLE_MAPS_API_KEY to your environment.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </main>
      
      <Footer />
    </div>
  );
}