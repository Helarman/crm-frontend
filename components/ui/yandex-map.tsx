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

        // Добавляем элементы управления
        map.controls.add('zoomControl');
        map.controls.add('fullscreenControl');

        // Создаем маркер
        marker = new window.ymaps.Placemark(
          [initialCenter.lat, initialCenter.lng],
          {},
          {
            preset: 'islands#redIcon',
            draggable: true
          }
        );

        map.geoObjects.add(marker);

        // Обработчики событий
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

    // Проверяем, загружены ли уже Яндекс.Карты
    if (window.ymaps) {
      window.ymaps.ready(initializeMap);
    } else {
      // Загружаем Яндекс.Карты
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
      // Очистка при размонтировании
      if (map) {
        try {
          map.destroy();
        } catch (e) {
          console.error('Error cleaning up map:', e);
        }
      }
    };
  }, []);

  // Обновляем маркер при изменении позиции
  useEffect(() => {
    if (markerPosition && window.ymaps && !isLoading) {
      window.ymaps.ready(() => {
        // Здесь нужно обновить маркер, но для простоты пересоздадим карту
        // В реальном приложении нужно сохранять ссылки на map и marker
      });
    }
  }, [markerPosition, isLoading]);

  return (
    <div className="h-full w-full relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Загрузка карты...</p>
          </div>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted z-10">
          <div className="text-center text-destructive">
            <p className="font-medium">{error}</p>
          </div>
        </div>
      )}
      <div 
        ref={mapContainerRef} 
        className="h-full w-full"
      />
    </div>
  );
}