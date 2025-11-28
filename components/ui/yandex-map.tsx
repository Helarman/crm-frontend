'use client';

import { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    ymaps: any;
  }
}

interface YandexMapProps {
  onMapClick?: (lat: number, lng: number) => void;
  initialCenter?: { lat: number; lng: number };
  markerPosition?: { lat: number; lng: number };
}

export function YandexMap({ 
  onMapClick, 
  initialCenter = { lat: 55.751244, lng: 37.618423 },
  markerPosition
}: YandexMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    let map: any;
    let marker: any;

    const initializeMap = () => {
      try {
        // Создаем карту
        map = new window.ymaps.Map(mapContainerRef.current, {
          center: [initialCenter.lat, initialCenter.lng],
          zoom: 13
        });

        map.controls.add('zoomControl');
        map.controls.add('fullscreenControl');

        marker = new window.ymaps.Placemark(
          [initialCenter.lat, initialCenter.lng],
          {},
          {
            preset: 'islands#redIcon',
            draggable: true
          }
        );

        map.geoObjects.add(marker);

        map.events.add('click', (e: any) => {
          const coords = e.get('coords');
          marker.geometry.setCoordinates(coords);
          onMapClick?.(coords[0], coords[1]);
        });

        marker.events.add('dragend', () => {
          const coords = marker.geometry.getCoordinates();
          onMapClick?.(coords[0], coords[1]);
        });

        setIsLoading(false);
      } catch (err) {
        console.error('Map initialization error:', err);
        setError('Ошибка загрузки карты');
        setIsLoading(false);
      }
    };

    if (window.ymaps) {
      window.ymaps.ready(initializeMap);
    } else {
      const script = document.createElement('script');
      script.src = 'https://api-maps.yandex.ru/2.1/?lang=ru_RU&apikey=ваш_api_ключ';
      script.async = true;
      
      script.onload = () => {
        window.ymaps.ready(initializeMap);
      };
      
      script.onerror = () => {
        setError('Не удалось загрузить Яндекс.Карты');
        setIsLoading(false);
      };
      
      document.head.appendChild(script);
    }

    return () => {
      if (map) {
        try {
          map.destroy();
        } catch (e) {
          console.error('Error cleaning up map:', e);
        }
      }
    };
  }, []);

  useEffect(() => {
    if (markerPosition && window.ymaps && !isLoading) {
      window.ymaps.ready(() => {
      });
    }
  }, [markerPosition, isLoading]);

  return (
      <div 
        ref={mapContainerRef} 
        className="h-full w-full"
      />
  );
}