import axios from 'axios';

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

interface AdditiveDto {
  title: string;
  price: number;
}
export interface Additive {
  id?: string;
  title: string;
  price: number;
  networkId?: string | null;
  inventoryItemId?: string | null;
  ingredientQuantity?: number;
  createdAt?: Date;
  updatedAt?: Date;
  products?: any[];
  network?: any | null;
  inventoryItem?: any | null;
}

export interface AdditiveWithRelations extends Additive {
  products: any[];
  network: any | null;
  inventoryItem: any | null;
}

export interface CreateAdditiveDto {
  title: string;
  price: number;
  networkId?: string;
  inventoryItemId?: string;
}

export interface UpdateAdditiveDto {
  title?: string;
  price?: number;
  networkId?: string | null;
  inventoryItemId?: string | null;
}

export interface UpdateProductAdditivesDto {
  additiveIds: string[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages?: number;
}

export const AdditiveService = {
  // Получение всех добавок
  getAll: async (): Promise<AdditiveWithRelations[]> => {
    try {
      const { data } = await api.get<AdditiveWithRelations[]>('/additives');
      return data;
    } catch (error) {
      console.error('Failed to get all additives:', error);
      throw error;
    }
  },

  // Получение добавки по ID
  getById: async (id: string): Promise<AdditiveWithRelations | null> => {
    try {
      const { data } = await api.get<AdditiveWithRelations>(`/additives/${id}`);
      return data;
    } catch (error) {
      console.error(`Failed to get additive ${id}:`, error);
      throw error;
    }
  },

  // Создание новой добавки
  create: async (dto: CreateAdditiveDto): Promise<AdditiveWithRelations> => {
    try {
      const { data } = await api.post<AdditiveWithRelations>('/additives', dto);
      return data;
    } catch (error) {
      console.error('Failed to create additive:', error);
      throw error;
    }
  },

  // Обновление добавки
  update: async (id: string, dto: UpdateAdditiveDto): Promise<AdditiveWithRelations> => {
    try {
      const { data } = await api.patch<AdditiveWithRelations>(`/additives/${id}`, dto);
      return data;
    } catch (error) {
      console.error(`Failed to update additive ${id}:`, error);
      throw error;
    }
  },

  // Удаление добавки
  delete: async (id: string): Promise<AdditiveWithRelations> => {
    try {
      const { data } = await api.delete<AdditiveWithRelations>(`/additives/${id}`);
      return data;
    } catch (error) {
      console.error(`Failed to delete additive ${id}:`, error);
      throw error;
    }
  },

  // Получение добавок для продукта
  getByProduct: async (productId: string): Promise<AdditiveWithRelations[]> => {
    try {
      const { data } = await api.get<AdditiveWithRelations[]>(`/additives/product/${productId}`);
      return data;
    } catch (error) {
      console.error(`Failed to get additives for product ${productId}:`, error);
      throw error;
    }
  },

  // Добавление добавки к продукту
  addToProduct: async (additiveId: string, productId: string): Promise<AdditiveWithRelations> => {
    try {
      const { data } = await api.post<AdditiveWithRelations>(
        `/additives/${additiveId}/products/${productId}`
      );
      return data;
    } catch (error) {
      console.error(`Failed to add additive ${additiveId} to product ${productId}:`, error);
      throw error;
    }
  },

  // Удаление добавки из продукта
  removeFromProduct: async (additiveId: string, productId: string): Promise<AdditiveWithRelations> => {
    try {
      const { data } = await api.delete<AdditiveWithRelations>(
        `/additives/${additiveId}/products/${productId}`
      );
      return data;
    } catch (error) {
      console.error(`Failed to remove additive ${additiveId} from product ${productId}:`, error);
      throw error;
    }
  },

  // Обновление всех добавок продукта
  updateProductAdditives: async (
    productId: string,
    additiveIds: string[]
  ): Promise<AdditiveWithRelations[]> => {
    try {
      const { data } = await api.put<AdditiveWithRelations[]>(
        `/additives/product/${productId}`,
        { additiveIds }
      );
      return data;
    } catch (error) {
      console.error(`Failed to update additives for product ${productId}:`, error);
      throw error;
    }
  },

  // Получение добавок по сети
  getByNetwork: async (networkId: string): Promise<AdditiveWithRelations[]> => {
    try {
      const { data } = await api.get<AdditiveWithRelations[]>(`/additives/network/${networkId}`);
      return data;
    } catch (error) {
      console.error(`Failed to get additives for network ${networkId}:`, error);
      throw error;
    }
  },

  // Получение добавок по сети с пагинацией
  getByNetworkPaginated: async (
    networkId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<PaginatedResponse<AdditiveWithRelations>> => {
    try {
      const { data } = await api.get<PaginatedResponse<AdditiveWithRelations>>(
        `/additives/network/${networkId}/available`,
        { params: { page, limit } }
      );
      
      // Вычисляем общее количество страниц
      if (data.total && data.limit) {
        data.totalPages = Math.ceil(data.total / data.limit);
      }
      
      return data;
    } catch (error) {
      console.error(`Failed to get paginated additives for network ${networkId}:`, error);
      throw error;
    }
  },

  // Получение глобальных добавок (без сети)
  getGlobalAdditives: async (): Promise<AdditiveWithRelations[]> => {
    try {
      const { data } = await api.get<AdditiveWithRelations[]>('/additives', {
        params: { global: true } // Предполагается, что есть такой параметр в API
      });
      return data;
    } catch (error) {
      console.error('Failed to get global additives:', error);
      throw error;
    }
  },

  // Получение добавок с привязанными инвентарными товарами
  getWithInventory: async (): Promise<AdditiveWithRelations[]> => {
    try {
      const { data } = await api.get<AdditiveWithRelations[]>('/additives/with-inventory');
      return data;
    } catch (error) {
      console.error('Failed to get additives with inventory:', error);
      throw error;
    }
  },
  getByInventoryItem: async (inventoryItemId: string): Promise<AdditiveWithRelations[]> => {
    try {
      const { data } = await api.get<AdditiveWithRelations[]>(
        `/additives/inventory/${inventoryItemId}`
      );
      return data;
    } catch (error) {
      console.error(`Failed to get additives for inventory item ${inventoryItemId}:`, error);
      throw error;
    }
  },

};
