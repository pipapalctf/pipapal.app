import { useState, useCallback, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
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
import 'leaflet/dist/leaflet.css';

const defaultCenter: [number, number] = [-1.2921, 36.8219];

function createIcon(color: string, size = 14) {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;font-size:9px;color:white;font-weight:bold"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function createNumberedIcon(color: string, number: number) {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="width:24px;height:24px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;font-size:11px;color:white;font-weight:bold">${number}</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

const statusColors: Record<string, string> = {
  scheduled: '#3b82f6',
  in_progress: '#eab308',
  completed: '#22c55e',
  default: '#ef4444',
};

const collectorBaseIcon = createIcon('#a855f7', 20);

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

interface RouteOptimizationMapProps {
  collections: Collection[];
  collectorAddress?: string;
}

export function RouteOptimizationMap({ collections, collectorAddress }: RouteOptimizationMapProps) {
  const [center] = useState<[number, number]>(defaultCenter);
  const [activeCollections, setActiveCollections] = useState<Collection[]>([]);
  const [routePoints, setRoutePoints] = useState<[number, number][]>([]);
  const [routeStats, setRouteStats] = useState({
    totalDistance: '',
    totalDuration: '',
    etaTime: '',
    fuelEstimate: '',
  });
  const [routeType, setRouteType] = useState<'optimal' | 'byWasteType'>('optimal');
  const [selectedWasteType, setSelectedWasteType] = useState<string>('all');
  const [availableWasteTypes, setAvailableWasteTypes] = useState<string[]>([]);
  const [hasRoute, setHasRoute] = useState(false);

  useEffect(() => {
    const filteredCollections = collections.filter(
      c => c.status === 'scheduled' || c.status === 'in_progress'
    );
    setActiveCollections(filteredCollections);
    const wasteTypes = Array.from(new Set(filteredCollections.map(c => c.wasteType))).filter(Boolean) as string[];
    setAvailableWasteTypes(wasteTypes);
  }, [collections]);

  const getFilteredCollections = () => {
    if (selectedWasteType === 'all') return activeCollections;
    return activeCollections.filter(c => c.wasteType === selectedWasteType);
  };

  const getCollectionPosition = (collection: Collection): [number, number] => {
    if (collection.location && typeof collection.location === 'object' && collection.location !== null) {
      const loc = collection.location as any;
      if (typeof loc.lat === 'number' && typeof loc.lng === 'number') {
        return [loc.lat, loc.lng];
      }
    }
    return [
      center[0] + (Math.random() - 0.5) * 0.05,
      center[1] + (Math.random() - 0.5) * 0.05,
    ];
  };

  function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  const calculateRoute = useCallback(() => {
    const filtered = getFilteredCollections();
    if (filtered.length === 0) return;

    const points: [number, number][] = [center];
    const collectionPoints = filtered.map(c => getCollectionPosition(c));

    if (routeType === 'optimal') {
      const remaining = [...collectionPoints];
      let current = center;
      while (remaining.length > 0) {
        let nearestIdx = 0;
        let nearestDist = Infinity;
        remaining.forEach((p, i) => {
          const d = getDistanceKm(current[0], current[1], p[0], p[1]);
          if (d < nearestDist) {
            nearestDist = d;
            nearestIdx = i;
          }
        });
        current = remaining.splice(nearestIdx, 1)[0];
        points.push(current);
      }
    } else {
      collectionPoints.forEach(p => points.push(p));
    }

    points.push(center);
    setRoutePoints(points);
    setHasRoute(true);

    let totalDistance = 0;
    for (let i = 0; i < points.length - 1; i++) {
      totalDistance += getDistanceKm(points[i][0], points[i][1], points[i + 1][0], points[i + 1][1]);
    }

    const avgSpeedKmh = 30;
    const durationMin = (totalDistance / avgSpeedKmh) * 60;
    const now = new Date();
    const eta = new Date(now.getTime() + durationMin * 60 * 1000);
    const fuelLiters = (totalDistance / 100) * 10;

    setRouteStats({
      totalDistance: `${totalDistance.toFixed(1)} km`,
      totalDuration: `${Math.round(durationMin)} min`,
      etaTime: eta.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      fuelEstimate: `${fuelLiters.toFixed(1)} L`,
    });
  }, [activeCollections, routeType, selectedWasteType, center]);

  const handleWasteTypeChange = (value: string) => {
    setSelectedWasteType(value);
    setRoutePoints([]);
    setHasRoute(false);
  };

  const handleRouteTypeChange = (value: 'optimal' | 'byWasteType') => {
    setRouteType(value);
    setRoutePoints([]);
    setHasRoute(false);
  };

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
              <Select value={selectedWasteType} onValueChange={handleWasteTypeChange}>
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

            <Button onClick={calculateRoute} disabled={activeCollections.length === 0} className="w-full">
              <Navigation className="mr-2 h-4 w-4" />
              Calculate Route
            </Button>
          </div>
        </Card>

        <Card className="p-4 flex-1">
          <h3 className="font-medium mb-3">Route Statistics</h3>
          {hasRoute ? (
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
        <MapContainer
          center={center}
          zoom={12}
          style={{ width: '100%', height: '500px' }}
          className="z-0"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <Marker position={center} icon={collectorBaseIcon}>
            <Popup>Collector Base</Popup>
          </Marker>

          {getFilteredCollections().map((collection, index) => {
            const pos = getCollectionPosition(collection);
            const color = statusColors[collection.status] || statusColors.default;
            return (
              <Marker
                key={collection.id}
                position={pos}
                icon={createNumberedIcon(color, index + 1)}
              >
                <Popup>
                  <div className="p-1 max-w-xs">
                    <h4 className="font-medium capitalize">{collection.wasteType} Collection</h4>
                    <p className="text-sm">{collection.address}</p>
                    {collection.wasteAmount && (
                      <p className="text-sm">Amount: {formatNumber(collection.wasteAmount)} kg</p>
                    )}
                    <p className="text-sm capitalize">Status: {collection.status}</p>
                    {collection.notes && <p className="text-sm mt-1">Notes: {collection.notes}</p>}
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {hasRoute && routePoints.length > 1 && (
            <Polyline
              positions={routePoints}
              pathOptions={{ color: '#4CAF50', weight: 5, opacity: 0.7 }}
            />
          )}
        </MapContainer>

        <div className="absolute bottom-3 left-3 bg-background/90 p-2 rounded-md shadow-md border border-border text-xs z-[1000]">
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
          {hasRoute && (
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
