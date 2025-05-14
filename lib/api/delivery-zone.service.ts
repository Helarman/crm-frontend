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
  restaurantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateDeliveryZoneDto {
  title: string;
  price: number;
  minOrder?: number;
  polygon: string; // WKT формат
  restaurantId: string;
}

export interface UpdateDeliveryZoneDto {
  title?: string;
  price?: number;
  minOrder?: number;
  polygon?: string; // WKT формат
}

export interface CheckCoverageDto {
  restaurantId: string;
  lat: number;
  lng: number;
}

export const DeliveryZoneService = {
  /**
   * Создать новую зону доставки
   */
  create: async (dto: CreateDeliveryZoneDto): Promise<DeliveryZone> => {
    try {
       if (!dto.polygon || !dto.polygon.startsWith('POLYGON')) {
        throw new Error('Invalid polygon format');
      }

      const { data } = await api.post<DeliveryZone>('/delivery-zones', dto);
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
  }
};