import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL

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

export interface ProductDto {
  title: string;
  description?: string;
  price: number;
  weight?: number;
  calories?: number;
  proteins?: number;
  fats?: number;
  carbohydrates?: number;
  categoryId?: string;
  restaurantId?: string;
  image?: string;
}

  export const ProductService = {
  getAll: async (searchTerm?: string) => {
    const { data } = await api.get('/products', { params: { searchTerm } });
    return data;
  },

  getById: async (id: string) => {
    const { data } = await api.get(`/products/by-id/${id}`);
    return data;
  },

  create: async (dto: ProductDto) => {
    const { data } = await api.post('/products', dto);
    return data;
  },

  update: async (id: string, dto: ProductDto) => {
    const { data } = await api.put(`/products/${id}`, dto);
    return data;
  },

  delete: async (id: string) => {
    await api.delete(`/products/${id}`);
  },
 getByRestaurant: async (restaurantId: string) => {
    const { data } = await api.get(`/restaurants/${restaurantId}/products`);
    return data;
  },
  getRestaurants: async (productId: string) => {
    const { data } = await api.get(`/products/${productId}/restaurants`);
    return data;
  },
  updateRestaurants: async (productId: string, restaurantIds: string[]) => {
    const { data } = await api.put(`/products/${productId}/restaurants`, { restaurantIds });
    return data;
  },

  getRestaurantPrices: async (productId: string) => {
    const { data } = await api.get(`/products/${productId}/prices`);
    return data;
  },

  setRestaurantPrice: async (productId: string, restaurantId: string, price: number) => {
    const { data } = await api.post(`/products/${productId}/prices`, { 
      restaurantId, 
      price 
    });
    return data;
  },

  getAdditives: async (productId: string) => {
    const { data } = await api.get(`/products/${productId}/additives`);
    return data;
  },

  updateAdditives: async (productId: string, additiveIds: string[]) => {
    const { data } = await api.put(`/products/${productId}/additives`, { additiveIds });
    return data;
  },

  getByCategory: async (categoryId: string) => {
    const { data } = await api.get(`/categories/${categoryId}/products`);
    return data;
  },
  async getIngredients(productId: string): Promise<{inventoryItemId: string, quantity: number}[]> {
  const { data } = await api.get(`/products/${productId}/ingredients`);
  console.log(data)
  return data;
  }
};