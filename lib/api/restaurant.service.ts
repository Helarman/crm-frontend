import axios from 'axios';
import { UserService} from '@/lib/api/user.service'

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

export interface CreateRestaurantDto {
  name: string;
  description?: string;
  address: string;
}

interface AddUserDto {
  userId: string;
}

interface AddProductDto {
  productId: string;
}

export const RestaurantService = {
  // Рестораны
  getAll: async () => {
    const { data } = await api.get('/restaurants');
    return data;
  },

  getById: async (id: string) => {
    const { data } = await api.get(`/restaurants/by-id/${id}`);
    return data;
  },

  create: async (dto: CreateRestaurantDto & { networkId: string }) => {
    const { data } = await api.post('/restaurants', dto);
    return data;
  },

  update: async (id: string, dto: CreateRestaurantDto) => {
    const { data } = await api.put(`/restaurants/${id}`, dto);
    return data;
  },

  delete: async (id: string) => {
    const { data } = await api.delete(`/restaurants/${id}`);
    return data;
  },

  // Пользователи ресторана
  getUsers: async (restaurantId: string) => {
    const { data } = await api.get(`/restaurants/${restaurantId}/users`);
    return data;
  },

  addUser: async (restaurantId: string, dto: AddUserDto) => {
    const { data } = await api.post(`/restaurants/${restaurantId}/users`, dto);
    return data;
  },

  addUserByEmail: async (restaurantId: string, dto: { email: string }) => {
    const user = await UserService.getByEmail(dto.email);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    const { data } = await api.post(`/restaurants/${restaurantId}/users`, { 
      userId: user.id,
    });
    
    return data;
  },
  
  removeUser: async (restaurantId: string, userId: string) => {
    const { data } = await api.delete(`/restaurants/${restaurantId}/users/${userId}`);
    return data;
  },

  // Продукты ресторана
  getProducts: async (restaurantId: string) => {
    const { data } = await api.get(`/restaurants/${restaurantId}/products`);
    return data;
  },

  addProduct: async (restaurantId: string, dto: AddProductDto) => {
    const { data } = await api.post(`/restaurants/${restaurantId}/products`, dto);
    return data;
  },

  removeProduct: async (restaurantId: string, productId: string) => {
    const { data } = await api.delete(`/restaurants/${restaurantId}/products/${productId}`);
    return data;
  },
};