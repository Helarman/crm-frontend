// components/map-editor.tsx
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Polygon, CircleMarker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useLanguageStore } from '@/lib/stores/language-store';

interface MapEditorProps {
  initialPolygon?: string;
  onChange: (polygon: string | null) => void;
  onValidationChange?: (isValid: boolean) => void;
}

const mapTranslations = {
  ru: { 
    reset: 'Сбросить',
    drawHint: 'Кликните на карту, чтобы нарисовать полигон',
    minPoints: 'Минимум 3 точки для создания зоны',
    deletePoint: 'Удалить точку',
    closePolygon: 'Закрыть полигон',
    polygonNotClosed: 'Полигон должен быть замкнут'
  },
  ka: { 
    reset: 'გადატვირთვა',
    drawHint: 'დააწკაპუნეთ რუკაზე პოლიგონის შესაქმნელად',
    minPoints: 'მინიმუმ 3 წერტილი ზონის შესაქმნელად',
    deletePoint: 'წერტილის წაშლა',
    closePolygon: 'პოლიგონის დახურვა',
    polygonNotClosed: 'პოლიგონი უნდა იყოს დახურული'
  },
};

const isPolygonClosed = (points: L.LatLng[]) => {
  if (points.length < 3) return false;
  const first = points[0];
  const last = points[points.length - 1];
  return first.lat === last.lat && first.lng === last.lng;
};

export default function MapEditor({ 
  initialPolygon, 
  onChange, 
  onValidationChange 
}: MapEditorProps) {
  const { language } = useLanguageStore();
  const t = mapTranslations[language];
  
  const [polygon, setPolygon] = useState<L.LatLng[]>([]);
  const [activePointIndex, setActivePointIndex] = useState<number | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const mapRef = useRef<L.Map>(null);

  const isValid = polygon.length >= 3 && isPolygonClosed(polygon);

  useEffect(() => {
    onValidationChange?.(isValid);
  }, [isValid, onValidationChange]);

  const parseWktPolygon = useCallback((wkt: string): L.LatLng[] => {
    if (!wkt?.startsWith('POLYGON')) return [];
    
    try {
      const coordsStr = wkt
        .replace('POLYGON ((', '')
        .replace('))', '');
      return coordsStr.split(',').map(coord => {
        const [lng, lat] = coord.trim().split(' ').map(parseFloat);
        return L.latLng(lat, lng);
      });
    } catch (error) {
      console.error('Failed to parse WKT polygon:', error);
      return [];
    }
  }, []);

  useEffect(() => {
    if (initialPolygon && !isInitialized) {
      const coords = parseWktPolygon(initialPolygon);
      if (coords.length >= 3) {
        setPolygon(coords);
      }
      setIsInitialized(true);
    }
  }, [initialPolygon, isInitialized, parseWktPolygon]);

  useEffect(() => {
    if (isInitialized) {
      const points = [...polygon];
      if (points.length >= 3 && !isPolygonClosed(points)) {
        points.push(points[0]);
      }
      
      const wkt = points.length >= 3 
        ? `POLYGON ((${points.map(c => `${c.lng} ${c.lat}`).join(', ')}))`
        : null;
      onChange(wkt);
    }
  }, [polygon, onChange, isInitialized]);

  useEffect(() => {
    if (mapRef.current && polygon.length > 0) {
      mapRef.current.fitBounds(L.latLngBounds(polygon));
    }
  }, [polygon]);

  const handleMapClick = (e: L.LeafletMouseEvent) => {
    if (activePointIndex !== null) {
      setActivePointIndex(null);
      return;
    }
    setPolygon(prev => [...prev, e.latlng]);
  };

  const handlePointClick = (index: number, e: L.LeafletMouseEvent) => {
    e.originalEvent.stopPropagation();
    setActivePointIndex(index);
  };

  const handlePointDrag = (index: number, e: L.LeafletEvent) => {
    const newPolygon = [...polygon];
    newPolygon[index] = e.target.getLatLng();
    setPolygon(newPolygon);
  };

  const handleDeletePoint = (index: number) => {
    if (polygon.length <= 3) {
      alert(t.minPoints);
      return;
    }
    setPolygon(prev => prev.filter((_, i) => i !== index));
    setActivePointIndex(null);
  };

  const handleClosePolygon = () => {
    if (polygon.length >= 3 && !isPolygonClosed(polygon)) {
      setPolygon(prev => [...prev, prev[0]]);
    }
  };

  const resetPolygon = () => {
    setPolygon([]);
    setActivePointIndex(null);
    setIsInitialized(true);
  };

  return (
    <div className="h-full w-full relative">
      <MapContainer
        center={[55.751244, 37.618423]}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        ref={mapRef}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        {polygon.length >= 3 && (
          <Polygon
            positions={isPolygonClosed(polygon) ? polygon : [...polygon, polygon[0]]}
            color={isPolygonClosed(polygon) ? "blue" : "orange"}
            fillOpacity={0.4}
          />
        )}
        
        {polygon.map((point, index) => (
          <CircleMarker
            key={index}
            center={point}
            radius={8}
            color={activePointIndex === index ? 'red' : 'blue'}
            fillOpacity={1}
            eventHandlers={{
              click: (e) => handlePointClick(index, e),
              dragend: (e) => handlePointDrag(index, e),
            }}
          />
        ))}
        
        <MapClickHandler onClick={handleMapClick} />
      </MapContainer>
      
      <div className="absolute top-2 right-2 z-[1000] space-y-2">
        <button
          onClick={resetPolygon}
          className="bg-white p-2 rounded shadow hover:bg-gray-100"
        >
          {t.reset}
        </button>
        
        {polygon.length >= 3 && !isPolygonClosed(polygon) && (
          <button
            onClick={handleClosePolygon}
            className="bg-white p-2 rounded shadow hover:bg-gray-100"
          >
            {t.closePolygon}
          </button>
        )}
      </div>
      
      {activePointIndex !== null && (
        <div className="absolute top-16 right-2 z-[1000]">
          <button
            onClick={() => handleDeletePoint(activePointIndex)}
            className="bg-red-500 text-white p-2 rounded shadow hover:bg-red-600"
          >
            {t.deletePoint}
          </button>
        </div>
      )}
      
      {polygon.length === 0 && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[1000] bg-white bg-opacity-80 p-4 rounded text-center">
          {t.drawHint}
        </div>
      )}
      
      {polygon.length > 0 && polygon.length < 3 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-[1000] bg-red-100 text-red-800 p-2 rounded">
          {t.minPoints}
        </div>
      )}
      
      {polygon.length >= 3 && !isPolygonClosed(polygon) && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-[1000] bg-orange-100 text-orange-800 p-2 rounded">
          {t.polygonNotClosed}
        </div>
      )}
    </div>
  );
}

function MapClickHandler({ onClick }: { onClick: (e: L.LeafletMouseEvent) => void }) {
  useMapEvents({ click: onClick });
  return null;
}