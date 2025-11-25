import axios from 'axios';
import { EventEmitter } from 'events'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = getAccessTokenFromCookie(); // Ваша функция для получения токена из кук
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let failedRequestsQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: any) => void;
}> = [];

api.interceptors.response.use(
  response => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedRequestsQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch(err => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await api.post('/auth/refresh');
        setNewAccessToken(data.accessToken); // Сохраняем новый токен
        
        // Обновляем заголовок для оригинального запроса
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        
        // Повторяем запросы из очереди
        failedRequestsQueue.forEach(pending => pending.resolve(data.accessToken));
        
        return api(originalRequest);
      } catch (refreshError) {
        failedRequestsQueue.forEach(pending => pending.reject(refreshError));
        clearAuthData(); // Очищаем данные аутентификации
        redirectToLogin(); // Перенаправляем на страницу входа
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
        failedRequestsQueue = [];
      }
    }
    
    return Promise.reject(error);
  }
);


function getAccessTokenFromCookie(): string | null {
  if (typeof document === 'undefined') return null; // Для SSR
  const value = `; ${document.cookie}`;
  const parts = value.split(`; accessToken=`);
  return parts.length === 2 ? parts.pop()?.split(';').shift() || null : null;
}

// Сохранение нового токена
function setNewAccessToken(token: string) {
  document.cookie = `accessToken=${token}; path=/; max-age=3600`; // Пример
}

// Очистка данных аутентификации
function clearAuthData() {
  document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  document.cookie = 'refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
}

// Перенаправление на страницу входа
function redirectToLogin() {
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
}


