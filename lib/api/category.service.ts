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

export interface CategoryDto {
  id?: string
  title: string;
  description?: string;
}

export const CategoryService = {
  // Получение категории по ID
  getById: async (id: string) => {
    const { data } = await api.get(`/categories/by-id/${id}`);
    return data;
  },

  // Создание новой категории (требует авторизации)
  create: async (dto: CategoryDto) => {
    const { data } = await api.post('/categories', dto);
    return data;
  },

  // Обновление категории (требует авторизации)
  update: async (id: string, dto: CategoryDto) => {
    const { data } = await api.put(`/categories/${id}`, dto);
    return data;
  },

  // Удаление категории (требует авторизации)
  delete: async (id: string) => {
    const { data } = await api.delete(`/categories/${id}`);
    return data;
  },

  // Получение всех продуктов по категории
  getProductsByCategory: async (id: string) => {
    const { data } = await api.get(`/categories/${id}/products`);
    return data;
  },

  // Дополнительно можно добавить метод для получения всех категорий,
  // если у вас есть соответствующий endpoint на бэкенде
  getAll: async (searchTerm?: string) => {
    const { data } = await api.get('/categories', {
      params: { searchTerm }
    });
    return data;
  }
};