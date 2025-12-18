// hooks/useYandexMaps.ts
import { useState, useEffect } from 'react';

declare global {
  interface Window {
    ymaps: any;
    ymapsPromise: Promise<any> | null;
  }
}

const YANDEX_MAPS_API_KEY = process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY || 'your_api_key_here';

export function useYandexMaps() {
  const [ymaps, setYmaps] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Если уже загружено
    if (window.ymaps) {
      setYmaps(window.ymaps);
      setLoading(false);
      return;
    }

    // Если уже загружается
    if (window.ymapsPromise) {
      window.ymapsPromise.then(setYmaps).catch(setError).finally(() => setLoading(false));
      return;
    }

    // Загружаем впервые
    setLoading(true);
    window.ymapsPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `https://api-maps.yandex.ru/2.1/?lang=ru_RU&apikey=${YANDEX_MAPS_API_KEY}`;
      script.async = true;
      
      script.onload = () => {
        window.ymaps.ready(() => {
          setYmaps(window.ymaps);
          resolve(window.ymaps);
          setLoading(false);
        });
      };
      
      script.onerror = () => {
        const errorMsg = 'Failed to load Yandex Maps';
        setError(errorMsg);
        reject(new Error(errorMsg));
        setLoading(false);
      };

      document.head.appendChild(script);
    });

    window.ymapsPromise.then(setYmaps).catch(setError);
  }, []);

  return { ymaps, loading, error };
}