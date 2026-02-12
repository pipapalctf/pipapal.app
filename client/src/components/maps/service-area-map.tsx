import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, AlertTriangle, Loader2 } from 'lucide-react';
import { Collection } from '@shared/schema';
import 'leaflet/dist/leaflet.css';

const defaultCenter: [number, number] = [-1.2921, 36.8219];

interface ServiceAreaMapProps {
  collections: Collection[];
  collectorAddress?: string;
}

function createIcon(color: string) {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="width:14px;height:14px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.4)"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}

const statusIcons: Record<string, L.DivIcon> = {
  completed: createIcon('#22c55e'),
  in_progress: createIcon('#eab308'),
  scheduled: createIcon('#3b82f6'),
  default: createIcon('#ef4444'),
};

const collectorBaseIcon = createIcon('#a855f7');

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

export function ServiceAreaMap({ collections, collectorAddress }: ServiceAreaMapProps) {
  const [center, setCenter] = useState<[number, number]>(defaultCenter);
  const [serviceArea, setServiceArea] = useState<{ lat: number; lng: number; radius: number } | null>(null);

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
        lng: (collection.location as any).lng as number,
      },
      status: collection.status,
      address: collection.address,
    }));

  useEffect(() => {
    if (collectionMarkers.length > 0) {
      const totalLat = collectionMarkers.reduce((sum, m) => sum + m.position.lat, 0);
      const totalLng = collectionMarkers.reduce((sum, m) => sum + m.position.lng, 0);
      const centerLat = totalLat / collectionMarkers.length;
      const centerLng = totalLng / collectionMarkers.length;

      let maxDistance = 0;
      collectionMarkers.forEach(marker => {
        const distance = getDistanceFromLatLonInKm(centerLat, centerLng, marker.position.lat, marker.position.lng);
        if (distance > maxDistance) maxDistance = distance;
      });

      setServiceArea({ lat: centerLat, lng: centerLng, radius: maxDistance * 1000 * 1.2 });
      setCenter([centerLat, centerLng]);
    }
  }, [collections]);

  function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
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

  const getFallbackLocations = () => [
    { id: 'downtown', position: { lat: -1.2921, lng: 36.8219 }, status: 'completed', address: 'Downtown Nairobi' },
    { id: 'karen', position: { lat: -1.3218, lng: 36.7116 }, status: 'scheduled', address: 'Karen' },
    { id: 'westlands', position: { lat: -1.2683, lng: 36.8106 }, status: 'in_progress', address: 'Westlands' },
    { id: 'kilimani', position: { lat: -1.2857, lng: 36.7886 }, status: 'scheduled', address: 'Kilimani' },
    { id: 'parklands', position: { lat: -1.2639, lng: 36.8273 }, status: 'completed', address: 'Parklands' },
  ];

  const markersToDisplay = collectionMarkers.length > 0 ? collectionMarkers : getFallbackLocations();

  return (
    <div className="relative">
      <MapContainer
        center={center}
        zoom={12}
        style={{ width: '100%', height: '400px' }}
        className="rounded-lg z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapUpdater center={center} />

        {serviceArea && (
          <Circle
            center={[serviceArea.lat, serviceArea.lng]}
            radius={serviceArea.radius}
            pathOptions={{
              fillColor: '#0088FE',
              fillOpacity: 0.1,
              color: '#0088FE',
              opacity: 0.8,
              weight: 2,
            }}
          />
        )}

        {markersToDisplay.map(marker => (
          <Marker
            key={marker.id}
            position={[marker.position.lat, marker.position.lng]}
            icon={statusIcons[marker.status] || statusIcons.default}
          >
            <Popup>{marker.address}</Popup>
          </Marker>
        ))}

        {collectorAddress && (
          <Marker position={center} icon={collectorBaseIcon}>
            <Popup>Collector Home Base</Popup>
          </Marker>
        )}
      </MapContainer>

      <div className="absolute bottom-3 left-3 bg-background/90 p-2 rounded-md shadow-md border border-border text-xs z-[1000]">
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
