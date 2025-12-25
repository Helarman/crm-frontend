import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL

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
  sortOrder?: number;
  composition?: string
}

export interface SortOrderRequest {
  sortOrder: number;
}

export interface MoveToCategoryRequest {
  categoryId: string;
  sortOrder?: number;
}

export interface CategoryOrderStats {
  count: number;
  minOrder: number;
  maxOrder: number;
  products: Array<{
    id: string;
    title: string;
    sortOrder: number;
  }>;
}

export interface BulkDeleteRequest {
  productIds: string[];
}

export interface BulkCategoryRequest {
  productIds: string[];
  categoryId?: string;
}

export interface BulkWorkshopsRequest {
  productIds: string[];
  workshopIds: string[];
}

export interface BulkAdditivesRequest {
  productIds: string[];
  additiveIds?: string[];
}

export interface BulkToggleRequest {
  productIds: string[];
  enable: boolean;
}

export interface RestoreRequest {
  productIds: string[];
}

export const ProductService = {
  // ... существующие методы ...

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

  // Массовые операции
  deleteMultiple: async (productIds: string[]) => {
    const { data } = await api.post('/products/delete-multiple', { productIds });
    return data;
  },

  restoreProducts: async (productIds: string[]) => {
    const { data } = await api.post('/products/restore', { productIds });
    return data;
  },

  updateCategoryForMultiple: async (productIds: string[], categoryId?: string) => {
    const { data } = await api.post('/products/update-category-multiple', { 
      productIds, 
      categoryId 
    });
    return data;
  },

  assignWorkshopsToMultiple: async (productIds: string[], workshopIds: string[]) => {
    const { data } = await api.post('/products/assign-workshops-multiple', { 
      productIds, 
      workshopIds 
    });
    return data;
  },

  assignAdditivesToMultiple: async (productIds: string[], additiveIds?: string[]) => {
    const { data } = await api.post('/products/assign-additives-multiple', { 
      productIds, 
      additiveIds 
    });
    return data;
  },

  togglePrintLabelsForMultiple: async (productIds: string[], enable: boolean) => {
    const { data } = await api.post('/products/toggle-print-labels-multiple', { 
      productIds, 
      enable 
    });
    return data;
  },

  togglePublishedOnWebsiteForMultiple: async (productIds: string[], enable: boolean) => {
    const { data } = await api.post('/products/toggle-published-website-multiple', { 
      productIds, 
      enable 
    });
    return data;
  },

  togglePublishedInAppForMultiple: async (productIds: string[], enable: boolean) => {
    const { data } = await api.post('/products/toggle-published-app-multiple', { 
      productIds, 
      enable 
    });
    return data;
  },

  toggleStopListForMultiple: async (productIds: string[], enable: boolean) => {
    const { data } = await api.post('/products/toggle-stop-list-multiple', { 
      productIds, 
      enable 
    });
    return data;
  },

  getDeletedProducts: async (searchTerm?: string) => {
    const { data } = await api.get('/products/deleted', { 
      params: { searchTerm } 
    });
    return data;
  },

  hardDelete: async (id: string) => {
    await api.delete(`/products/hard-delete/${id}`);
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
  
  async getIngredients(productId: string): Promise<{ inventoryItemId: string, quantity: number }[]> {
    const { data } = await api.get(`/products/${productId}/ingredients`);
    console.log(data)
    return data;
  },
  
  togglePrintLabels: async (id: string) => {
    const { data } = await api.put(`/products/${id}/toggle-print-labels`);
    return data;
  },

  togglePublishedOnWebsite: async (id: string) => {
    const { data } = await api.put(`/products/${id}/toggle-published-on-website`);
    return data;
  },

  togglePublishedInApp: async (id: string) => {
    const { data } = await api.put(`/products/${id}/toggle-published-in-app`);
    return data;
  },

  toggleStopList: async (id: string) => {
    const { data } = await api.put(`/products/${id}/toggle-stop-list`);
    return data;
  },
  
  updateSortOrder: async (id: string, sortOrder: number) => {
    const { data } = await api.post(`/products/${id}/sort-order`, { sortOrder });
    return data;
  },

  moveToCategory: async (id: string, categoryId: string, sortOrder?: number) => {
    const { data } = await api.put(`/products/${id}/category`, {
      categoryId,
      sortOrder
    });
    return data;
  },

  getCategoryOrderStats: async (categoryId: string): Promise<CategoryOrderStats> => {
    const { data } = await api.get(`/products/category/${categoryId}/order-stats`);
    return data;
  },
  
  async updateProductOrder(productId: string, newOrder: number, categoryId: string) {
    const response = await api.patch(`/products/order/admin/${productId}`, {
      newOrder,
      categoryId
    });
    return response.data;
  },

  async updateClientProductOrder(productId: string, newOrder: number, categoryId: string) {
    const response = await api.patch(`/products/order/client/${productId}`, {
      newOrder,
      categoryId
    });
    return response.data;
  },

  async moveProductUp(productId: string, categoryId: string) {
    const response = await api.post(`/products/order/admin/${productId}/move-up`, {
      categoryId
    });
    return response.data;
  },

  async moveProductDown(productId: string, categoryId: string) {
    const response = await api.post(`/products/order/admin/${productId}/move-down`, {
      categoryId
    });
    return response.data;
  },

  async moveProductUpOnClient(productId: string, categoryId: string) {
    const response = await api.post(`/products/order/client/${productId}/move-up`, {
      categoryId
    });
    return response.data;
  },

  async moveProductDownOnClient(productId: string, categoryId: string) {
    const response = await api.post(`/products/order/client/${productId}/move-down`, {
      categoryId
    });
    return response.data;
  },

  async getCategoryProducts(categoryId: string) {
    const response = await api.get(`/products/order/category/${categoryId}`);
    return response.data;
  },

  async normalizeAdminOrder(categoryId: string) {
    const response = await api.post(`/products/order/admin/normalize/${categoryId}`);
    return response.data;
  },

  async normalizeClientOrder(categoryId: string) {
    const response = await api.post(`/products/order/client/normalize/${categoryId}`);
    return response.data;
  },
  
  getByNetwork: async (networkId: string) => {
    const { data } = await api.get(`/products/by-network/${networkId}`);
    return data;
  },
  getDeletedByNetwork: async (networkId: string) => {
    const { data } = await api.get(`/products/deleted/by-network/${networkId}`);
    return data;
  },
  // Новые методы для работы с сетями
  assignNetworkToProducts: async (networkId: string, productIds?: string[]) => {
    const { data } = await api.post('/products/assign-network', {
      networkId,
      productIds
    });
    return data;
  },

  getProductsWithoutNetwork: async () => {
    const { data } = await api.get('/products/without-network');
    return data;
  },

  // Массовые операции (альтернативные интерфейсы)
  bulkDelete: async (data: BulkDeleteRequest) => {
    const response = await api.post('/products/delete-multiple', data);
    return response.data;
  },

  bulkRestore: async (data: RestoreRequest) => {
    const response = await api.post('/products/restore', data);
    return response.data;
  },

  bulkUpdateCategory: async (data: BulkCategoryRequest) => {
    const response = await api.post('/products/update-category-multiple', data);
    return response.data;
  },

  bulkAssignWorkshops: async (data: BulkWorkshopsRequest) => {
    const response = await api.post('/products/assign-workshops-multiple', data);
    return response.data;
  },

  bulkAssignAdditives: async (data: BulkAdditivesRequest) => {
    const response = await api.post('/products/assign-additives-multiple', data);
    return response.data;
  },

  bulkTogglePrintLabels: async (data: BulkToggleRequest) => {
    const response = await api.post('/products/toggle-print-labels-multiple', data);
    return response.data;
  },

  bulkTogglePublishedWebsite: async (data: BulkToggleRequest) => {
    const response = await api.post('/products/toggle-published-website-multiple', data);
    return response.data;
  },

  bulkTogglePublishedApp: async (data: BulkToggleRequest) => {
    const response = await api.post('/products/toggle-published-app-multiple', data);
    return response.data;
  },

  bulkToggleStopList: async (data: BulkToggleRequest) => {
    const response = await api.post('/products/toggle-stop-list-multiple', data);
    return response.data;
  },

};