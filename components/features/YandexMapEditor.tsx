'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { DeliveryZone } from '@/lib/api/delivery-zone.service';
import { Button } from '../ui/button';
import { toast } from 'sonner';

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
  
  const mapInstanceRef = useRef<any>(null);
  const ymapsRef = useRef<any>(null);
  const currentPolygonRef = useRef<any>(null);
  const zonesCollectionRef = useRef<any>(null);
  const isInitializedRef = useRef(false);

  // Функция для преобразования WKT в координаты
  const wktToCoordinates = useCallback((wkt: string): number[][][] => {
    try {
      if (!wkt) return [];
      
      // Убираем пробелы и находим координаты
      const cleanWkt = wkt.replace(/\s+/g, ' ');
      const match = cleanWkt.match(/POLYGON\s*\(\s*\(\s*([^)]+)\s*\)\s*\)/i);
      
      if (!match) return [];

      const coordsStr = match[1];
      const coordPairs = coordsStr.split(',').map(coord => {
        const numbers = coord.trim().split(/\s+/).map(Number);
        return [numbers[1], numbers[0]]; // [lat, lng]
      });

      return [coordPairs];
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

      // Замыкаем полигон
      const firstCoord = contour[0];
      const closedCoordinates = wktCoordinates + `, ${firstCoord[1].toFixed(6)} ${firstCoord[0].toFixed(6)}`;

      return `POLYGON((${closedCoordinates}))`;
    } catch (error) {
      console.error('Error converting to WKT:', error);
      return '';
    }
  }, []);

  // Валидация цвета
  const validateColor = useCallback((color: string): string => {
    if (!color) return '#FF0000';
    
    // Простая валидация hex цвета
    const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    if (hexRegex.test(color)) {
      return color;
    }
    
    // Если цвет в неправильном формате, возвращаем красный
    return '#FF0000';
  }, []);

  // Инициализация карты
  const initializeMap = useCallback(async () => {
    if (!mapRef.current || isInitializedRef.current) return;

    try {
      // Проверяем, уже загружены ли Яндекс Карты
      if (!window.ymaps) {
        await loadYandexMaps();
      }

      const ymaps = window.ymaps;
      ymapsRef.current = ymaps;

      // Ждем готовности API
      await ymaps.ready();

      // Создаем карту
      const map = new ymaps.Map(mapRef.current, {
        center: center,
        zoom: zoom,
        controls: ['zoomControl', 'fullscreenControl']
      });

      mapInstanceRef.current = map;
      isInitializedRef.current = true;
      
      // Инициализируем зоны
      initializeZonesOnMap();
      
      // Если есть initialPolygon, создаем его
      if (initialPolygon) {
        initializeExistingPolygon();
      }
      
      // Если интерактивный режим, добавляем обработчики
      if (interactive) {
        setupInteractiveMode();
      }

      setIsLoading(false);

    } catch (err) {
      console.error('Error initializing map:', err);
      setError('Ошибка инициализации карты');
      setIsLoading(false);
    }
  }, [center, zoom, initialPolygon, interactive]);

  // Загрузка Яндекс Карт
  const loadYandexMaps = useCallback(() => {
    return new Promise((resolve, reject) => {
      // Проверяем, не загружены ли уже карты
      if (window.ymaps) {
        resolve(window.ymaps);
        return;
      }

      const existingScript = document.querySelector(`script[src*="api-maps.yandex.ru"]`);
      if (existingScript) {
        // Скрипт уже загружается или загружен
        const checkReady = () => {
          if (window.ymaps) {
            resolve(window.ymaps);
          } else {
            setTimeout(checkReady, 100);
          }
        };
        checkReady();
        return;
      }

      const script = document.createElement('script');
      script.src = `https://api-maps.yandex.ru/2.1/?lang=ru_RU&apikey=${YANDEX_MAPS_API_KEY}`;
      script.async = true;
      
      script.onload = () => {
        if (window.ymaps) {
          window.ymaps.ready(() => resolve(window.ymaps));
        } else {
          reject(new Error('YMaps not loaded'));
        }
      };
      
      script.onerror = () => {
        reject(new Error('Failed to load Yandex Maps'));
      };

      document.head.appendChild(script);
    });
  }, []);

  // Инициализация зон на карте
  const initializeZonesOnMap = useCallback(() => {
    const map = mapInstanceRef.current;
    const ymaps = ymapsRef.current;
    
    if (!map || !ymaps || zones.length === 0) return;

    try {
      // Удаляем старые зоны
      if (zonesCollectionRef.current) {
        map.geoObjects.remove(zonesCollectionRef.current);
      }

      const zonesCollection = new ymaps.GeoObjectCollection({}, {
        preset: 'islands#blueCircleIcon'
      });

      zones.forEach(zone => {
        try {
          const coordinates = wktToCoordinates(zone.polygon);
          if (coordinates.length === 0 || !coordinates[0]) return;

          const validColor = validateColor(zone.color);
          
          const polygon = new ymaps.Polygon(coordinates, {
            hintContent: zone.title,
            balloonContent: `
              <div>
                <strong>${zone.title}</strong><br/>
                Доставка: ${zone.price}₽<br/>
                Мин. заказ: ${zone.minOrder || 0}₽
              </div>
            `
          }, {
            fillColor: validColor + '60', // Добавляем прозрачность
            strokeColor: validColor,
            strokeWidth: 2,
            strokeOpacity: 0.8,
            fillOpacity: 0.4
          });

          zonesCollection.add(polygon);
        } catch (error) {
          console.error('Error rendering zone:', zone.id, error);
        }
      });

      map.geoObjects.add(zonesCollection);
      zonesCollectionRef.current = zonesCollection;

    } catch (error) {
      console.error('Error initializing zones:', error);
    }
  }, [zones, wktToCoordinates, validateColor]);

  // Инициализация существующего полигона для редактирования
  const initializeExistingPolygon = useCallback(() => {
    const map = mapInstanceRef.current;
    const ymaps = ymapsRef.current;
    
    if (!map || !ymaps || !initialPolygon) return;

    try {
      const coordinates = wktToCoordinates(initialPolygon);
      if (coordinates.length === 0) return;

      // Удаляем старый полигон если есть
      if (currentPolygonRef.current) {
        map.geoObjects.remove(currentPolygonRef.current);
      }

      const polygon = new ymaps.Polygon(coordinates, {}, {
        fillColor: '#1E40AF60',
        strokeColor: '#1E40AF',
        strokeWidth: 3,
        strokeOpacity: 0.8,
        fillOpacity: 0.4,
        editorMaxPoints: Infinity
      });

      map.geoObjects.add(polygon);
      currentPolygonRef.current = polygon;

      // Включаем редактирование
      if (interactive) {
        try {
          const editor = polygon.editor;
          if (editor) {
            editor.startEditing();
            
            // Следим за изменениями
            polygon.geometry.events.add('change', () => {
              const newCoordinates = polygon.geometry.getCoordinates();
              const wkt = coordinatesToWkt(newCoordinates);
              
              if (wkt) {
                onChange?.(wkt);
                onValidationChange?.(true);
              } else {
                onChange?.(null);
                onValidationChange?.(false);
              }
            });
          }
        } catch (editorError) {
          console.error('Error enabling editor:', editorError);
        }
      }

      // Обновляем состояние валидации
      onValidationChange?.(true);

    } catch (error) {
      console.error('Error initializing existing polygon:', error);
      onValidationChange?.(false);
    }
  }, [initialPolygon, interactive, onChange, onValidationChange, wktToCoordinates, coordinatesToWkt]);

  // Настройка интерактивного режима для создания новых полигонов
  const setupInteractiveMode = useCallback(() => {
    const map = mapInstanceRef.current;
    const ymaps = ymapsRef.current;
    
    if (!map || !ymaps || !interactive || initialPolygon) return;

    let drawingMode = false;
    let points: number[][] = [];
    let polyline: any = null;

    const handleMapClick = (e: any) => {
      const coords = e.get('coords');
      
      if (!drawingMode) {
        startDrawing(coords);
      } else {
        addPoint(coords);
      }
    };

    const startDrawing = (coords: number[]) => {
      drawingMode = true;
      points = [coords];
      
      // Создаем временную ломаную линию
      polyline = new ymaps.Polyline([coords], {}, {
        strokeColor: '#EF4444',
        strokeWidth: 3,
        strokeOpacity: 0.8
      });
      
      map.geoObjects.add(polyline);
    };

    const addPoint = (coords: number[]) => {
      points.push(coords);
      polyline.geometry.setCoordinates(points);
      
      // Если точек достаточно, предлагаем завершить
      if (points.length >= 3) {
        showCompleteButton();
      }
    };

    const showCompleteButton = () => {
      // Удаляем старую кнопку если есть
      const existingButton = map.controls.getContainer().querySelector('.complete-drawing-btn');
      if (existingButton) {
        existingButton.remove();
      }

      const button = document.createElement('button');
      button.className = 'complete-drawing-btn bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-blue-700 transition-colors';
      button.textContent = 'Завершить рисование';
      button.style.position = 'absolute';
      button.style.top = '10px';
      button.style.right = '10px';
      button.style.zIndex = '1000';
      
      button.onclick = completeDrawing;
      
      map.controls.getContainer().appendChild(button);
    };

    const completeDrawing = () => {
      if (points.length < 3) {
        toast.error('Добавьте минимум 3 точки для создания зоны');
        return;
      }

      // Замыкаем полигон
      const polygonCoords = [...points, points[0]];
      
      // Удаляем временные элементы
      if (polyline) {
        map.geoObjects.remove(polyline);
      }
      
      const completeButton = map.controls.getContainer().querySelector('.complete-drawing-btn');
      if (completeButton) {
        completeButton.remove();
      }

      // Создаем полигон
      const polygon = new ymaps.Polygon([polygonCoords], {}, {
        fillColor: '#1E40AF60',
        strokeColor: '#1E40AF',
        strokeWidth: 3,
        strokeOpacity: 0.8,
        fillOpacity: 0.4,
        editorMaxPoints: Infinity
      });

      map.geoObjects.add(polygon);
      currentPolygonRef.current = polygon;

      // Включаем редактирование
      try {
        const editor = polygon.editor;
        if (editor) {
          editor.startEditing();
          
          polygon.geometry.events.add('change', () => {
            const newCoordinates = polygon.geometry.getCoordinates();
            const wkt = coordinatesToWkt(newCoordinates);
            
            if (wkt) {
              onChange?.(wkt);
              onValidationChange?.(true);
            } else {
              onChange?.(null);
              onValidationChange?.(false);
            }
          });
        }
      } catch (editorError) {
        console.error('Error enabling editor:', editorError);
      }

      // Сбрасываем состояние рисования
      drawingMode = false;
      points = [];
      polyline = null;
      
      // Убираем обработчик кликов
      map.events.remove('click', handleMapClick);
      
      // Обновляем состояние
      const wkt = coordinatesToWkt([polygonCoords]);
      onChange?.(wkt);
      onValidationChange?.(true);
    };

    // Добавляем обработчик кликов только если нет начального полигона
    if (!initialPolygon) {
      map.events.add('click', handleMapClick);
    }

    // Функция очистки
    return () => {
      map.events.remove('click', handleMapClick);
      const completeButton = map.controls.getContainer().querySelector('.complete-drawing-btn');
      if (completeButton) {
        completeButton.remove();
      }
    };
  }, [interactive, initialPolygon, onChange, onValidationChange, coordinatesToWkt]);

  // Очистка
  const cleanup = useCallback(() => {
    if (mapInstanceRef.current) {
      try {
        mapInstanceRef.current.destroy();
      } catch (error) {
        console.error('Error destroying map:', error);
      }
    }
    
    mapInstanceRef.current = null;
    ymapsRef.current = null;
    currentPolygonRef.current = null;
    zonesCollectionRef.current = null;
    isInitializedRef.current = false;
  }, []);

  // Основной эффект инициализации
  useEffect(() => {
    initializeMap();

    return () => {
      cleanup();
    };
  }, [initializeMap, cleanup]);

  // Эффект для обновления зон
  useEffect(() => {
    if (isInitializedRef.current) {
      initializeZonesOnMap();
    }
  }, [initializeZonesOnMap]);

  // Эффект для обновления полигона при изменении initialPolygon
  useEffect(() => {
    if (isInitializedRef.current && initialPolygon) {
      initializeExistingPolygon();
    }
  }, [initialPolygon, initializeExistingPolygon]);

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
    <div className="w-full rounded-lg overflow-hidden border bg-white relative">
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
    </div>
  );
}