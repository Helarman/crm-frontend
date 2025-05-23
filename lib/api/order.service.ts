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

/**
 * Интерфейсы для работы с заказами
 */

export interface UpdateOrderItemDto {
  comment?: string;
  additiveIds?: string[];
}

export enum EnumOrderType {
  DINE_IN = 'DINE_IN',
  TAKEAWAY = 'TAKEAWAY',
  DELIVERY = 'DELIVERY'
}

export enum EnumPaymentMethod {
  CASH = 'CASH',
  CARD = 'CARD',
  ONLINE = 'ONLINE'
}

export interface UpdateOrderItemStatusDto {
  status: string;
  userId?: string;
  description?: string;
}

export enum OrderItemStatus {
  CREATED = 'CREATED',
  IN_PROGRESS = 'IN_PROGRESS',
  PARTIALLY_DONE = 'PARTIALLY_DONE',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED'
}

// В интерфейс OrderItemDto добавим поле status
export interface OrderItemDto {
  id: string;
  title: string;
  type?: string
  product: OrderItemProductDto;
  quantity: number;
  comment?: string;
  additives: OrderItemAdditiveDto[];
  totalPrice: number;
  status: any; // Добавляем статус для каждого блюда
  workshops: any;
  user?: { // Информация о поваре
    id: string;
    name: string;
  };
}


export enum EnumOrderStatus {
  CREATED = 'CREATED',
  CONFIRMED = 'CONFIRMED',
  PREPARING = 'PREPARING',
  READY = 'READY',
  DELIVERING = 'DELIVERING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export interface OrderItemAdditiveDto {
  id: string;
  title: string
  name: string;
  price: number;
}

export interface OrderItemProductDto {
   id: string
  title: string
  workshops: any;
  ingredients: any;
  price: number
  restaurantPrices: {
    price: number
    restaurantId: string
    isStopList: boolean
  }[]
}

export interface OrderItemDto {
  id: string;
  product: OrderItemProductDto;
  quantity: number;
  comment?: string;
  additives: OrderItemAdditiveDto[];
  totalPrice: number;
}

export interface PaymentDto {
  id: string;
  method: EnumPaymentMethod;
  amount: number;
  status: string;
  externalId?: string;
  processedAt?: Date;
}

export interface CustomerDto {
  id: string;
  name: string;
  phone: string;
  email?: string;
}

export interface RestaurantDto {
  id: string;
  name: string;
  address: string;
}

export interface DeliveryInfoDto {
  address: string;
  time?: Date;
  notes?: string;
  courier?: {
    id: string;
    name: string;
    phone: string;
  };
}

export interface CreateOrderItemDto {
  productId: string;
  quantity: number;
  comment?: string;
  additiveIds?: string[];
}

export interface CreatePaymentDto {
  method: EnumPaymentMethod;
  externalId?: string;
}

export interface CreateOrderDto {
  customerId?: string;
  restaurantId: string;
  shiftId?: string;
  type: EnumOrderType;
  items: CreateOrderItemDto[];
  scheduledAt?: Date;
  comment?: string;
  payment?: CreatePaymentDto;
  deliveryAddress?: string;
  deliveryTime?: Date;
  deliveryNotes?: string;
}

export interface UpdateOrderStatusDto {
  status: string;
}

export interface OrderResponse {
  totalAmount: number
  source: string
  tableNumber?: string;
  numberOfPeople?: string;
  id: string;
  number: number;
  status: EnumOrderStatus;
  type: EnumOrderType;
  createdAt: Date;
  updatedAt: Date;
  scheduledAt?: Date;
  comment?: string;
  
  customer?: CustomerDto;
  restaurant: RestaurantDto;
  items: OrderItemDto[];
  payment?: PaymentDto;
  delivery?: DeliveryInfoDto;
  
  totalPrice: number;
  totalItems: number;
}

export interface OrderListResponse {
  items: OrderResponse[];
  total: number;
  page: number;
  limit: number;
}

