import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export interface DictionaryItem {
  id: number;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDictionaryDto {
  name: string;
  isActive?: boolean;
}

export interface UpdateDictionaryDto extends Partial<CreateDictionaryDto> {}

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
  writeOffReasons: {
    getAll: async (): Promise<DictionaryItem[]> => {
      const { data } = await api.get('/dictionaries/write-off-reasons');
      return data;
    },

    getById: async (id: number): Promise<DictionaryItem> => {
      const { data } = await api.get(`/dictionaries/write-off-reasons/${id}`);
      return data;
    },

    create: async (dto: CreateDictionaryDto): Promise<DictionaryItem> => {
      const { data } = await api.post('/dictionaries/write-off-reasons', dto);
      return data;
    },

    update: async (id: number, dto: UpdateDictionaryDto): Promise<DictionaryItem> => {
      const { data } = await api.put(`/dictionaries/write-off-reasons/${id}`, dto);
      return data;
    },

    delete: async (id: number): Promise<DictionaryItem> => {
      const { data } = await api.delete(`/dictionaries/write-off-reasons/${id}`);
      return data;
    },
  },

  receiptReasons: {
    getAll: async (): Promise<DictionaryItem[]> => {
      const { data } = await api.get('/dictionaries/receipt-reasons');
      return data;
    },

    getById: async (id: number): Promise<DictionaryItem> => {
      const { data } = await api.get(`/dictionaries/receipt-reasons/${id}`);
      return data;
    },

    create: async (dto: CreateDictionaryDto): Promise<DictionaryItem> => {
      const { data } = await api.post('/dictionaries/receipt-reasons', dto);
      return data;
    },

    update: async (id: number, dto: UpdateDictionaryDto): Promise<DictionaryItem> => {
      const { data } = await api.put(`/dictionaries/receipt-reasons/${id}`, dto);
      return data;
    },

    delete: async (id: number): Promise<DictionaryItem> => {
      const { data } = await api.delete(`/dictionaries/receipt-reasons/${id}`);
      return data;
    },
  },

  movementReasons: {
    getAll: async (): Promise<DictionaryItem[]> => {
      const { data } = await api.get('/dictionaries/movement-reasons');
      return data;
    },

    getById: async (id: number): Promise<DictionaryItem> => {
      const { data } = await api.get(`/dictionaries/movement-reasons/${id}`);
      return data;
    },

    create: async (dto: CreateDictionaryDto): Promise<DictionaryItem> => {
      const { data } = await api.post('/dictionaries/movement-reasons', dto);
      return data;
    },

    update: async (id: number, dto: UpdateDictionaryDto): Promise<DictionaryItem> => {
      const { data } = await api.put(`/dictionaries/movement-reasons/${id}`, dto);
      return data;
    },

    delete: async (id: number): Promise<DictionaryItem> => {
      const { data } = await api.delete(`/dictionaries/movement-reasons/${id}`);
      return data;
    },
  },
};

export default DictionariesService;