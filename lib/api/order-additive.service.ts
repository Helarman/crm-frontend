import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

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

// Типы данных
export enum OrderAdditiveType {
  FIXED = 'FIXED',
PER_PERSON = 'PER_PERSON'
}

export enum EnumOrderType {
  DINE_IN = 'DINE_IN',
  TAKEAWAY = 'TAKEAWAY',
  DELIVERY = 'DELIVERY',
  BANQUET = 'BANQUET'
}

export interface OrderAdditive {
  id?: string;
  title: string;
  description?: string;
  price: number;
  type: OrderAdditiveType;
  orderTypes: EnumOrderType[];
  inventoryItemId?: string;
  ingredientQuantity?: number;
  networkId?: string;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  orders?: any[];
  network?: any | null;
  inventoryItem?: any | null;
}

export interface OrderAdditiveWithRelations extends OrderAdditive {
  orders: any[];
  network: any | null;
  inventoryItem: any | null;
  
}

export interface CreateOrderAdditiveDto {
  title: string;
  description?: string;
  price: number;
  type?: OrderAdditiveType;
  orderTypes: EnumOrderType[];
  inventoryItemId?: string;
  ingredientQuantity?: number;
  networkId?: string;
  isActive?: boolean;
}

export interface UpdateOrderAdditiveDto {
  title?: string;
  description?: string;
  price?: number;
  type?: OrderAdditiveType;
  orderTypes?: EnumOrderType[];
  inventoryItemId?: string | null;
  ingredientQuantity?: number;
  networkId?: string | null;
  isActive?: boolean;
}

