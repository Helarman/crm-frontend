'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { DeliveryZone } from '@/lib/api/delivery-zone.service';
import { Button } from '../ui/button';

declare global {
  interface Window {
    ymaps: any;
  }
}

interface YandexMapEditorProps {
  zones?: DeliveryZone[];
  initialPolygon?: string;
  onChange?: (polygon: string | null) => void;
  onValidationChange?: (isValid: boolean) => void;
  interactive?: boolean;
  center?: [number, number];
  zoom?: number;
  height?: number;
}

const YANDEX_MAPS_API_KEY = process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY || 'your_yandex_maps_api_key_here';

export function YandexMapEditor({
  zones = [],
  initialPolygon,
  onChange,
  onValidationChange,
  interactive = true,
  center = [55.753960, 37.620393],
  zoom = 12,
  height = 400
}: YandexMapEditorProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // useRef для хранения состояния
  const stateRef = useRef({
    map: null as any,
    ymaps: null as any,
    currentPolygon: null as any,
    drawingMode: false,
    points: [] as number[][],
    temporaryPolyline: null as any,
    completeButton: null as any,
    zonesCollection: null as any
  });

  // Функция для преобразования WKT в координаты
  const wktToCoordinates = useCallback((wkt: string): number[][][] => {
    try {
      if (!wkt) return [];
      const match = wkt.match(/POLYGON\s*\(\s*\(\s*(.+?)\s*\)\s*\)/i);
      if (!match) return [];

      const coordsStr = match[1];
      const coordPairs = coordsStr.split(',').map(coord => 
        coord.trim().split(/\s+/).map(Number)
      );

      return [coordPairs.map(coord => [coord[1], coord[0]])];
    } catch (error) {
      console.error('Error parsing WKT:', error);
      return [];
    }
  }, []);

  // Функция для преобразования координат в WKT
  const coordinatesToWkt = useCallback((coordinates: number[][][]): string => {
    try {
      const contour = coordinates[0];
      if (!contour || contour.length < 3) return '';

      const wktCoordinates = contour.map(coord => 
        `${coord[1].toFixed(6)} ${coord[0].toFixed(6)}`
      ).join(', ');

      return `POLYGON((${wktCoordinates}))`;
    } catch (error) {
      console.error('Error converting to WKT:', error);
      return '';
    }
  }, []);

  // Инициализация карты
  useEffect(() => {
    let isMounted = true;

    const initMap = async () => {
      try {
        // Проверяем, уже загружены ли карты
        if (window.ymaps) {
          initializeWithYMaps();
          return;
        }

        // Загружаем скрипт
        const script = document.createElement('script');
        script.src = `https://api-maps.yandex.ru/2.1/?lang=ru_RU&apikey=${YANDEX_MAPS_API_KEY}`;
        script.async = true;
        
        script.onload = () => {
          if (!isMounted) return;
          window.ymaps.ready(() => {
            if (!isMounted) return;
            initializeWithYMaps();
          });
        };
        
        script.onerror = () => {
          if (!isMounted) return;
          setError('Не удалось загрузить Яндекс.Карты');
          setIsLoading(false);
        };

        document.head.appendChild(script);

      } catch (err) {
        if (isMounted) {
          console.error('Error initializing map:', err);
          setError('Ошибка инициализации карты');
          setIsLoading(false);
        }
      }
    };

    const initializeWithYMaps = () => {
      if (!mapRef.current || !window.ymaps) {
        setIsLoading(false);
        return;
      }

      try {
        const ymaps = window.ymaps;
        const map = new ymaps.Map(mapRef.current, {
          center: center,
          zoom: zoom,
          controls: ['zoomControl', 'fullscreenControl']
        });

        stateRef.current.map = map;
        stateRef.current.ymaps = ymaps;
        
        setIsLoading(false);
        
        // Инициализируем зоны и редактор после создания карты
        setTimeout(() => {
          initializeZones();
          initializePolygonEditor();
        }, 100);

      } catch (err) {
        console.error('Error creating map:', err);
        setError('Ошибка создания карты');
        setIsLoading(false);
      }
    };

    initMap();

    return () => {
      isMounted = false;
      // Очистка при размонтировании
      cleanup();
    };
  }, [center, zoom]);

  // Инициализация зон доставки
  const initializeZones = useCallback(() => {
    const { map, ymaps } = stateRef.current;
    if (!map || !ymaps || zones.length === 0) return;

    try {
      // Удаляем старые зоны
      if (stateRef.current.zonesCollection) {
        map.geoObjects.remove(stateRef.current.zonesCollection);
      }

      const zonesCollection = new ymaps.GeoObjectCollection();

      zones.forEach(zone => {
        try {
          const coordinates = wktToCoordinates(zone.polygon);
          if (coordinates.length === 0) return;

          const polygon = new ymaps.Polygon(coordinates, {
            hintContent: zone.title,
          }, {
            fillColor: zone.color + '40',
            strokeColor: zone.color,
            strokeWidth: 2,
            opacity: 0.8
          });

          zonesCollection.add(polygon);
        } catch (error) {
          console.error('Error rendering zone:', zone.id, error);
        }
      });

      map.geoObjects.add(zonesCollection);
      stateRef.current.zonesCollection = zonesCollection;

    } catch (error) {
      console.error('Error initializing zones:', error);
    }
  }, [zones, wktToCoordinates]);

  // Инициализация редактора полигонов
  const initializePolygonEditor = useCallback(() => {
    const { map, ymaps } = stateRef.current;
    if (!map || !ymaps || !interactive) return;

    const updatePolygonWKT = (polygon: any) => {
      if (!polygon || !onChange) return;

      try {
        const coordinates = polygon.geometry.getCoordinates();
        const wkt = coordinatesToWkt(coordinates);
        
        if (wkt) {
          onChange(wkt);
          onValidationChange?.(true);
        } else {
          onChange(null);
          onValidationChange?.(false);
        }
      } catch (error) {
        console.error('Error converting to WKT:', error);
        onChange?.(null);
        onValidationChange?.(false);
      }
    };

    const handleMapClick = (e: any) => {
      const coords = e.get('coords');
      const state = stateRef.current;
      
      if (!state.drawingMode) {
        startDrawing(coords);
      } else {
        continueDrawing(coords);
      }
    };

    const startDrawing = (coords: number[]) => {
      const state = stateRef.current;
      cleanupDrawing();
      
      state.drawingMode = true;
      state.points = [coords];
      
      state.temporaryPolyline = new ymaps.Polyline([coords, coords], {}, {
        strokeColor: "#FF0000",
        strokeWidth: 2,
        strokeOpacity: 0.8
      });
      
      map.geoObjects.add(state.temporaryPolyline);
      addCompleteButton();
    };

    const continueDrawing = (coords: number[]) => {
      const state = stateRef.current;
      state.points.push(coords);
      state.temporaryPolyline.geometry.setCoordinates(state.points);
    };

    const completeDrawing = () => {
      const state = stateRef.current;
      
      if (state.points.length < 3) {
        return;
      }

      // Создаем полигон
      const polygonCoords = [...state.points, state.points[0]];
      state.currentPolygon = new ymaps.Polygon([polygonCoords], {}, {
        fillColor: "#00FF0040",
        strokeColor: "#00FF00",
        strokeWidth: 3,
        opacity: 0.8
      });

      map.geoObjects.add(state.currentPolygon);
      
      // Включаем редактирование
      try {
        state.currentPolygon.editor.startEditing();
        state.currentPolygon.geometry.events.add('change', () => {
          updatePolygonWKT(state.currentPolygon);
        });
      } catch (error) {
        console.error('Error enabling editor:', error);
      }
      
      updatePolygonWKT(state.currentPolygon);
      cleanupDrawing();
      removeCompleteButton();
      map.events.remove('click', handleMapClick);
    };

    const addCompleteButton = () => {
      const state = stateRef.current;
      
      if (state.completeButton) {
        map.controls.remove(state.completeButton);
      }

      state.completeButton = new ymaps.control.Button({
        data: {
          content: "Завершить рисование",
          title: "Завершить создание полигона"
        },
        options: {
          maxWidth: 200,
          position: { top: 10, right: 10 }
        }
      });
      
      state.completeButton.events.add('press', completeDrawing);
      map.controls.add(state.completeButton);
    };

    const removeCompleteButton = () => {
      const state = stateRef.current;
      if (state.completeButton) {
        map.controls.remove(state.completeButton);
        state.completeButton = null;
      }
    };

    const cleanupDrawing = () => {
      const state = stateRef.current;
      
      if (state.temporaryPolyline) {
        map.geoObjects.remove(state.temporaryPolyline);
        state.temporaryPolyline = null;
      }
      
      state.drawingMode = false;
      state.points = [];
    };

    const initializeExistingPolygon = () => {
      if (!initialPolygon) return;

      try {
        const coordinates = wktToCoordinates(initialPolygon);
        if (coordinates.length === 0) return;

        const state = stateRef.current;
        state.currentPolygon = new ymaps.Polygon(coordinates, {}, {
          fillColor: "#00FF0040",
          strokeColor: "#00FF00",
          strokeWidth: 3,
          opacity: 0.8
        });

        map.geoObjects.add(state.currentPolygon);
        
        // Включаем редактирование
        try {
          state.currentPolygon.editor.startEditing();
          state.currentPolygon.geometry.events.add('change', () => {
            updatePolygonWKT(state.currentPolygon);
          });
        } catch (error) {
          console.error('Error enabling editor:', error);
        }
        
        updatePolygonWKT(state.currentPolygon);
      } catch (error) {
        console.error('Error initializing existing polygon:', error);
      }
    };

    // Очистка предыдущего состояния
    cleanupDrawing();
    removeCompleteButton();
    map.events.remove('click', handleMapClick);

    if (initialPolygon) {
      initializeExistingPolygon();
    } else {
      map.events.add('click', handleMapClick);
    }

  }, [initialPolygon, interactive, onChange, onValidationChange, coordinatesToWkt, wktToCoordinates]);

  // Очистка
  const cleanup = useCallback(() => {
    const { map } = stateRef.current;
    
    if (map) {
      // Удаляем все обработчики и контролы
      map.events.remove('click');
      if (stateRef.current.completeButton) {
        map.controls.remove(stateRef.current.completeButton);
      }
      
      // Удаляем все геообъекты
      map.geoObjects.removeAll();
      
      // Уничтожаем карту
      map.destroy();
    }

    // Сбрасываем состояние
    stateRef.current = {
      map: null,
      ymaps: null,
      currentPolygon: null,
      drawingMode: false,
      points: [],
      temporaryPolyline: null,
      completeButton: null,
      zonesCollection: null
    };
  }, []);

  // Обновление при изменении пропсов
  useEffect(() => {
    if (!isLoading && !error) {
      initializeZones();
      initializePolygonEditor();
    }
  }, [initializeZones, initializePolygonEditor, isLoading, error]);

  if (error) {
    return (
      <div className="w-full rounded-lg border bg-gray-50 flex items-center justify-center" style={{ height }}>
        <div className="text-center text-red-600">
          <p className="font-medium">Ошибка загрузки карты</p>
          <p className="text-sm mt-1">{error}</p>
          <Button 
            onClick={() => window.location.reload()} 
            className="mt-2"
            variant="outline"
            size="sm"
          >
            Попробовать снова
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full rounded-lg overflow-hidden border bg-white">
      <div 
        ref={mapRef} 
        className="w-full"
        style={{ height }}
      />
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600 text-sm">Загрузка карты...</p>
          </div>
        </div>
      )}
      {interactive && (
        <div className="p-3 bg-gray-50 border-t">
          <p className="text-sm text-gray-600 text-center">
            {initialPolygon 
              ? 'Перетаскивайте точки для изменения зоны' 
              : 'Кликните на карте, чтобы начать рисовать зону доставки. Добавьте минимум 3 точки и нажмите "Завершить рисование".'
            }
          </p>
        </div>
      )}
    </div>
  );
}