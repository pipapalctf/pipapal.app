import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

function createIcon(color: string) {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="width:12px;height:12px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.4)"></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  });
}

const collectionIcon = createIcon('#22c55e');

export default function CollectionMap() {
  const demoCollectionPoints = [
    { lat: -1.2921, lng: 36.8219, title: "Downtown Collection Point" },
    { lat: -1.2683, lng: 36.8106, title: "Westlands Recycling Center" },
    { lat: -1.3218, lng: 36.7116, title: "Upcoming Pickup Location" },
  ];

  return (
    <Card>
      <CardHeader className="border-b border-gray-100">
        <CardTitle>Collection Map</CardTitle>
        <CardDescription>Nearby collection points and scheduled pickups</CardDescription>
      </CardHeader>
      <CardContent className="p-0 h-80 relative">
        <MapContainer
          center={[demoCollectionPoints[0].lat, demoCollectionPoints[0].lng]}
          zoom={13}
          style={{ width: '100%', height: '100%' }}
          className="z-0"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {demoCollectionPoints.map((point, index) => (
            <Marker
              key={index}
              position={[point.lat, point.lng]}
              icon={collectionIcon}
            >
              <Popup>{point.title}</Popup>
            </Marker>
          ))}
        </MapContainer>
      </CardContent>
    </Card>
  );
}
