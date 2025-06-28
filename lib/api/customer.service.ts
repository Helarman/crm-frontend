import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export interface Additive {
  id?: string;
  title: string;
  price: number;
}

export interface PaginatedCustomersResponse {
  data: CustomerDto[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
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

export interface CustomerDto {
  id: string;
  phone: string;
  createdAt?: Date;
  bonusPoints?: number;
  personalDiscount?: number;
  shortCode?: string;
  shortCodeExpires?: Date;
}

export const CustomerService = {
  getCustomerByPhone: async (phone: string): Promise<CustomerDto> => {
   const { data } = await api.get<CustomerDto>(`/customer-verification/customer/${phone}`);
      return data;
  },

 createCustomer: async (customerData: Omit<CustomerDto, 'id'>): Promise<CustomerDto> => {
    try {
      const { data } = await api.post<CustomerDto>('/customer-verification/request-code', customerData);
      return data;
    } catch (error) {
      console.error('Failed to create customer:', error);
      throw error;
    }
  },

  getAllCustomers: async (
    page: number = 1,
    limit: number = 10
  ): Promise<{
    data: CustomerDto[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> => {
    try {
      const { data } = await api.get('/customer-verification/customers', {
        params: {
          page,
          limit
        }
      });
      return data;
    } catch (error) {
      console.error('Failed to fetch customers:', error);
      throw error;
    }
  },
  updateBonusPoints: async (customerId: string, bonusPoints: number): Promise<CustomerDto> => {
    try {
      const { data } = await api.patch<CustomerDto>(
        `/customer-verification/customer/${customerId}/bonus-points`,
        { bonusPoints }
      );
      return data;
    } catch (error) {
      console.error('Failed to update bonus points:', error);
      throw error;
    }
  },

  incrementBonusPoints: async (customerId: string, points: number): Promise<CustomerDto> => {
    try {
      const { data } = await api.patch<CustomerDto>(
        `/customer-verification/customer/${customerId}/bonus-points/increment`,
        { points }
      );
      return data;
    } catch (error) {
      console.error('Failed to increment bonus points:', error);
      throw error;
    }
  },

  // Получение информации о клиенте по 4-символьному коду
  getCustomerByShortCode: async (shortCode: string): Promise<CustomerDto> => {
    try {
      const { data } = await api.get<CustomerDto>(`/customer-verification/short-code/${shortCode}`);
      return data;
    } catch (error) {
      console.error('Failed to get customer by short code:', error);
      throw error;
    }
  },

  // Генерация нового 4-символьного кода для клиента
  generateShortCode: async (customerId: string): Promise<{ shortCode: string; shortCodeExpires: Date }> => {
    try {
      const { data } = await api.post<{ shortCode: string; shortCodeExpires: Date }>(
        `/customer-verification/customer/${customerId}/short-code`
      );
      return data;
    } catch (error) {
      console.error('Failed to generate short code:', error);
      throw error;
    }
  },

  // Получение текущего размера персональной скидки
  getPersonalDiscount: async (customerId: string): Promise<number> => {
    try {
      const { data } = await api.get<CustomerDto>(`/customer-verification/customer/${customerId}`);
      return data.personalDiscount || 0;
    } catch (error) {
      console.error('Failed to get personal discount:', error);
      throw error;
    }
  },

  updatePersonalDiscount: async (customerId: string, discount: number): Promise<CustomerDto> => {
    try {
      const { data } = await api.patch<CustomerDto>(
        `/customer-verification/customer/${customerId}/personal-discount`,
        { discount }
      );
      return data;
    } catch (error) {
      console.error('Failed to update personal discount:', error);
      throw error;
    }
  },

  incrementPersonalDiscount: async (customerId: string, increment: number): Promise<CustomerDto> => {
    try {
      const currentDiscount = await CustomerService.getPersonalDiscount(customerId);
      const newDiscount = Math.min(100, Math.max(0, currentDiscount + increment));
      return await CustomerService.updatePersonalDiscount(customerId, newDiscount);
    } catch (error) {
      console.error('Failed to increment personal discount:', error);
      throw error;
    }
  },

  decrementPersonalDiscount: async (customerId: string, decrement: number): Promise<CustomerDto> => {
    try {
      const currentDiscount = await CustomerService.getPersonalDiscount(customerId);
      const newDiscount = Math.min(100, Math.max(0, currentDiscount - decrement));
      return await CustomerService.updatePersonalDiscount(customerId, newDiscount);
    } catch (error) {
      console.error('Failed to decrement personal discount:', error);
      throw error;
    }
  }

};