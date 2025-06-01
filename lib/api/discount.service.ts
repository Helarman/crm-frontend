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

export interface CreateDiscountDto {
  title: string;
  description?: string;
  type: 'PERCENTAGE' | 'FIXED';
  value: number;
  targetType: 'ALL' | 'RESTAURANT' | 'CATEGORY' | 'PRODUCT' | 'ORDER_TYPE';
  minOrderAmount?: number;
  restaurants?: { restaurantId: string }[];
  categories?: { categoryId: string }[];
  products?: { productId: string }[];
  orderTypes: ('DINE_IN' | 'TAKEAWAY' | 'DELIVERY' | 'BANQUET')[];
  daysOfWeek?: number[];
  code?: string;
  maxUses?: number;
  startDate?: Date;
  
  endDate?: Date;
  isActive?: boolean;
}

export interface UpdateDiscountDto extends Partial<CreateDiscountDto> {}

export interface DiscountResponseDto {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  title: string;
  description?: string;
  type: 'PERCENTAGE' | 'FIXED';
  value: number;
  targetType: 'ALL' | 'RESTAURANT' | 'CATEGORY' | 'PRODUCT' | 'ORDER_TYPE';
  minOrderAmount?: number;
  orderTypes: ('DINE_IN' | 'TAKEAWAY' | 'DELIVERY' | 'BANQUET')[];
  daysOfWeek: number[];
  isActive: boolean;
  code?: string;
  maxUses?: number;
  currentUses: number;
  startDate?: Date;
  endDate?: Date;
  restaurants?: {
    restaurant: {
      id: string;
      title: string;
    };
  }[];
  categories?: {
    category: {
      id: string;
      title: string;
    };
  }[];
  products?: {
    product: {
      id: string;
      title: string;
    };
  }[];
}

export const DiscountService = {
  create: async (dto: CreateDiscountDto): Promise<DiscountResponseDto> => {
    try {
      const { data } = await axios.post<DiscountResponseDto>(`${API_URL}/discounts`, dto);
      return data;
    } catch (error) {
      console.error('Failed to create discount:', error);
      throw error;
    }
  },

  /**
   * Получение всех скидок
   */
  getAll: async (): Promise<DiscountResponseDto[]> => {
    try {
      const { data } = await axios.get<DiscountResponseDto[]>(`${API_URL}/discounts`);
      return data;
    } catch (error) {
      console.error('Failed to fetch discounts:', error);
      throw error;
    }
  },

  /**
   * Получение скидки по ID
   */
  getById: async (id: string): Promise<DiscountResponseDto> => {
    try {
      const { data } = await axios.get<DiscountResponseDto>(`${API_URL}/discounts/${id}`);
      return data;
    } catch (error) {
      console.error(`Failed to fetch discount with ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Получение скидки по коду
   */
  getByCode: async (code: string): Promise<DiscountResponseDto> => {
    try {
      const { data } = await axios.get<DiscountResponseDto>(`${API_URL}/discounts/code/${code}`);
      return data;
    } catch (error) {
      console.error(`Failed to fetch discount with code ${code}:`, error);
      throw error;
    }
  },

  /**
   * Получение скидок для ресторана
   */
  getByRestaurant: async (restaurantId: string): Promise<DiscountResponseDto[]> => {
    try {
      const { data } = await axios.get<DiscountResponseDto[]>(
        `${API_URL}/discounts/restaurant/${restaurantId}`
      );
      return data;
    } catch (error) {
      console.error(`Failed to fetch discounts for restaurant ${restaurantId}:`, error);
      throw error;
    }
  },

  /**
   * Получение активных скидок
   */
  getActiveDiscounts: async (): Promise<DiscountResponseDto[]> => {
    try {
      const { data } = await axios.get<DiscountResponseDto[]>(
        `${API_URL}/discounts/active`
      );
      return data;
    } catch (error) {
      console.error('Failed to fetch active discounts:', error);
      throw error;
    }
  },

  /**
   * Применение скидки к заказу
   */
  applyToOrder: async (
    discountId: string,
    orderId: string,
    customerId?: string
  ): Promise<{ discountAmount: number }> => {
    try {
      const { data } = await axios.post<{ discountAmount: number }>(
        `${API_URL}/discounts/${discountId}/apply/${orderId}`,
        { customerId }
      );
      return data;
    } catch (error) {
      console.error(`Failed to apply discount ${discountId} to order ${orderId}:`, error);
      throw error;
    }
  },

  /**
   * Генерация промокода для клиента
   */
  generatePromoCode: async (discountId: string, customerId: string): Promise<string> => {
    try {
      const { data } = await axios.post<{ code: string }>(
        `${API_URL}/discounts/${discountId}/generate-code`,
        { customerId }
      );
      return data.code;
    } catch (error) {
      console.error(`Failed to generate promo code for discount ${discountId}:`, error);
      throw error;
    }
  },

  /**
   * Получение промокодов клиента
   */
  getCustomerPromoCodes: async (customerId: string): Promise<DiscountResponseDto[]> => {
    try {
      const { data } = await axios.get<DiscountResponseDto[]>(
        `${API_URL}/discounts/customer/${customerId}/promocodes`
      );
      return data;
    } catch (error) {
      console.error(`Failed to fetch promocodes for customer ${customerId}:`, error);
      throw error;
    }
  },

  /**
   * Обновление скидки
   */
  update: async (
    id: string,
    dto: UpdateDiscountDto
  ): Promise<DiscountResponseDto> => {
    try {
      const { data } = await api.put<DiscountResponseDto>(
        `/discounts/${id}`,
        dto
      );
      return data;
    } catch (error) {
      console.error(`Failed to update discount with ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Удаление скидки
   */
  delete: async (id: string): Promise<void> => {
    try {
      await api.delete(`/discounts/${id}`);
    } catch (error) {
      console.error(`Failed to delete discount with ID ${id}:`, error);
      throw error;
    }
  },
   /**
   * Получение скидок для конкретных продуктов
   */
  getForProducts: async (productIds: string[]): Promise<DiscountResponseDto[]> => {
    try {
      const { data } = await axios.post<DiscountResponseDto[]>(
        `${API_URL}/discounts/for-products`,
        { productIds }
      );
      return data;
    } catch (error) {
      console.error('Failed to fetch discounts for products:', error);
      throw error;
    }
  },

  /**
   * Получение скидок для конкретных категорий
   */
  getForCategories: async (categoryIds: string[]): Promise<DiscountResponseDto[]> => {
    try {
      const { data } = await axios.post<DiscountResponseDto[]>(
        `${API_URL}/discounts/for-categories`,
        { categoryIds }
      );
      return data;
    } catch (error) {
      console.error('Failed to fetch discounts for categories:', error);
      throw error;
    }
  },

  /**
   * Проверка минимальной суммы для скидки
   */
  checkMinAmount: async (discountId: string, amount: number): Promise<boolean> => {
    try {
      const { data } = await axios.get<{ isValid: boolean }>(
        `${API_URL}/discounts/${discountId}/check-min-amount?amount=${amount}`
      );
      return data.isValid;
    } catch (error) {
      console.error(`Failed to check min amount for discount ${discountId}:`, error);
      throw error;
    }
  }
};