'use client';

import { MapContainer, TileLayer, useMapEvents, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useRef, useState } from 'react';

export function Map({ 
  onMapClick, 
  initialCenter 
}: { 
  onMapClick?: (lat: number, lng: number) => void;
  initialCenter?: { lat: number; lng: number };
}) {
  
  const center = initialCenter || { lat: 55.751244, lng: 37.618423 };
  const mapRef = useRef<L.Map | null>(null);
  const [position, setPosition] = useState(center);

  function MapEvents() {
    const map = useMapEvents({
      click: (e) => {
        onMapClick?.(e.latlng.lat, e.latlng.lng);
        setPosition({ lat: e.latlng.lat, lng: e.latlng.lng });
      }
    });

    return null;
  }

  return (
    <div style={{ height: '100%', width: '100%', position: 'relative' }}>
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <Marker position={position}>
          <Popup>Выбранная точка</Popup>
        </Marker>
        <MapEvents />
      </MapContainer>
    </div>
  );
}