import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { isToday, isTomorrow } from 'date-fns';
import { format } from 'date-fns';
import { MapPin, Calendar, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatNumber } from '@/lib/utils';
import { wasteTypeConfig } from '@/lib/types';

// ── Kenya geo lookup ──────────────────────────────────────────────────────────
const GEO: Record<string, [number, number]> = {
  'uhuru highway':      [-1.294, 36.820],
  'uhuru':              [-1.294, 36.820],
  'westlands':          [-1.268, 36.804],
  'kilimani':           [-1.298, 36.784],
  'karen':              [-1.321, 36.712],
  'gigiri':             [-1.239, 36.799],
  'lavington':          [-1.280, 36.769],
  'kileleshwa':         [-1.281, 36.787],
  'eastleigh':          [-1.276, 36.844],
  'south b':            [-1.305, 36.826],
  'south c':            [-1.317, 36.820],
  'runda':              [-1.213, 36.820],
  'muthaiga':           [-1.249, 36.836],
  'parklands':          [-1.264, 36.819],
  'hurlingham':         [-1.293, 36.796],
  'ngong':              [-1.367, 36.660],
  'rongai':             [-1.396, 36.747],
  'thika':              [-1.033, 37.069],
  'kiambu':             [-1.171, 36.835],
  'nakuru':             [-0.303, 36.080],
  'mombasa':            [-4.043, 39.668],
  'kisumu':             [-0.102, 34.762],
  'eldoret':            [ 0.520, 35.270],
  'nyahururu':          [ 0.017, 36.366],
  'laikipia':           [ 0.200, 37.000],
  'nyandarua':          [-0.500, 36.500],
  'naivasha':           [-0.717, 36.431],
  'machakos':           [-1.520, 37.264],
  'ruiru':              [-1.145, 36.960],
  'juja':               [-1.103, 37.014],
  'kitengela':          [-1.474, 36.960],
  'athi river':         [-1.455, 36.981],
  'embakasi':           [-1.321, 36.900],
  'kayole':             [-1.282, 36.895],
  'donholm':            [-1.293, 36.879],
  'buruburu':           [-1.284, 36.866],
  'umoja':              [-1.283, 36.876],
  'kasarani':           [-1.220, 36.893],
  'ruaraka':            [-1.239, 36.870],
  'pangani':            [-1.267, 36.840],
  'nairobi':            [-1.286, 36.817],
  'cbd':                [-1.283, 36.821],
};

export function getPickupCoords(collection: any): [number, number] {
  const text = `${collection.address || ''} ${collection.city || ''}`.toLowerCase();
  for (const [key, coords] of Object.entries(GEO)) {
    if (text.includes(key)) return coords;
  }
  // Deterministic scatter around Nairobi when no match
  const seed = (collection.id || 0);
  const angle = seed * 2.399;
  const radius = 0.04 + (seed % 7) * 0.008;
  return [-1.286 + Math.sin(angle) * radius, 36.817 + Math.cos(angle) * radius];
}

function makeMarkerIcon(color: string, size = 16) {
  return L.divIcon({
    html: `<div style="
      width:${size}px;height:${size}px;border-radius:50%;
      background:${color};border:2.5px solid white;
      box-shadow:0 1px 6px rgba(0,0,0,0.35);
    "></div>`,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2 - 4],
  });
}

function MapRecenter({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 0.8 });
  }, [center[0], center[1], zoom]);
  return null;
}

export function getMatchedCenter(query: string): [number, number] | null {
  if (!query) return null;
  const q = query.toLowerCase();
  for (const [key, coords] of Object.entries(GEO)) {
    if (key.includes(q) || q.includes(key)) return coords;
  }
  return null;
}

interface PickupMapProps {
  collections: any[];
  searchQuery: string;
  onAccept: (collection: any) => void;
  calculateEarnings: (wasteType: string, amount: number) => number;
}

export function PickupMap({ collections, searchQuery, onAccept, calculateEarnings }: PickupMapProps) {
  const center = useMemo((): [number, number] => {
    const matched = getMatchedCenter(searchQuery);
    if (matched) return matched;
    if (collections.length > 0) return getPickupCoords(collections[0]);
    return [-1.286, 36.817];
  }, [searchQuery, collections[0]?.id]);

  const zoom = searchQuery && getMatchedCenter(searchQuery) ? 13 : 11;

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height: '100%', width: '100%', borderRadius: 0, minHeight: 280 }}
      scrollWheelZoom={false}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
      />
      <MapRecenter center={center} zoom={zoom} />
      {collections.map((collection) => {
        const coords = getPickupCoords(collection);
        const dueToday = isToday(new Date(collection.scheduledDate));
        const color = dueToday ? '#ef4444' : '#22c55e';
        const earnings = calculateEarnings(collection.wasteType, collection.wasteAmount || 10);
        const wtConfig = wasteTypeConfig[collection.wasteType as keyof typeof wasteTypeConfig];

        return (
          <Marker
            key={collection.id}
            position={coords}
            icon={makeMarkerIcon(color, dueToday ? 18 : 15)}
          >
            <Popup minWidth={200}>
              <div className="text-sm space-y-1.5 py-0.5">
                <div className="flex items-center gap-1.5">
                  <span
                    className="text-xs font-semibold px-2 py-0.5 rounded-full capitalize"
                    style={{ background: (wtConfig?.color || '#22c55e') + '20', color: wtConfig?.color || '#22c55e' }}
                  >
                    {collection.wasteType}
                  </span>
                  {collection.wasteAmount && (
                    <span className="text-xs text-gray-500">{collection.wasteAmount} kg</span>
                  )}
                  {dueToday && (
                    <span className="text-xs text-red-500 font-medium">Due today</span>
                  )}
                </div>
                <div className="text-xs text-gray-500 flex items-center gap-1">
                  <MapPin size={10} />
                  {collection.address?.split(',')[0] || collection.city || '—'}
                </div>
                <div className="text-xs text-gray-500 flex items-center gap-1">
                  <Calendar size={10} />
                  {format(new Date(collection.scheduledDate), 'MMM d, yyyy')}
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="font-bold text-green-700 text-sm">KSh {formatNumber(earnings)}</span>
                  <button
                    onClick={() => onAccept(collection)}
                    className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md font-medium"
                  >
                    Accept
                  </button>
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
