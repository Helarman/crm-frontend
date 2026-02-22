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

interface UpdateUserDto {
  name?: string;
  email?: string;
  phone?: string;
  picture?: string;
  role?: string;
  isBlocked?: boolean;
}

interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

export const UserService = {
  // Получение данных пользователей
  getAll: async () => {
    const { data } = await api.get('/users');
    return data;
  },

  getById: async (id: string) => {
    const { data } = await api.get(`/users/${id}`);
    return data;
  },

  getByEmail: async (email: string) => {
    const { data } = await api.get(`/users/email/${email}`);
    return data;
  },

  getProfile: async () => {
    const { data } = await api.get('/users/profile');
    return data;
  },

  // Обновление данных пользователя
  update: async (id: string, dto: UpdateUserDto) => {
    const { data } = await api.patch(`/users/${id}`, dto);
    return data;
  },

  updateProfile: async (dto: UpdateUserDto) => {
    const { data } = await api.patch('/users/profile', dto);
    return data;
  },

  changePassword: async (dto: ChangePasswordDto) => {
    const { data } = await api.post('/users/change-password', dto);
    return data;
  },

  // Удаление пользователя
  delete: async (id: string) => {
    const { data } = await api.delete(`/users/${id}`);
    return data;
  },

  // Административные функции
  changeUserRole: async (userId: string, role: string) => {
    const { data } = await api.patch(`/users/${userId}/role`, { role });
    return data;
  },

  // Аватар пользователя
  uploadAvatar: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const { data } = await api.post('/users/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data;
  },

  deleteAvatar: async () => {
    const { data } = await api.delete('/users/avatar');
    return data;
  },

  checkEmailAvailability: async (email: string) => {
    try {
      const response = await api.get(`/users/check-email?email=${email}`);
      
      // Обработка пустого ответа
      if (response.data === "" && response.status === 200) {
        return true;
      }
  
      if (response.status === 204) {
        return false;
      }
  
      return Boolean(response.data);
    } catch (error) {
      console.error("Ошибка:", error);
      return false;
    }
  },

   async register(dto: {
    name: string
    email: string
    role: string
    password: string
    phone?: string
    acceptTerms: boolean
  }): Promise<{ id: string }> {
    const { data } = await api.post('/auth/register', dto)
    return data
  },

  toggleBlock: async (userId: string, isBlocked: boolean) => {
  const { data } = await api.patch(`/users/${userId}/toggle-block`, { isBlocked });
  return data;
},
};