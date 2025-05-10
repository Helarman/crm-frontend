
import axios from "axios";
import Cookies from "js-cookie";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const authApi = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Для работы с httpOnly cookies
});

export const authService = {
  login: (data: { email: string; password: string }) => 
    authApi.post('/auth/login', data),
  
  register: (data: { email: string; password: string }) => 
    authApi.post('/auth/register', data),
  
  logout: () => authApi.post('/auth/logout'),
  
  refresh: () => authApi.post('/auth/refresh'), 
  
  getMe: () => authApi.get('/auth/me'),
};

// Интерцептор для добавления токена в заголовки
authApi.interceptors.request.use((config) => {
  const token = Cookies.get('accessToken'); // Изменим название куки
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

authApi.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    
    // Пропускаем определенные эндпоинты
    if (originalRequest.url.includes('/auth/')) {
      return Promise.reject(error);
    }

    // Обрабатываем только 401 ошибку
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // 1. Пробуем обновить токены
        const { data } = await authApi.post('/auth/refresh', {}, {
          withCredentials: true
        });
        
        // 2. Сохраняем новый accessToken
        Cookies.set('accessToken', data.accessToken, {
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax'
        });
        
        // 3. Обновляем заголовок
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        
        // 4. Повторяем запрос
        return authApi(originalRequest);
      } catch (refreshError) {
        // 5. Очищаем токены при ошибке
        Cookies.remove('accessToken');
        delete authApi.defaults.headers.common['Authorization'];
        
        // 6. Перенаправляем только на клиенте
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);