export interface UpdateOrderAdditivesDto {
  orderAdditiveIds: string[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages?: number;
}

export interface FilterOptions {
  orderType?: EnumOrderType;
  isActive?: boolean;
  type?: OrderAdditiveType;
}

export const OrderAdditiveService = {
  // Получение всех модификаторов заказов с фильтрацией
  getAll: async (
    networkId?: string,
    orderType?: EnumOrderType,
    isActive?: boolean,
    type?: OrderAdditiveType
  ): Promise<OrderAdditiveWithRelations[]> => {
    try {
      const params: Record<string, any> = {};
      if (networkId) params.networkId = networkId;
      if (orderType) params.orderType = orderType;
      if (isActive !== undefined) params.isActive = isActive;
      if (type) params.type = type;

      const { data } = await api.get<OrderAdditiveWithRelations[]>('/order-additives', { params });
      return data;
    } catch (error) {
      console.error('Failed to get all order additives:', error);
      throw error;
    }
  },

  // Получение модификатора заказа по ID
  getById: async (id: string): Promise<OrderAdditiveWithRelations | null> => {
    try {
      const { data } = await api.get<OrderAdditiveWithRelations>(`/order-additives/${id}`);
      return data;
    } catch (error) {
      console.error(`Failed to get order additive ${id}:`, error);
      throw error;
    }
  },

  // Создание нового модификатора заказа
  create: async (dto: CreateOrderAdditiveDto): Promise<OrderAdditiveWithRelations> => {
    try {
      const { data } = await api.post<OrderAdditiveWithRelations>('/order-additives', dto);
      return data;
    } catch (error) {
      console.error('Failed to create order additive:', error);
      throw error;
    }
  },

  // Обновление модификатора заказа
  update: async (id: string, dto: UpdateOrderAdditiveDto): Promise<OrderAdditiveWithRelations> => {
    try {
      const { data } = await api.patch<OrderAdditiveWithRelations>(`/order-additives/${id}`, dto);
      return data;
    } catch (error) {
      console.error(`Failed to update order additive ${id}:`, error);
      throw error;
    }
  },

  // Удаление модификатора заказа
  delete: async (id: string): Promise<OrderAdditiveWithRelations> => {
    try {
      const { data } = await api.delete<OrderAdditiveWithRelations>(`/order-additives/${id}`);
      return data;
    } catch (error) {
      console.error(`Failed to delete order additive ${id}:`, error);
      throw error;
    }
  },

  // Получение модификаторов для конкретного заказа
  getByOrder: async (orderId: string): Promise<OrderAdditiveWithRelations[]> => {
    try {
      const { data } = await api.get<OrderAdditiveWithRelations[]>(`/order-additives/order/${orderId}`);
      return data;
    } catch (error) {
      console.error(`Failed to get additives for order ${orderId}:`, error);
      throw error;
    }
  },

  // Добавление модификатора к заказу
  addToOrder: async (
    orderAdditiveId: string,
    orderId: string,
    quantity: number = 1
  ): Promise<OrderAdditiveWithRelations> => {
    try {
      const { data } = await api.post<OrderAdditiveWithRelations>(
        `/order-additives/${orderAdditiveId}/orders/${orderId}`,
        {},
        { params: { quantity } }
      );
      return data;
    } catch (error) {
      console.error(`Failed to add order additive ${orderAdditiveId} to order ${orderId}:`, error);
      throw error;
    }
  },

  // Удаление модификатора из заказа
  removeFromOrder: async (
    orderAdditiveId: string,
    orderId: string
  ): Promise<OrderAdditiveWithRelations> => {
    try {
      const { data } = await api.delete<OrderAdditiveWithRelations>(
        `/order-additives/${orderAdditiveId}/orders/${orderId}`
      );
      return data;
    } catch (error) {
      console.error(`Failed to remove order additive ${orderAdditiveId} from order ${orderId}:`, error);
      throw error;
    }
  },

  // Обновление всех модификаторов заказа
  updateOrderAdditives: async (
    orderId: string,
    orderAdditiveIds: string[]
  ): Promise<OrderAdditiveWithRelations[]> => {
    try {
      const { data } = await api.put<OrderAdditiveWithRelations[]>(
        `/order-additives/order/${orderId}`,
        { orderAdditiveIds }
      );
      return data;
    } catch (error) {
      console.error(`Failed to update additives for order ${orderId}:`, error);
      throw error;
    }
  },

  // Получение модификаторов по сети
  getByNetwork: async (networkId: string): Promise<OrderAdditiveWithRelations[]> => {
    try {
      const { data } = await api.get<OrderAdditiveWithRelations[]>(`/order-additives/network/${networkId}`);
      return data;
    } catch (error) {
      console.error(`Failed to get order additives for network ${networkId}:`, error);
      throw error;
    }
  },

  // Получение модификаторов по сети с пагинацией и фильтрацией
  getByNetworkPaginated: async (
    networkId: string,
    page: number = 1,
    limit: number = 10,
    filters?: FilterOptions
  ): Promise<PaginatedResponse<OrderAdditiveWithRelations>> => {
    try {
      const params: Record<string, any> = { page, limit };
      if (filters?.orderType) params.orderType = filters.orderType;
      if (filters?.isActive !== undefined) params.isActive = filters.isActive;
      if (filters?.type) params.type = filters.type;

      const { data } = await api.get<PaginatedResponse<OrderAdditiveWithRelations>>(
        `/order-additives/network/${networkId}/available`,
        { params }
      );
      
      if (data.total && data.limit) {
        data.totalPages = Math.ceil(data.total / data.limit);
      }
      
      return data;
    } catch (error) {
      console.error(`Failed to get paginated order additives for network ${networkId}:`, error);
      throw error;
    }
  },

  // Получение модификаторов по типу заказа
  getByOrderType: async (
    orderType: EnumOrderType,
    networkId?: string
  ): Promise<OrderAdditiveWithRelations[]> => {
    try {
      const url = networkId 
        ? `/order-additives/order-type/${orderType}/network/${networkId}`
        : `/order-additives/order-type/${orderType}`;
      
      const params = networkId ? { networkId } : {};
      
      const { data } = await api.get<OrderAdditiveWithRelations[]>(url, { params });
      return data;
    } catch (error) {
      console.error(`Failed to get order additives for type ${orderType}:`, error);
      throw error;
    }
  },

  // Получение модификаторов с привязанными инвентарными товарами
  getWithInventory: async (): Promise<OrderAdditiveWithRelations[]> => {
    try {
      const { data } = await api.get<OrderAdditiveWithRelations[]>('/order-additives/with-inventory');
      return data;
    } catch (error) {
      console.error('Failed to get order additives with inventory:', error);
      throw error;
    }
  },

  // Получение модификаторов по инвентарному товару
  getByInventoryItem: async (inventoryItemId: string): Promise<OrderAdditiveWithRelations[]> => {
    try {
      const { data } = await api.get<OrderAdditiveWithRelations[]>(
        `/order-additives/inventory/${inventoryItemId}`
      );
      return data;
    } catch (error) {
      console.error(`Failed to get order additives for inventory item ${inventoryItemId}:`, error);
      throw error;
    }
  },

};