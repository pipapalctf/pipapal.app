import { useState, useCallback, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import {
  Loader2,
  AlertTriangle,
  MapPin,
  Navigation,
  Clock,
  Fuel,
  Truck,
  ExternalLink,
  CheckCircle2,
  Route,
  Scale,
  Calendar
} from 'lucide-react';
import { Collection, CollectionStatus } from '@shared/schema';
import { formatNumber } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format } from 'date-fns';
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
    html: `<div style="width:28px;height:28px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-size:12px;color:white;font-weight:bold">${number}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

const collectorBaseIcon = createIcon('#a855f7', 22);

function MapUpdater({ center, zoom }: { center: [number, number]; zoom?: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom || map.getZoom());
  }, [center, zoom, map]);
  return null;
}

interface RouteOptimizationMapProps {
  collections: Collection[];
  collectorAddress?: string;
}

export function RouteOptimizationMap({ collections, collectorAddress }: RouteOptimizationMapProps) {
  const [center] = useState<[number, number]>(defaultCenter);
  const [routePoints, setRoutePoints] = useState<[number, number][]>([]);
  const [orderedCollections, setOrderedCollections] = useState<Collection[]>([]);
  const [routeStats, setRouteStats] = useState({
    totalDistance: '',
    totalDuration: '',
    etaTime: '',
    fuelEstimate: '',
    stops: 0,
  });
  const [routeType, setRouteType] = useState<'optimal' | 'byWasteType'>('optimal');
  const [selectedWasteType, setSelectedWasteType] = useState<string>('all');
  const [hasRoute, setHasRoute] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const claimedCollections = useMemo(() => {
    return collections.filter(
      c => c.collectorId && (c.status === CollectionStatus.CONFIRMED || c.status === CollectionStatus.IN_PROGRESS)
    );
  }, [collections]);

  const availableWasteTypes = useMemo(() => {
    return Array.from(new Set(claimedCollections.map(c => c.wasteType))).filter(Boolean) as string[];
  }, [claimedCollections]);

  const filteredCollections = useMemo(() => {
    let filtered = claimedCollections;
    if (selectedWasteType !== 'all') {
      filtered = filtered.filter(c => c.wasteType === selectedWasteType);
    }
    return filtered;
  }, [claimedCollections, selectedWasteType]);

  useEffect(() => {
    setSelectedIds(new Set(filteredCollections.map(c => c.id)));
  }, [filteredCollections]);

  const selectedCollections = useMemo(() => {
    return filteredCollections.filter(c => selectedIds.has(c.id));
  }, [filteredCollections, selectedIds]);

  const toggleSelection = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setHasRoute(false);
    setRoutePoints([]);
    setOrderedCollections([]);
  };

  const toggleAll = () => {
    if (selectedIds.size === filteredCollections.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredCollections.map(c => c.id)));
    }
    setHasRoute(false);
    setRoutePoints([]);
    setOrderedCollections([]);
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
    if (selectedCollections.length === 0) return;

    const points: [number, number][] = [center];
    const ordered: Collection[] = [];

    if (routeType === 'optimal') {
      const remaining = selectedCollections.map(c => ({ collection: c, pos: getCollectionPosition(c) }));
      let current = center;
      while (remaining.length > 0) {
        let nearestIdx = 0;
        let nearestDist = Infinity;
        remaining.forEach((item, i) => {
          const d = getDistanceKm(current[0], current[1], item.pos[0], item.pos[1]);
          if (d < nearestDist) {
            nearestDist = d;
            nearestIdx = i;
          }
        });
        const nearest = remaining.splice(nearestIdx, 1)[0];
        current = nearest.pos;
        points.push(current);
        ordered.push(nearest.collection);
      }
    } else {
      const byType: Record<string, typeof selectedCollections> = {};
      selectedCollections.forEach(c => {
        const t = c.wasteType || 'general';
        if (!byType[t]) byType[t] = [];
        byType[t].push(c);
      });
      Object.values(byType).forEach(group => {
        const remaining = group.map(c => ({ collection: c, pos: getCollectionPosition(c) }));
        let current = points[points.length - 1];
        while (remaining.length > 0) {
          let nearestIdx = 0;
          let nearestDist = Infinity;
          remaining.forEach((item, i) => {
            const d = getDistanceKm(current[0], current[1], item.pos[0], item.pos[1]);
            if (d < nearestDist) {
              nearestDist = d;
              nearestIdx = i;
            }
          });
          const nearest = remaining.splice(nearestIdx, 1)[0];
          current = nearest.pos;
          points.push(current);
          ordered.push(nearest.collection);
        }
      });
    }

    points.push(center);
    setRoutePoints(points);
    setOrderedCollections(ordered);
    setHasRoute(true);

    let totalDistance = 0;
    for (let i = 0; i < points.length - 1; i++) {
      totalDistance += getDistanceKm(points[i][0], points[i][1], points[i + 1][0], points[i + 1][1]);
    }

    const avgSpeedKmh = 30;
    const stopTimeMin = 10;
    const drivingMin = (totalDistance / avgSpeedKmh) * 60;
    const totalMin = drivingMin + (ordered.length * stopTimeMin);
    const now = new Date();
    const eta = new Date(now.getTime() + totalMin * 60 * 1000);
    const fuelLiters = (totalDistance / 100) * 10;

    setRouteStats({
      totalDistance: `${totalDistance.toFixed(1)} km`,
      totalDuration: `${Math.round(totalMin)} min`,
      etaTime: eta.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      fuelEstimate: `${fuelLiters.toFixed(1)} L`,
      stops: ordered.length,
    });
  }, [selectedCollections, routeType, center]);

  const openInGoogleMaps = () => {
    if (orderedCollections.length === 0) return;
    const waypoints = orderedCollections.map(c => {
      const pos = getCollectionPosition(c);
      return `${pos[0]},${pos[1]}`;
    });
    const origin = `${center[0]},${center[1]}`;
    const destination = origin;
    const waypointStr = waypoints.join('|');
    const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&waypoints=${encodeURIComponent(waypointStr)}&travelmode=driving`;
    window.open(url, '_blank');
  };

  const handleWasteTypeChange = (value: string) => {
    setSelectedWasteType(value);
    setRoutePoints([]);
    setOrderedCollections([]);
    setHasRoute(false);
  };

  const handleRouteTypeChange = (value: 'optimal' | 'byWasteType') => {
    setRouteType(value);
    setRoutePoints([]);
    setOrderedCollections([]);
    setHasRoute(false);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-4 lg:col-span-1">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Route className="h-4 w-4 text-primary" />
            Route Options
          </h3>
          <div className="space-y-4">
            <RadioGroup
              value={routeType}
              onValueChange={(value) => handleRouteTypeChange(value as 'optimal' | 'byWasteType')}
              className="flex flex-col space-y-1"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="optimal" id="optimal" />
                <Label htmlFor="optimal" className="text-sm">Shortest Path</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="byWasteType" id="byWasteType" />
                <Label htmlFor="byWasteType" className="text-sm">Group By Waste Type</Label>
              </div>
            </RadioGroup>

            <div className="space-y-2">
              <Label htmlFor="wasteType" className="text-sm">Filter by Waste Type</Label>
              <Select value={selectedWasteType} onValueChange={handleWasteTypeChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Waste Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {availableWasteTypes.map(type => (
                    <SelectItem key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button onClick={calculateRoute} disabled={selectedCollections.length === 0} className="w-full">
              <Navigation className="mr-2 h-4 w-4" />
              Calculate Route ({selectedCollections.length} stops)
            </Button>

            {hasRoute && (
              <Button variant="outline" onClick={openInGoogleMaps} className="w-full">
                <ExternalLink className="mr-2 h-4 w-4" />
                Open in Google Maps
              </Button>
            )}
          </div>

          {hasRoute && (
            <div className="mt-4 pt-4 border-t space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Route Stats</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary shrink-0" />
                  <div>
                    <div className="text-xs text-muted-foreground">Distance</div>
                    <div className="text-sm font-medium">{routeStats.totalDistance}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary shrink-0" />
                  <div>
                    <div className="text-xs text-muted-foreground">Duration</div>
                    <div className="text-sm font-medium">{routeStats.totalDuration}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-primary shrink-0" />
                  <div>
                    <div className="text-xs text-muted-foreground">Stops</div>
                    <div className="text-sm font-medium">{routeStats.stops}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Fuel className="h-4 w-4 text-primary shrink-0" />
                  <div>
                    <div className="text-xs text-muted-foreground">Fuel Est.</div>
                    <div className="text-sm font-medium">{routeStats.fuelEstimate}</div>
                  </div>
                </div>
              </div>
              <div className="text-xs text-muted-foreground text-center">
                ETA: {routeStats.etaTime} (incl. ~10 min/stop)
              </div>
            </div>
          )}
        </Card>

        <div className="lg:col-span-2">
          <div className="relative rounded-lg overflow-hidden border">
            <MapContainer
              center={center}
              zoom={12}
              style={{ width: '100%', height: '450px' }}
              className="z-0"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              <Marker position={center} icon={collectorBaseIcon}>
                <Popup>
                  <div className="font-medium">Your Location</div>
                  {collectorAddress && <div className="text-sm text-muted-foreground">{collectorAddress}</div>}
                </Popup>
              </Marker>

              {(hasRoute ? orderedCollections : selectedCollections).map((collection, index) => {
                const pos = getCollectionPosition(collection);
                const color = collection.status === CollectionStatus.IN_PROGRESS ? '#eab308' : '#3b82f6';
                return (
                  <Marker
                    key={collection.id}
                    position={pos}
                    icon={createNumberedIcon(color, index + 1)}
                  >
                    <Popup>
                      <div className="p-1 max-w-xs">
                        <div className="font-medium capitalize">
                          Stop {index + 1}: {collection.wasteType} Collection
                        </div>
                        <p className="text-sm mt-1">{collection.address}</p>
                        {collection.wasteAmount && (
                          <p className="text-sm">Amount: {formatNumber(collection.wasteAmount)} kg</p>
                        )}
                        <p className="text-sm capitalize">Status: {collection.status}</p>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}

              {hasRoute && routePoints.length > 1 && (
                <Polyline
                  positions={routePoints}
                  pathOptions={{ color: '#22c55e', weight: 4, opacity: 0.8, dashArray: '8 4' }}
                />
              )}
            </MapContainer>

            <div className="absolute bottom-3 left-3 bg-background/90 p-2 rounded-md shadow-md border border-border text-xs z-[1000]">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span>Confirmed</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <span>In Progress</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                  <span>Base</span>
                </div>
                {hasRoute && (
                  <div className="flex items-center gap-1">
                    <div className="w-6 h-0.5 bg-green-500"></div>
                    <span>Route</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {filteredCollections.length > 0 && (
        <Card className="overflow-hidden">
          <div className="p-4 bg-muted/30 border-b flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              {hasRoute ? 'Optimized Stop Order' : 'Select Collections to Route'}
            </h3>
            {!hasRoute && (
              <Button variant="ghost" size="sm" onClick={toggleAll}>
                {selectedIds.size === filteredCollections.length ? 'Deselect All' : 'Select All'}
              </Button>
            )}
          </div>
          <div className="divide-y">
            {(hasRoute ? orderedCollections : filteredCollections).map((collection, index) => (
              <div
                key={collection.id}
                className={`flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors ${
                  selectedIds.has(collection.id) ? '' : 'opacity-50'
                }`}
              >
                {!hasRoute && (
                  <Checkbox
                    checked={selectedIds.has(collection.id)}
                    onCheckedChange={() => toggleSelection(collection.id)}
                  />
                )}
                {hasRoute && (
                  <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary text-white text-sm font-bold shrink-0">
                    {index + 1}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium capitalize text-sm">{collection.wasteType}</span>
                    {collection.wasteAmount && (
                      <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200 text-xs">
                        {formatNumber(collection.wasteAmount)} kg
                      </Badge>
                    )}
                    <Badge variant="outline" className={
                      collection.status === CollectionStatus.IN_PROGRESS
                        ? 'bg-purple-50 text-purple-700 border-purple-200 text-xs'
                        : 'bg-blue-50 text-blue-700 border-blue-200 text-xs'
                    }>
                      {collection.status === CollectionStatus.IN_PROGRESS ? 'In Progress' : 'Confirmed'}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground truncate mt-0.5">
                    {collection.address}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground shrink-0 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(collection.scheduledDate), 'MMM d')}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {claimedCollections.length === 0 && (
        <div className="bg-amber-50 border-amber-200 border p-4 rounded-lg text-amber-800">
          <h4 className="font-medium flex items-center">
            <AlertTriangle className="h-4 w-4 mr-2 text-amber-600" />
            No Collections to Route
          </h4>
          <p className="text-sm mt-1">
            Claim collections from the Available Pickups tab first. Confirmed and in-progress collections will appear here for route planning.
          </p>
        </div>
      )}
    </div>
  );
}