export interface DeliveryZone {
  id: string;
  title: string;
  price: number;
  minOrder?: number;
  polygon: string; // WKT или GeoJSON
  color: string; // HEX цвет зоны
  priority: number; // Приоритет (чем выше число, тем выше приоритет)
  restaurantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateDeliveryZoneDto {
  title: string;
  price: number;
  minOrder?: number;
  polygon: string; 
  color?: string; // HEX цвет (опционально)
  priority?: number; // Приоритет (опционально)
  restaurantId?: string;
}

export interface UpdateDeliveryZoneDto {
  title?: string;
  price?: number;
  minOrder?: number;
  polygon?: string; 
  color?: string; // HEX цвет
  priority?: number; // Приоритет
}

export interface CheckCoverageDto {
  restaurantId: string;
  lat: number;
  lng: number;
}

// Константы для цветов по умолчанию
export const DEFAULT_ZONE_COLORS = [
  '#3B82F6', // blue
  '#EF4444', // red
  '#10B981', // green
  '#F59E0B', // yellow
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#84CC16', // lime
] as const;

export const DeliveryZoneService = {
  /**
   * Создать новую зону доставки
   */
  create: async (dto: CreateDeliveryZoneDto): Promise<DeliveryZone> => {
    try {
      if (!dto.polygon || !dto.polygon.startsWith('POLYGON')) {
        throw new Error('Invalid polygon format');
      }

      // Автоматически назначаем цвет, если не указан
      const dataToSend = {
        ...dto,
        color: dto.color || DEFAULT_ZONE_COLORS[Math.floor(Math.random() * DEFAULT_ZONE_COLORS.length)],
        priority: dto.priority || 0,
      };

      const { data } = await api.post<DeliveryZone>('/delivery-zones', dataToSend);
      return data;
    } catch (error) {
      console.error('Failed to create delivery zone:', error);
      throw error;
    }
  },

  /**
   * Получить все зоны доставки для ресторана
   */
  findAllByRestaurant: async (restaurantId: string): Promise<DeliveryZone[]> => {
    try {
      const { data } = await api.get<DeliveryZone[]>(`/delivery-zones?restaurantId=${restaurantId}`);
      return data;
    } catch (error) {
      console.error('Failed to fetch delivery zones:', error);
      throw error;
    }
  },

  /**
   * Получить зону доставки по ID
   */
  findOne: async (id: string): Promise<DeliveryZone> => {
    try {
      const { data } = await api.get<DeliveryZone>(`/delivery-zones/${id}`);
      return data;
    } catch (error) {
      console.error(`Failed to fetch delivery zone with id ${id}:`, error);
      throw error;
    }
  },

  /**
   * Обновить зону доставки
   */
  update: async (id: string, dto: UpdateDeliveryZoneDto): Promise<DeliveryZone> => {
    try {
      const { data } = await api.patch<DeliveryZone>(`/delivery-zones/${id}`, dto);
      return data;
    } catch (error) {
      console.error(`Failed to update delivery zone with id ${id}:`, error);
      throw error;
    }
  },

  /**
   * Удалить зону доставки
   */
  remove: async (id: string): Promise<void> => {
    try {
      await api.delete(`/delivery-zones/${id}`);
    } catch (error) {
      console.error(`Failed to delete delivery zone with id ${id}:`, error);
      throw error;
    }
  },

  /**
   * Получить зону доставки для конкретной точки
   */
  findZoneForPoint: async (restaurantId: string, lat: number, lng: number): Promise<DeliveryZone | null> => {
    try {
      const { data } = await api.get<DeliveryZone | null>(`/delivery-zones/coverage/check`, {
        params: { restaurantId, lat, lng }
      });
      return data;
    } catch (error) {
      console.error('Failed to find delivery zone for point:', error);
      throw error;
    }
  },

  /**
   * Обновить только приоритет зоны
   */
  updatePriority: async (id: string, priority: number): Promise<DeliveryZone> => {
    try {
      const { data } = await api.patch<DeliveryZone>(`/delivery-zones/${id}`, { priority });
      return data;
    } catch (error) {
      console.error(`Failed to update priority for zone ${id}:`, error);
      throw error;
    }
  },

  /**
   * Обновить только цвет зоны
   */
  updateColor: async (id: string, color: string): Promise<DeliveryZone> => {
    try {
      const { data } = await api.patch<DeliveryZone>(`/delivery-zones/${id}`, { color });
      return data;
    } catch (error) {
      console.error(`Failed to update color for zone ${id}:`, error);
      throw error;
    }
  },

  /**
   * Получить следующий доступный приоритет для нового зоны
   */
  getNextAvailablePriority: async (restaurantId: string): Promise<number> => {
    try {
      const zones = await DeliveryZoneService.findAllByRestaurant(restaurantId);
      if (zones.length === 0) return 0;
      
      const maxPriority = Math.max(...zones.map(zone => zone.priority));
      return maxPriority + 1;
    } catch (error) {
      console.error('Failed to get next available priority:', error);
      return 0;
    }
  },

  /**
   * Переупорядочить приоритеты зон
   */
  reorderPriorities: async (restaurantId: string, zoneIds: string[]): Promise<DeliveryZone[]> => {
    try {
      const updates = zoneIds.map((id, index) => 
        DeliveryZoneService.updatePriority(id, zoneIds.length - index - 1)
      );
      
      return await Promise.all(updates);
    } catch (error) {
      console.error('Failed to reorder priorities:', error);
      throw error;
    }
  }
};

// Вспомогательные функции для работы с цветами
export const ZoneColorUtils = {
  /**
   * Проверить валидность HEX цвета
   */
  isValidHexColor: (color: string): boolean => {
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
  },

  /**
   * Получить контрастный цвет текста для фона
   */
  getContrastTextColor: (backgroundColor: string): string => {
    // Упрощенная проверка яркости цвета
    const hex = backgroundColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Формула яркости
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    
    return brightness > 128 ? '#000000' : '#FFFFFF';
  },

  /**
   * Осветлить цвет
   */
  lightenColor: (color: string, percent: number): string => {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    
    return '#' + (
      0x1000000 +
      (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255)
    ).toString(16).slice(1);
  }
};