export interface OrderFilterParams {
  status?: EnumOrderStatus;
  type?: EnumOrderType;
  restaurantId?: string;
  customerId?: string;
  fromDate?: Date;
  toDate?: Date;
  page?: number;
  limit?: number;
}
export interface GetOrdersParams {
  restaurantId: string;
  status?: string; // например: 'CREATED,CONFIRMED'
}

export interface AddItemToOrderDto {
  productId: string;
  quantity: number;
  additiveIds?: string[];
  comment?: string;
}

/**
 * Сервис для работы с заказами
 */
export const OrderService = {
  /**
   * Создание нового заказа
   */
  create: async (dto: any): Promise<OrderResponse> => {
    const { data } = await api.post<OrderResponse>('/orders', dto);
    return data;
  },

  /**
   * Получение информации о заказе по ID
   */
  getById: async (id: string): Promise<OrderResponse> => {
    const { data } = await api.get<OrderResponse>(`/orders/${id}`);
    return data;
  },

  /**
   * Обновление статуса заказа
   */
  updateStatus: async (id: string, dto: UpdateOrderStatusDto): Promise<OrderResponse> => {
    
    if (typeof dto?.status !== 'string') {
      console.error('Invalid status format:', dto);
      throw new Error('Status must be a string value');
    }
  
    // Нормализация статуса
    const normalizedStatus = String(dto.status).toUpperCase();
    
    const { data } = await api.patch<OrderResponse>(
      `/orders/${id}/status`,
      { status: normalizedStatus } // Явно передаем строку
    );
    
    return data;
  },

  /**
   * Получение списка заказов с фильтрацией
   */
  getList: async (params: OrderFilterParams): Promise<OrderListResponse> => {
    const { data } = await api.get<OrderListResponse>('/orders', { params });
    return data;
  },

  /**
   * Получение заказов пользователя
   */
  getUserOrders: async (userId: string, params?: Omit<OrderFilterParams, 'customerId'>): Promise<OrderListResponse> => {
    const { data } = await api.get<OrderListResponse>(`/orders/user/${userId}`, { 
      params: { ...params, customerId: userId } 
    });
    return data;
  },

  /**
   * Получение заказов ресторана
   */

  
  getRestaurantOrders: async (restaurantId: string) => {
    try {
      const url = `/orders/restaurant/${restaurantId}`;
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      throw error;
    }
  },

  /**
   * Отмена заказа
   */
  cancel: async (id: string): Promise<OrderResponse> => {
    const { data } = await api.patch<OrderResponse>(`/orders/${id}/cancel`);
    return data;
  },

  /**
   * Повтор заказа (на основе существующего)
   */
  repeat: async (id: string): Promise<OrderResponse> => {
    const { data } = await api.post<OrderResponse>(`/orders/${id}/repeat`);
    return data;
  },
  updateOrderItem: async (
    orderId: string,
    itemId: string,
    dto: UpdateOrderItemDto
  ): Promise<OrderResponse> => {
    const { data } = await api.patch<OrderResponse>(
      `/orders/${orderId}/items/${itemId}`,
      dto
    );
    return data;
  },
  updateItemStatus: async (
    orderId: string,
    itemId: string,
    dto: UpdateOrderItemStatusDto
  ): Promise<OrderResponse> => {
    const { data } = await api.patch<OrderResponse>(
      `/orders/${orderId}/items/${itemId}/status`,
      dto
    );
    return data;
  },
  /**
   * Получение заказов для кухни (только с определенными статусами)
   */
  getKitchenOrders: async (
    restaurantId: string,
    statuses: EnumOrderStatus[] = [EnumOrderStatus.CONFIRMED, EnumOrderStatus.PREPARING]
  ): Promise<OrderListResponse> => {
    const { data } = await api.get<OrderListResponse>(
      `/orders/restaurant/${restaurantId}/kitchen`,
      { params: { statuses: statuses.join(',') } }
    );
    return data;
  },

    addItemToOrder: async (orderId: string, item: AddItemToOrderDto): Promise<OrderResponse> => {
    try {
      const { data } = await api.post<OrderResponse>(
        `/orders/${orderId}/items`,
        item
      );
      return data;
    } catch (error) {
      console.error('Failed to add item to order:', error);
      throw error;
    }
  },
  
};

