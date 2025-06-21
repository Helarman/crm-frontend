  import axios from 'axios';
  import { UserService } from './user.service';

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  const api = axios.create({
    baseURL: API_URL,
    withCredentials: true,
  });

  // Интерсепторы и вспомогательные функции остаются без изменений
  api.interceptors.request.use((config) => {
    const token = getAccessTokenFromCookie();
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
          setNewAccessToken(data.accessToken);
          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
          failedRequestsQueue.forEach(pending => pending.resolve(data.accessToken));
          return api(originalRequest);
        } catch (refreshError) {
          failedRequestsQueue.forEach(pending => pending.reject(refreshError));
          clearAuthData();
          redirectToLogin();
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
    if (typeof document === 'undefined') return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; accessToken=`);
    return parts.length === 2 ? parts.pop()?.split(';').shift() || null : null;
  }

  function setNewAccessToken(token: string) {
    document.cookie = `accessToken=${token}; path=/; max-age=3600`;
  }

  function clearAuthData() {
    document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  }

  function redirectToLogin() {
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }
  export const WarehouseService = {
    // Методы для склада
    getRestaurantWarehouse: async (restaurantId: string) => {
      const { data } = await api.get(`/warehouse/restaurant/${restaurantId}`);
      return data;
    },

    createWarehouse: async (dto: CreateWarehouseDto) => {
      const { data } = await api.post('/warehouse', dto);
      return data;
    },

    updateWarehouse: async (id: string, dto: UpdateWarehouseDto) => {
      const { data } = await api.put(`/warehouse/${id}`, dto);
      return data;
    },

    // Методы для мест хранения
    createStorageLocation: async (warehouseId: string, dto: CreateStorageLocationDto) => {
      const { data } = await api.post(`/warehouse/${warehouseId}/locations`, dto);
      return data;
    },

    updateStorageLocation: async (id: string, dto: UpdateStorageLocationDto) => {
      const { data } = await api.put(`/warehouse/locations/${id}`, dto);
      return data;
    },

    deleteStorageLocation: async (id: string) => {
      await api.delete(`/warehouse/locations/${id}`);
    },

    // Методы для позиций на складе
    createInventoryItem: async (warehouseId: string, dto: CreateInventoryItemDto) => {
      const { data } = await api.post(`/warehouse/${warehouseId}/items`, dto);
      return data;
    },

    getInventoryItemsByProduct: async (productId: string) => {
      const { data } = await api.get(`/warehouse/items/product/${productId}`);
      return data;
    },

    updateInventoryItem: async (id: string, dto: UpdateInventoryItemDto) => {
      const { data } = await api.put(`/warehouse/items/${id}`, dto);
      return data;
    },

    deleteInventoryItem: async (id: string) => {
      await api.delete(`/warehouse/items/${id}`);
    },

    // Методы для операций с количеством
    receiveInventory: async (itemId: string, dto: InventoryTransactionDto) => {
      const { data } = await api.post(`/warehouse/items/${itemId}/receive`, dto);
      return data;
    },

    writeOffInventory: async (itemId: string, dto: InventoryTransactionDto) => {
      const { data } = await api.post(`/warehouse/items/${itemId}/write-off`, dto);
      return data;
    },

    bulkReceiveInventory: async (items: BulkInventoryTransactionDto) => {
      const { data } = await api.post('/warehouse/items/bulk/receive', items);
      return data;
    },

    bulkWriteOffInventory: async (items: BulkInventoryTransactionDto) => {
      const { data } = await api.post('/warehouse/items/bulk/write-off', items);
      return data;
    },

    // Методы для получения истории операций
    getInventoryItemTransactions: async (itemId: string) => {
      const { data } = await api.get(`/warehouse/items/${itemId}/transactions`);
      return data;
    },
     updateItemQuantity: async (itemId: string, quantity: number) => {
    const { data } = await api.patch(`/warehouse/items/${itemId}/quantity`, { quantity });
    return data;
    },
    getInventoryItems: async (): Promise<WarehouseItem[]> => {
      const { data } = await api.get('/warehouse/items');
      return data;
    },
  };

  export interface WarehouseItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  storageLocation?: {
    id: string;
    name: string;
    code: string;
  };
  product?: {
    id: string;
    title: string;
  };
}

export interface StorageLocation {
  id: string;
  name: string;
  code: string;
  description?: string;
}

export interface InventoryTransaction {
  id: string;
  type: 'RECEIPT' | 'WRITE_OFF';
  quantity: number;
  reason?: string;
  createdAt: string;
  user?: {
    id: string;
    name: string;
  };
}
  // Типы для DTO
  interface CreateWarehouseDto {
    restaurantId: string;
    name: string;
    description?: string;
  }

  interface UpdateWarehouseDto {
    name?: string;
    description?: string;
    isActive?: boolean;
  }

  interface CreateStorageLocationDto {
    name: string;
    code?: string;
    description?: string;
  }

  interface UpdateStorageLocationDto {
    name?: string;
    code?: string;
    description?: string;
    isActive?: boolean;
  }

  interface CreateInventoryItemDto {
    name: string;
    description?: string;
    unit: string;
    quantity?: number;
    minQuantity?: number;
    cost?: number;
    storageLocationId?: string | null;
    productId?: string;
  }

  interface UpdateInventoryItemDto {
    name?: string;
    description?: string;
    unit?: string;
    minQuantity?: number;
    cost?: number;
    storageLocationId?: string;
    productId?: string;
    isActive?: boolean;
  }

  interface InventoryTransactionDto {
    quantity: number;
    reason?: string;
    documentId?: string;
    userId?: string;
  }

  interface BulkInventoryTransactionDto {
    items: Array<{
      id: string;
      quantity: number;
      reason?: string;
      documentId?: string;
    }>;
    userId?: string;
  }