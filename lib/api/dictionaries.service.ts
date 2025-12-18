import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export interface DictionaryItem {
  id: string;
  name: string;
  isActive: boolean;
  restaurantId: string;
  createdAt: string;
  updatedAt: string;
  restaurant?: {
    id: string;
    title: string;
  };
}

export interface CreateDictionaryDto {
  name: string;
  isActive?: boolean;
  restaurantId: string;
}

export interface UpdateDictionaryDto extends Partial<CreateDictionaryDto> {}

export interface CopyDictionaryDto {
  sourceRestaurantId: string;
  targetRestaurantId: string;
  overwrite?: boolean;
}

export interface CopyResult {
  message: string;
  results: {
    writeOffReasons: { copied: number; skipped: number };
    receiptReasons: { copied: number; skipped: number };
    movementReasons: { copied: number; skipped: number };
    incomeReasons: { copied: number; skipped: number };
    expenseReasons: { copied: number; skipped: number };
  };
}

export interface Restaurant {
  id: string;
  title: string;
  address: string;
  isActive: boolean;
}

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

export const DictionariesService = {
  // Причины списания
  writeOffReasons: {
    getAll: async (restaurantId?: string): Promise<DictionaryItem[]> => {
      const params = restaurantId ? { restaurantId } : {};
      const { data } = await api.get('/dictionaries/write-off-reasons', { params });
      return data;
    },

    getById: async (id: string): Promise<DictionaryItem> => {
      const { data } = await api.get(`/dictionaries/write-off-reasons/${id}`);
      return data;
    },

    create: async (dto: CreateDictionaryDto): Promise<DictionaryItem> => {
      const { data } = await api.post('/dictionaries/write-off-reasons', dto);
      return data;
    },

    update: async (id: string, dto: UpdateDictionaryDto): Promise<DictionaryItem> => {
      const { data } = await api.put(`/dictionaries/write-off-reasons/${id}`, dto);
      return data;
    },

    delete: async (id: string): Promise<DictionaryItem> => {
      const { data } = await api.delete(`/dictionaries/write-off-reasons/${id}`);
      return data;
    },
  },

  // Причины прихода
  receiptReasons: {
    getAll: async (restaurantId?: string): Promise<DictionaryItem[]> => {
      const params = restaurantId ? { restaurantId } : {};
      const { data } = await api.get('/dictionaries/receipt-reasons', { params });
      return data;
    },

    getById: async (id: string): Promise<DictionaryItem> => {
      const { data } = await api.get(`/dictionaries/receipt-reasons/${id}`);
      return data;
    },

    create: async (dto: CreateDictionaryDto): Promise<DictionaryItem> => {
      const { data } = await api.post('/dictionaries/receipt-reasons', dto);
      return data;
    },

    update: async (id: string, dto: UpdateDictionaryDto): Promise<DictionaryItem> => {
      const { data } = await api.put(`/dictionaries/receipt-reasons/${id}`, dto);
      return data;
    },

    delete: async (id: string): Promise<DictionaryItem> => {
      const { data } = await api.delete(`/dictionaries/receipt-reasons/${id}`);
      return data;
    },
  },

  // Причины перемещения
  movementReasons: {
    getAll: async (restaurantId?: string): Promise<DictionaryItem[]> => {
      const params = restaurantId ? { restaurantId } : {};
      const { data } = await api.get('/dictionaries/movement-reasons', { params });
      return data;
    },

    getById: async (id: string): Promise<DictionaryItem> => {
      const { data } = await api.get(`/dictionaries/movement-reasons/${id}`);
      return data;
    },

    create: async (dto: CreateDictionaryDto): Promise<DictionaryItem> => {
      const { data } = await api.post('/dictionaries/movement-reasons', dto);
      return data;
    },

    update: async (id: string, dto: UpdateDictionaryDto): Promise<DictionaryItem> => {
      const { data } = await api.put(`/dictionaries/movement-reasons/${id}`, dto);
      return data;
    },

    delete: async (id: string): Promise<DictionaryItem> => {
      const { data } = await api.delete(`/dictionaries/movement-reasons/${id}`);
      return data;
    },
  },

  // Причины доходов
  incomeReasons: {
    getAll: async (restaurantId?: string): Promise<DictionaryItem[]> => {
      const params = restaurantId ? { restaurantId } : {};
      const { data } = await api.get('/dictionaries/income-reasons', { params });
      return data;
    },

    getById: async (id: string): Promise<DictionaryItem> => {
      const { data } = await api.get(`/dictionaries/income-reasons/${id}`);
      return data;
    },

    create: async (dto: CreateDictionaryDto): Promise<DictionaryItem> => {
      const { data } = await api.post('/dictionaries/income-reasons', dto);
      return data;
    },

    update: async (id: string, dto: UpdateDictionaryDto): Promise<DictionaryItem> => {
      const { data } = await api.put(`/dictionaries/income-reasons/${id}`, dto);
      return data;
    },

    delete: async (id: string): Promise<DictionaryItem> => {
      const { data } = await api.delete(`/dictionaries/income-reasons/${id}`);
      return data;
    },
  },

  // Причины расходов
  expenseReasons: {
    getAll: async (restaurantId?: string): Promise<DictionaryItem[]> => {
      const params = restaurantId ? { restaurantId } : {};
      const { data } = await api.get('/dictionaries/expense-reasons', { params });
      return data;
    },

    getById: async (id: string): Promise<DictionaryItem> => {
      const { data } = await api.get(`/dictionaries/expense-reasons/${id}`);
      return data;
    },

    create: async (dto: CreateDictionaryDto): Promise<DictionaryItem> => {
      const { data } = await api.post('/dictionaries/expense-reasons', dto);
      return data;
    },

    update: async (id: string, dto: UpdateDictionaryDto): Promise<DictionaryItem> => {
      const { data } = await api.put(`/dictionaries/expense-reasons/${id}`, dto);
      return data;
    },

    delete: async (id: string): Promise<DictionaryItem> => {
      const { data } = await api.delete(`/dictionaries/expense-reasons/${id}`);
      return data;
    },
  },

  // Копирование между ресторанами
  copy: {
    allReasons: async (copyDto: CopyDictionaryDto): Promise<CopyResult> => {
      const { data } = await api.post('/dictionaries/copy-between-restaurants', copyDto);
      return data;
    },

    specificReasons: async (
      type: 'writeOff' | 'receipt' | 'movement' | 'income' | 'expense',
      copyDto: CopyDictionaryDto
    ): Promise<{ message: string; result: { copied: number; skipped: number } }> => {
      const { data } = await api.post(`/dictionaries/copy-specific-reasons/${type}`, copyDto);
      return data;
    },
  },

  // Получение всех справочников для ресторана
  getRestaurantReasons: async (restaurantId: string): Promise<{
    writeOffReasons: DictionaryItem[];
    receiptReasons: DictionaryItem[];
    movementReasons: DictionaryItem[];
    incomeReasons: DictionaryItem[];
    expenseReasons: DictionaryItem[];
  }> => {
    const { data } = await api.get(`/dictionaries/restaurants/${restaurantId}/reasons`);
    return data;
  },

  // Вспомогательные методы для работы с ресторанами
  restaurants: {
    getAll: async (): Promise<Restaurant[]> => {
      const { data } = await api.get('/restaurants');
      return data;
    },

    getById: async (id: string): Promise<Restaurant> => {
      const { data } = await api.get(`/restaurants/${id}`);
      return data;
    },
  },
};

// Вспомогательные функции для работы со справочниками
export const DictionaryUtils = {
  // Фильтрация активных записей
  getActiveItems: (items: DictionaryItem[]): DictionaryItem[] => {
    return items.filter(item => item.isActive);
  },

  // Группировка по ресторанам
  groupByRestaurant: (items: DictionaryItem[]): Record<string, DictionaryItem[]> => {
    return items.reduce((acc, item) => {
      const restaurantId = item.restaurantId;
      if (!acc[restaurantId]) {
        acc[restaurantId] = [];
      }
      acc[restaurantId].push(item);
      return acc;
    }, {} as Record<string, DictionaryItem[]>);
  },

  // Поиск по имени
  findByName: (items: DictionaryItem[], name: string): DictionaryItem | undefined => {
    return items.find(item => item.name.toLowerCase() === name.toLowerCase());
  },

  // Проверка существования имени в ресторане
  isNameExists: (items: DictionaryItem[], name: string, restaurantId: string): boolean => {
    return items.some(item => 
      item.name.toLowerCase() === name.toLowerCase() && 
      item.restaurantId === restaurantId
    );
  },
};

export default DictionariesService;