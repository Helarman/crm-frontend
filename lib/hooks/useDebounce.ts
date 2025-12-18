// hooks/use-debounce.ts
import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Хук для отложенного обновления значения
 * @param value - Значение, которое нужно "задержать"
 * @param delay - Задержка в миллисекундах (по умолчанию 500мс)
 * @returns Отложенное значение
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Устанавливаем таймер для обновления значения после задержки
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Очищаем таймер при каждом изменении значения или при размонтировании компонента
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}


export function useDebounceCallback(
    callback: (...args: any[]) => void,
    delay: number = 500
  ): (...args: any[]) => void {
    const timeoutRef = useRef<NodeJS.Timeout>(null);
  
    // Очищаем таймер при размонтировании компонента
    useEffect(() => {
      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }, []);
  
    return useCallback(
      (...args: any[]) => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
  
        timeoutRef.current = setTimeout(() => {
          callback(...args);
        }, delay);
      },
      [callback, delay]
    );
  }