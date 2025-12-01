import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

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

// DTO интерфейсы
export interface CreateWorkshopDto {
  id?: string;
  name: string;
  restaurantId?: string[] | string;
  restaurantIds?: string[] | string;
  userIds?: string[];
}

export interface UpdateWorkshopDto {
  name?: string;
  restaurantIds?: string[];
  userIds?: string[];
}

export interface WorkshopResponseDto {
  id: string;
  name: string;
  restaurantIds: string[];
  userIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AssignUsersDto {
  userIds: string[];
}

export interface AssignRestaurantsDto {
  restaurantIds: string[];
}

export const WorkshopService = {
  findAll: async (): Promise<WorkshopResponseDto[]> => {
    const { data } = await api.get('/workshops');
    return data;
  },

  findOne: async (id: string): Promise<WorkshopResponseDto> => {
    const { data } = await api.get(`/workshops/${id}`);
    return data;
  },

  create: async (dto: CreateWorkshopDto): Promise<WorkshopResponseDto> => {
    const { data } = await api.post('/workshops', dto);
    return data;
  },

  update: async (id: string, dto: UpdateWorkshopDto): Promise<WorkshopResponseDto> => {
    const { data } = await api.put(`/workshops/${id}`, dto);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/workshops/${id}`);
  },

  addUsers: async (workshopId: string, userIds: string[]): Promise<void> => {
    await api.post(`/workshops/${workshopId}/users`, { userIds });
  },

  removeUsers: async (workshopId: string, userIds: string[]): Promise<void> => {
    await api.delete(`/workshops/${workshopId}/users`, { 
      data: { userIds } 
    });
  },

  getUsers: async (workshopId: string): Promise<string[]> => {
    const { data } = await api.get(`/workshops/${workshopId}/users`);
    return data;
  },

  // Методы для работы с ресторанами
  addRestaurants: async (workshopId: string, restaurantIds: string[]): Promise<void> => {
    await api.post(`/workshops/${workshopId}/restaurants`, { restaurantIds });
  },

  removeRestaurants: async (workshopId: string, restaurantIds: string[]): Promise<void> => {
    await api.delete(`/workshops/${workshopId}/restaurants`, { 
      data: { restaurantIds } 
    });
  },

  findByRestaurantId: async (restaurantId: string): Promise<WorkshopResponseDto[]> => {
    const { data } = await api.get(`/workshops/restaurant/${restaurantId}`);
    return data;
  },

  getAll: async (): Promise<WorkshopResponseDto[]> => {
    return WorkshopService.findAll();
  },

  getById: async (id: string): Promise<WorkshopResponseDto> => {
    return WorkshopService.findOne(id);
  },

  getByRestaurantId: async (restaurantId: string): Promise<WorkshopResponseDto[]> => {
    return WorkshopService.findByRestaurantId(restaurantId);
  },
};