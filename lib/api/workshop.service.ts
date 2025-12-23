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
  networkId?: string | null;
  restaurantIds?: string[];
  userIds?: string[];
}

export interface UpdateWorkshopDto {
  name?: string;
  networkId?: string | null;
  restaurantIds?: string[];
  userIds?: string[];
}

export interface WorkshopNetwork {
  id: string;
  name: string;
}

export interface WorkshopResponseDto {
  id: string;
  name: string;
  networkId?: string | null;
  restaurantIds: string[];
  userIds: string[];
  createdAt: string;
  updatedAt: string;
  network?: WorkshopNetwork;
}

export interface AssignUsersDto {
  userIds: string[];
}

export interface AssignRestaurantsDto {
  restaurantIds: string[];
}

export interface UpdateNetworkDto {
  networkId: string | null;
}

export const WorkshopService = {
  // Основные CRUD операции
  findAll: async (): Promise<WorkshopResponseDto[]> => {
    const { data } = await api.get('/workshops');
    return data;
  },

  findOne: async (id: string): Promise<WorkshopResponseDto> => {
    const { data } = await api.get(`/workshops/${id}`);
    return data;
  },

  create: async (dto: CreateWorkshopDto): Promise<WorkshopResponseDto> => {
    // Нормализация данных
    const normalizedDto = {
      ...dto,
      restaurantIds: dto.restaurantIds || [],
      userIds: dto.userIds || []
    };
    const { data } = await api.post('/workshops', normalizedDto);
    return data;
  },

  update: async (id: string, dto: UpdateWorkshopDto): Promise<WorkshopResponseDto> => {
    // Нормализация данных
    const normalizedDto = {
      ...dto,
      restaurantIds: dto.restaurantIds || [],
      userIds: dto.userIds || []
    };
    const { data } = await api.put(`/workshops/${id}`, normalizedDto);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/workshops/${id}`);
  },

  // Работа с пользователями
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

  // Работа с ресторанами
  addRestaurants: async (workshopId: string, restaurantIds: string[]): Promise<void> => {
    await api.post(`/workshops/${workshopId}/restaurants`, { restaurantIds });
  },

  removeRestaurants: async (workshopId: string, restaurantIds: string[]): Promise<void> => {
    await api.delete(`/workshops/${workshopId}/restaurants`, { 
      data: { restaurantIds } 
    });
  },

  // Получение цехов по различным критериям
  findByRestaurantId: async (restaurantId: string): Promise<WorkshopResponseDto[]> => {
    const { data } = await api.get(`/workshops/restaurant/${restaurantId}`);
    return data;
  },

  findByNetworkId: async (networkId: string): Promise<WorkshopResponseDto[]> => {
    const { data } = await api.get(`/workshops/network/${networkId}`);
    return data;
  },

  // Управление сетью цеха
  updateNetwork: async (workshopId: string, networkId: string | null): Promise<WorkshopResponseDto> => {
    const { data } = await api.patch(`/workshops/${workshopId}/network`, { networkId });
    return data;
  },

  // Алиасы для обратной совместимости
  getAll: async (): Promise<WorkshopResponseDto[]> => {
    return WorkshopService.findAll();
  },

  getById: async (id: string): Promise<WorkshopResponseDto> => {
    return WorkshopService.findOne(id);
  },

  getByRestaurantId: async (restaurantId: string): Promise<WorkshopResponseDto[]> => {
    return WorkshopService.findByRestaurantId(restaurantId);
  },

  getByNetworkId: async (networkId: string): Promise<WorkshopResponseDto[]> => {
    return WorkshopService.findByNetworkId(networkId);
  },
};

// Вспомогательные функции для работы с цехами
export const WorkshopUtils = {
  // Проверка, принадлежит ли цех сети
  belongsToNetwork: (workshop: WorkshopResponseDto, networkId: string): boolean => {
    return workshop.networkId === networkId;
  },

  // Получение имени сети цеха
  getNetworkName: (workshop: WorkshopResponseDto): string => {
    return workshop.network?.name || 'Без сети';
  },

  // Проверка, есть ли у цеха привязанные рестораны
  hasRestaurants: (workshop: WorkshopResponseDto): boolean => {
    return workshop.restaurantIds.length > 0;
  },

  // Проверка, есть ли у цеха привязанные пользователи
  hasUsers: (workshop: WorkshopResponseDto): boolean => {
    return workshop.userIds.length > 0;
  },

  // Форматирование даты создания
  formatCreatedAt: (workshop: WorkshopResponseDto): string => {
    return new Date(workshop.createdAt).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  },

  // Создание краткого описания цеха
  getDescription: (workshop: WorkshopResponseDto): string => {
    const restaurantCount = workshop.restaurantIds.length;
    const userCount = workshop.userIds.length;
    const networkName = WorkshopUtils.getNetworkName(workshop);
    
    return `Цех "${workshop.name}" (${networkName}): ${restaurantCount} ресторанов, ${userCount} пользователей`;
  },

  // Сортировка цехов по имени
  sortByName: (workshops: WorkshopResponseDto[]): WorkshopResponseDto[] => {
    return [...workshops].sort((a, b) => a.name.localeCompare(b.name));
  },

  // Фильтрация цехов по сети
  filterByNetwork: (workshops: WorkshopResponseDto[], networkId?: string): WorkshopResponseDto[] => {
    if (!networkId) return workshops;
    return workshops.filter(workshop => workshop.networkId === networkId);
  },

  // Фильтрация цехов по наличию ресторанов
  filterByHasRestaurants: (workshops: WorkshopResponseDto[], hasRestaurants: boolean): WorkshopResponseDto[] => {
    return workshops.filter(workshop => 
      hasRestaurants ? workshop.restaurantIds.length > 0 : workshop.restaurantIds.length === 0
    );
  },

  // Группировка цехов по сети
  groupByNetwork: (workshops: WorkshopResponseDto[]): Record<string, WorkshopResponseDto[]> => {
    return workshops.reduce((groups, workshop) => {
      const networkKey = workshop.networkId || 'no-network';
      if (!groups[networkKey]) {
        groups[networkKey] = [];
      }
      groups[networkKey].push(workshop);
      return groups;
    }, {} as Record<string, WorkshopResponseDto[]>);
  },

  // Поиск цеха по имени
  searchByName: (workshops: WorkshopResponseDto[], searchTerm: string): WorkshopResponseDto[] => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return workshops;
    
    return workshops.filter(workshop => 
      workshop.name.toLowerCase().includes(term) ||
      (workshop.network?.name?.toLowerCase() || '').includes(term)
    );
  },
};

// Типы для фильтрации цехов
export interface WorkshopFilterOptions {
  networkId?: string;
  hasRestaurants?: boolean;
  searchTerm?: string;
  sortBy?: 'name' | 'createdAt' | 'restaurantCount';
  sortOrder?: 'asc' | 'desc';
}

export const WorkshopFilterService = {
  // Применение всех фильтров и сортировки
  filterAndSort: (
    workshops: WorkshopResponseDto[], 
    options: WorkshopFilterOptions
  ): WorkshopResponseDto[] => {
    let filtered = [...workshops];

    // Фильтрация по сети
    if (options.networkId !== undefined) {
      filtered = filtered.filter(workshop => 
        options.networkId === 'no-network' 
          ? !workshop.networkId 
          : workshop.networkId === options.networkId
      );
    }

    // Фильтрация по наличию ресторанов
    if (options.hasRestaurants !== undefined) {
      filtered = filtered.filter(workshop => 
        options.hasRestaurants ? workshop.restaurantIds.length > 0 : workshop.restaurantIds.length === 0
      );
    }

    // Поиск по имени
    if (options.searchTerm) {
      const term = options.searchTerm.toLowerCase();
      filtered = filtered.filter(workshop => 
        workshop.name.toLowerCase().includes(term) ||
        (workshop.network?.name?.toLowerCase() || '').includes(term)
      );
    }

    // Сортировка
    if (options.sortBy) {
      filtered.sort((a, b) => {
        let comparison = 0;
        
        switch (options.sortBy) {
          case 'name':
            comparison = a.name.localeCompare(b.name);
            break;
          case 'createdAt':
            comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            break;
          case 'restaurantCount':
            comparison = a.restaurantIds.length - b.restaurantIds.length;
            break;
        }

        return options.sortOrder === 'desc' ? -comparison : comparison;
      });
    }

    return filtered;
  },

};

export default WorkshopService;