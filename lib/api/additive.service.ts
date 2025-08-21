import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export interface Additive {
  id?: string;
  title: string;
  price: number;
}

export interface UpdateProductAdditivesDto {
  additiveIds: string[];
}

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

interface AdditiveDto {
  title: string;
  price: number;
}

export const AdditiveService = {
  // Получение всех добавок
  getAll: async (searchTerm?: string) => {
    const { data } = await api.get('/additives', {
      params: { searchTerm }
    });
    return data;
  },

  // Получение Модификаторы по ID
  getById: async (id: string) => {
    const { data } = await api.get(`/additives/${id}`);
    return data;
  },

  // Создание новой Модификаторы
  create: async (dto: AdditiveDto) => {
    const { data } = await api.post('/additives', dto);
    return data;
  },

  // Обновление Модификаторы
  update: async (id: string, dto: Partial<AdditiveDto>) => {
    const { data } = await api.patch(`/additives/${id}`, dto);
    return data;
  },

  // Удаление Модификаторы
  delete: async (id: string) => {
    const { data } = await api.delete(`/additives/${id}`);
    return data;
  },

  // Получение всех добавок для конкретного продукта
  getByProduct: async (productId: string) => {
    const { data } = await api.get(`/additives/product/${productId}`);
    return data;
  },

  // Добавление Модификаторы к продукту
  addToProduct: async (additiveId: string, productId: string) => {
    const { data } = await api.post(
      `/additives/${additiveId}/products/${productId}`
    );
    return data;
  },

  // Удаление Модификаторы из продукта
  removeFromProduct: async (additiveId: string, productId: string) => {
    const { data } = await api.delete(
      `/additives/${additiveId}/products/${productId}`
    );
    return data;
  },

  getProductAdditives: async (productId: string) => {
    const { data } = await api.get(`/additives/product/${productId}`);
    return data;
  },

  
  updateProductAdditives: async (
    productId: string,
    additiveIds: string[]
  ): Promise<Additive[]> => {
    try {
      const { data } = await api.put<Additive[]>(
        `/additives/product/${productId}`,
        { additiveIds }
      );
      return data;
    } catch (error) {
      console.error('Failed to update product additives:', error);
      throw error;
    }
  },
};