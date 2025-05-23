
import axios from 'axios';
import { EnumPaymentMethod } from './order.service';

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

export interface Payment {
  id: string;
  orderId: string;
  amount: number;
  method: 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'OTHER';
  status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  transactionId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePaymentDto {
  orderId: string;
  amount: number;
  method: 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'OTHER';
  transactionId?: string;
}

export interface UpdatePaymentDto {
  status?: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  transactionId?: string;
}

export const PaymentService = {
  /**
   * Создать новый платеж
   * @param dto Данные для создания платежа
   * @returns Созданный платеж
   */
  create: async (dto: CreatePaymentDto): Promise<Payment> => {
    try {
      const { data } = await api.post<Payment>('/payments', dto);
      return data;
    } catch (error) {
      console.error('Failed to create payment:', error);
      throw error;
    }
  },

  /**
   * Получить все платежи
   * @returns Список платежей
   */
  findAll: async (): Promise<Payment[]> => {
    try {
      const { data } = await api.get<Payment[]>('/payments');
      return data;
    } catch (error) {
      console.error('Failed to fetch payments:', error);
      throw error;
    }
  },

  /**
   * Получить платеж по ID
   * @param id ID платежа
   * @returns Найденный платеж
   */
  findOne: async (id: string): Promise<Payment> => {
    try {
      const { data } = await api.get<Payment>(`/payments/${id}`);
      return data;
    } catch (error) {
      console.error(`Failed to fetch payment with id ${id}:`, error);
      throw error;
    }
  },

  /**
   * Обновить платеж
   * @param id ID платежа
   * @param dto Данные для обновления
   * @returns Обновленный платеж
   */
  update: async (id: string, dto: UpdatePaymentDto): Promise<Payment> => {
    try {
      const { data } = await api.patch<Payment>(`/payments/${id}`, dto);
      return data;
    } catch (error) {
      console.error(`Failed to update payment with id ${id}:`, error);
      throw error;
    }
  },

  /**
   * Получить платежи по заказу
   * @param orderId ID заказа
   * @returns Список платежей для заказа
   */
  findByOrder: async (orderId: string): Promise<Payment[]> => {
    try {
      const { data } = await api.get<Payment[]>(`/payments/order/${orderId}`);
      return data;
    } catch (error) {
      console.error(`Failed to fetch payments for order ${orderId}:`, error);
      throw error;
    }
  },

  /**
   * Получить платежи по статусу
   * @param status Статус платежа
   * @returns Список платежей с указанным статусом
   */
  findByStatus: async (status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED'): Promise<Payment[]> => {
    try {
      const { data } = await api.get<Payment[]>(`/payments/status/${status}`);
      return data;
    } catch (error) {
      console.error(`Failed to fetch payments with status ${status}:`, error);
      throw error;
    }
  },

  /**
   * Получить платежи по методу оплаты
   * @param method Метод оплаты
   * @returns Список платежей с указанным методом
   */
  findByMethod: async (method: 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'OTHER'): Promise<Payment[]> => {
    try {
      const { data } = await api.get<Payment[]>(`/payments/method/${method}`);
      return data;
    } catch (error) {
      console.error(`Failed to fetch payments with method ${method}:`, error);
      throw error;
    }
  },

  /**
   * Получить статистику по платежам
   * @param startDate Начальная дата (опционально)
   * @param endDate Конечная дата (опционально)
   * @returns Статистика платежей
   */
  getStatistics: async (startDate?: string, endDate?: string): Promise<{
    total: number;
    completed: number;
    pending: number;
    failed: number;
    refunded: number;
    byMethod: Record<string, number>;
  }> => {
    try {
      const { data } = await api.get('/payments/statistics', {
        params: { startDate, endDate }
      });
      return data;
    } catch (error) {
      console.error('Failed to fetch payment statistics:', error);
      throw error;
    }
  },

    updateAmount: async (id: string, newAmount: number): Promise<Payment> => {
    try {
      const { data } = await api.patch<Payment>(`/payments/${id}/amount`, { amount: newAmount });
      return data;
    } catch (error) {
      console.error(`Failed to update amount for payment ${id}:`, error);
      throw error;
    }
  },
    updateMethod: async (id: string, newMethod: EnumPaymentMethod): Promise<Payment> => {
    try {
      const { data } = await api.patch<Payment>(`/payments/${id}/method`, { method: newMethod });
      return data;
    } catch (error) {
      console.error(`Failed to update method for payment ${id}:`, error);
      throw error;
    }
  }

};