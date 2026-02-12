import { useState, useEffect } from "react";
import { useRecyclingCenters } from "@/hooks/use-recycling-centers";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Map,
  MapPin,
  Phone,
  Mail,
  Loader2,
  Filter,
  List,
  MapIcon,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { WasteType } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { UserRole } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const markerIcon = L.divIcon({
  className: 'custom-marker',
  html: `<div style="width:12px;height:12px;border-radius:50%;background:#22c55e;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.4)"></div>`,
  iconSize: [12, 12],
  iconAnchor: [6, 6],
});

const userMarkerIcon = L.divIcon({
  className: 'custom-marker',
  html: `<div style="width:14px;height:14px;border-radius:50%;background:#3b82f6;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.4)"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

export default function RecyclingCentersPage() {
  const { user } = useAuth();
  const { recyclingCenters, isLoading, getRecyclingCentersNearby } = useRecyclingCenters();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterWasteType, setFilterWasteType] = useState<string | null>(null);
  const [filterCity, setFilterCity] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [nearbyCenters, setNearbyCenters] = useState(recyclingCenters);

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

  // Filter centers based on user's location
  useEffect(() => {
    if (recyclingCenters.length > 0) {
      console.log("Recycling centers from API:", recyclingCenters);
      if (userLocation) {
        const centersByLocation = getRecyclingCentersNearby(
          userLocation.lat,
          userLocation.lng,
          50 // 50km radius
        );
        console.log("Nearby centers:", centersByLocation);
        setNearbyCenters(centersByLocation.length > 0 ? centersByLocation : recyclingCenters);
      } else {
        setNearbyCenters(recyclingCenters);
      }
    } else {
      setNearbyCenters([]);
    }
  }, [userLocation, recyclingCenters, getRecyclingCentersNearby]);

  // Get unique cities for filtering
  const citiesMap: Record<string, boolean> = {};
  recyclingCenters.forEach(center => {
    if (center.city) citiesMap[center.city] = true;
  });
  const cities = Object.keys(citiesMap);

  // Filter centers based on search and filters
  const filteredCenters = nearbyCenters.filter((center) => {
    // Search by name or location
    const matchesSearch =
      !searchTerm ||
      center.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      center.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (center.address && center.address.toLowerCase().includes(searchTerm.toLowerCase()));

    // Filter by waste type
    const matchesWasteType =
      !filterWasteType ||
      (center.wasteTypes && center.wasteTypes.includes(filterWasteType));

    // Filter by city
    const matchesCity = !filterCity || center.city === filterCity;

    return matchesSearch && matchesWasteType && matchesCity;
  });

  const clearFilters = () => {
    setSearchTerm("");
    setFilterWasteType(null);
    setFilterCity(null);
  };

  // Debug log for data
  useEffect(() => {
    console.log("RecyclingCenters:", recyclingCenters);
    console.log("NearbyCenters:", nearbyCenters);
    console.log("FilteredCenters:", filteredCenters);
  }, [recyclingCenters, nearbyCenters, filteredCenters]);

  return (
    <div className="container mx-auto px-4 pb-20">
      <h1 className="text-3xl font-bold mb-6 mt-6">Recycling Centers</h1>
      <p className="text-gray-600 mb-8">
        Find recycling centers near you that accept specific types of waste.
      </p>
      <p className="text-sm text-gray-500 mb-4">
        Found {recyclingCenters?.length || 0} centers, {nearbyCenters?.length || 0} nearby, {filteredCenters?.length || 0} filtered.
      </p>
      
      {/* Debug data display */}
      {isLoading ? (
        <div className="text-sm p-2 mb-4 bg-gray-100 rounded">Loading recycling centers...</div>
      ) : recyclingCenters?.length === 0 ? (
        <div className="text-sm p-2 mb-4 bg-yellow-100 rounded">No recycling centers found in the database.</div>
      ) : (
        <div className="text-sm p-2 mb-4 bg-green-100 rounded">
          First center: {recyclingCenters[0]?.name} in {recyclingCenters[0]?.city}
        </div>
      )}

      {/* View mode toggle */}
      <Tabs
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
                {Object.values(WasteType).map((type) => (
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

        {/* Loading state */}
        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {/* List view */}
        <TabsContent value="list">
          {!isLoading && filteredCenters.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">
                No recycling centers found matching your criteria.
              </p>
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
                      onClick={() => {
                        setViewMode("map");
                        // Center map on this recycling center if it has coordinates
                        if (center.latitude && center.longitude) {
                          setUserLocation({
                            lat: center.latitude,
                            lng: center.longitude
                          });
                        }
                      }}
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
          <div className="h-[500px] bg-gray-100 rounded-lg overflow-hidden">
            <MapContainer
              center={[userLocation?.lat ?? -1.2921, userLocation?.lng ?? 36.8219]}
              zoom={10}
              style={{ width: '100%', height: '100%' }}
              className="z-0"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {userLocation && (
                <Marker position={[userLocation.lat, userLocation.lng]} icon={userMarkerIcon}>
                  <Popup>Your location</Popup>
                </Marker>
              )}
              {filteredCenters.map(center => (
                center.latitude && center.longitude ? (
                  <Marker
                    key={center.id}
                    position={[center.latitude, center.longitude]}
                    icon={markerIcon}
                  >
                    <Popup>{center.name}</Popup>
                  </Marker>
                ) : null
              ))}
            </MapContainer>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}