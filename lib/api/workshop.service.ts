import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// Интерсепторы и вспомогательные функции остаются без изменений
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

export interface WorkshopDto {
   id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface WorkshopResponse {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface AssignUsersDto {
  userIds: string[];
}

export const WorkshopService = {
  // Получение всех цехов
  getAll: async (searchTerm?: string): Promise<WorkshopResponse[]> => {
    const { data } = await api.get('/workshops', {
      params: { searchTerm }
    });
    return data;
  },

  // Получение цеха по ID
  getById: async (id: string): Promise<WorkshopResponse> => {
    const { data } = await api.get(`/workshops/${id}`);
    return data;
  },

  // Создание нового цеха
  create: async (dto: WorkshopDto): Promise<WorkshopResponse> => {
    const { data } = await api.post('/workshops', dto);
    return data;
  },

  // Обновление цеха
  update: async (id: string, dto: WorkshopDto): Promise<WorkshopResponse> => {
    const { data } = await api.put(`/workshops/${id}`, dto);
    return data;
  },

  // Удаление цеха
  delete: async (id: string): Promise<void> => {
    await api.delete(`/workshops/${id}`);
  },

  // Получение продуктов цеха
  getProducts: async (workshopId: string): Promise<any[]> => {
    const { data } = await api.get(`/workshops/${workshopId}/products`);
    return data;
  },

  // Назначение продуктов цеху
  assignProducts: async (workshopId: string, productIds: string[]): Promise<void> => {
    await api.post(`/workshops/${workshopId}/products`, { productIds });
  },

  // Назначение пользователей цеху
  assignUsers: async (workshopId: string, dto: AssignUsersDto): Promise<void> => {
    await api.post(`/workshops/${workshopId}/users`, dto);
  },


    // Добавление пользователей в цех
  addUsers: async (workshopId: string, userIds: string[]): Promise<void> => {
    await api.post(`/workshops/${workshopId}/users`, { userIds });
  },

  // Удаление пользователей из цеха
  removeUsers: async (workshopId: string, userIds: string[]): Promise<void> => {
    await api.delete(`/workshops/${workshopId}/users`, { 
      data: { userIds } 
    });
  },

  // Получение пользователей цеха
  getUsers: async (workshopId: string): Promise<string[]> => {
    const { data } = await api.get(`/workshops/${workshopId}/users`);
    return data;
  },

  // Удаление конкретного пользователя из цеха (дополнительный метод)
  removeUser: async (workshopId: string, userId: string): Promise<void> => {
    await api.delete(`/workshops/${workshopId}/users/${userId}`);
  }
};