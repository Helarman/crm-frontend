import axios from 'axios';
import { UserService } from './user.service';

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
interface WarehouseDto {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  restaurantId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface CreateWarehouseDto {
  name: string;
  description?: string;
  restaurantId?: string;
}

interface UpdateWarehouseDto {
  name?: string;
  description?: string;
  isActive?: boolean;
}

interface StorageLocationDto {
  id: string;
  name: string;
  code?: string;
  description?: string;
  isActive: boolean;
  warehouseId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface CreateStorageLocationDto {
  name: string;
  code?: string;
  description?: string;
}

interface UpdateStorageLocationDto {
  name?: string;
  code?: string;
  description?: string;
  isActive?: boolean;
}

export interface InventoryItemDto {
  id: string;
  name: string;
  description?: string;
  unit: string;
  cost?: number;
  productId?: string;
  premixId?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  inventoryItemId?: string;
}

interface CreateInventoryItemDto {
  name: string;
  description?: string;
  unit: string;
  cost?: number;
  productId?: string;
}

interface UpdateInventoryItemDto {
  name?: string;
  description?: string;
  unit?: string;
  cost?: number;
  productId?: string;
  isActive?: boolean;
  categoryId?: string;
}

interface WarehouseItemDto {
  id: string;
  warehouseId: string;
  cost?: number;
  totalValue?: number;
  inventoryItemId: string;
  storageLocationId?: string;
  quantity: number;
  reserved: number;
  minQuantity?: number;
  createdAt: Date;
  updatedAt: Date;
}

interface CreateWarehouseItemDto {
  warehouseId: string;
  inventoryItemId: string;
  storageLocationId?: string;
  quantity: number;
  minQuantity?: number;
}

interface UpdateWarehouseItemDto {
  storageLocationId?: string;
  quantity?: number;
  reserved?: number;
  minQuantity?: number;
}

interface InventoryTransactionDto {
  id: string;
  inventoryItemId: string;
  userId?: string;
  type: InventoryTransactionType;
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  reason?: string;
   cost?: number; 
  totalValue?: number
  unitCost?: number;
  totalCost?: number;
  documentId?: string;
  createdAt: Date;
  updatedAt: Date;
   warehouseItem?: {
    warehouseId?: string
  }
}

interface CreateInventoryTransactionDto {
  inventoryItemId: string;
  userId?: string;
  type: InventoryTransactionType;
  warehouseId: string;
  cost?: number; 
  unitCost?: number; 
  quantity: number;
  reason?: string;
  documentId?: string;
}

interface PremixDto {
  id: string;
  name: string;
  description?: string;
  unit: string;
  yield: number;
  createdAt: Date;
  updatedAt: Date;
  ingredients: any;
}

interface CreatePremixDto {
  name: string;
  description?: string;
  unit: string;
  yield?: number;
  ingredients: AddPremixIngredientDto[];
}

interface UpdatePremixDto {
  name?: string;
  description?: string;
  unit?: string;
  yield?: number;
}

interface PremixIngredientDto {
  premixId: string;
  inventoryItemId: string;
  quantity: number;
}

interface AddPremixIngredientDto {
  inventoryItemId: string;
  quantity: number;
}

interface ProductIngredientDto {
  productId: string;
  inventoryItemId: string;
  quantity: number;
}

interface AddProductIngredientDto {
  inventoryItemId: string;
  quantity: number;
}

interface InventoryAvailabilityDto {
  productId: string;
  productName: string;
  quantity: number;
  allAvailable: boolean;
  ingredients: {
    ingredientId: string;
    ingredientName: string;
    required: number;
    available: number;
    isAvailable: boolean;
  }[];
}

export enum InventoryTransactionType {
  RECEIPT = 'RECEIPT',
  WRITE_OFF = 'WRITE_OFF',
  CORRECTION = 'CORRECTION',
  TRANSFER = 'TRANSFER',
  PREPARATION = 'PREPARATION',
  USAGE = 'USAGE'
}

export interface InventoryCategoryDto {
  id: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  isActive: boolean;
  parentId?: string;
  children?: InventoryCategoryDto[];
  inventoryItems?: InventoryItemDto[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateInventoryCategoryDto {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  parentId?: string;
  isActive?: boolean;
}

export interface UpdateInventoryCategoryDto {
  name?: string;
  description?: string;
  color?: string;
  icon?: string;
  parentId?: string;
  isActive?: boolean;
}

export interface BulkUpdateCategoryDto {
  itemIds: string[];
  categoryId?: string | null;
}

// Обновляем интерфейс InventoryItemDto для поддержки категорий
export interface InventoryItemDto {
  id: string;
  name: string;
  description?: string;
  unit: string;
  cost?: number;
  productId?: string;
  premixId?: string;
  categoryId?: string;
  category?: InventoryCategoryDto;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  inventoryItemId?: string;
}

// Обновляем CreateInventoryItemDto для поддержки категорий
interface CreateInventoryItemDto {
  name: string;
  description?: string;
  unit: string;
  cost?: number;
  productId?: string;
  categoryId?: string; // Добавляем поле категории
}



// Обновленный сервис с правильными типами
export const WarehouseService = {
  // ==================== Warehouse Methods ====================
  createWarehouse: async (dto: CreateWarehouseDto): Promise<WarehouseDto> => {
    const { data } = await api.post('/warehouses', dto);
    return data;
  },

  getWarehouse: async (id: string): Promise<WarehouseDto> => {
    const { data } = await api.get(`/warehouses/${id}`);
    return data;
  },

  getRestaurantWarehouse: async (restaurantId: string): Promise<WarehouseDto> => {
    const { data } = await api.get(`/warehouses/restaurant/${restaurantId}`);
    return data;
  },

  updateWarehouse: async (id: string, dto: UpdateWarehouseDto): Promise<WarehouseDto> => {
    const { data } = await api.put(`/warehouses/${id}`, dto);
    return data;
  },

  deleteWarehouse: async (id: string): Promise<void> => {
    await api.delete(`/warehouses/${id}`);
  },

  // ==================== Storage Location Methods ====================
  createStorageLocation: async (
    warehouseId: string, 
    dto: CreateStorageLocationDto
  ): Promise<StorageLocationDto> => {
    const { data } = await api.post(`/warehouses/${warehouseId}/locations`, dto);
    return data;
  },

  getStorageLocation: async (id: string): Promise<StorageLocationDto> => {
    const { data } = await api.get(`/warehouses/locations/${id}`);
    return data;
  },

  updateStorageLocation: async (
    id: string, 
    dto: UpdateStorageLocationDto
  ): Promise<StorageLocationDto> => {
    const { data } = await api.put(`/warehouses/locations/${id}`, dto);
    return data;
  },

  deleteStorageLocation: async (id: string): Promise<void> => {
    await api.delete(`/warehouses/locations/${id}`);
  },

  // ==================== Inventory Item Methods ====================
  createInventoryItem: async (dto: CreateInventoryItemDto): Promise<InventoryItemDto> => {
    const { data } = await api.post('/warehouses/items', dto);
    return data;
  },

  getInventoryItem: async (id: string): Promise<InventoryItemDto> => {
    const { data } = await api.get(`/warehouses/items/${id}`);
    return data;
  },

  updateInventoryItem: async (
    id: string, 
    dto: UpdateInventoryItemDto
  ): Promise<InventoryItemDto> => {
    const { data } = await api.put(`/warehouses/items/${id}`, dto);
    return data;
  },

  deleteInventoryItem: async (id: string): Promise<void> => {
    await api.delete(`/warehouses/items/${id}`);
  },

  // ==================== Warehouse Item Methods ====================
  createWarehouseItem: async (dto: CreateWarehouseItemDto): Promise<WarehouseItemDto> => {
    const { data } = await api.post('/warehouses/warehouse-items', dto);
    return data;
  },

  getWarehouseItem: async (id: string): Promise<WarehouseItemDto> => {
    const { data } = await api.get(`/warehouses/warehouse-items/${id}`);
    return data;
  },

  updateWarehouseItem: async (
    id: string, 
    dto: UpdateWarehouseItemDto
  ): Promise<WarehouseItemDto> => {
    const { data } = await api.put(`/warehouses/warehouse-items/${id}`, dto);
    return data;
  },

  deleteWarehouseItem: async (id: string): Promise<void> => {
    await api.delete(`/warehouses/warehouse-items/${id}`);
  },

  // ==================== Transaction Methods ====================
  createTransaction: async (
    dto: CreateInventoryTransactionDto
  ): Promise<InventoryTransactionDto> => {
    const { data } = await api.post('/warehouses/transactions', dto);
    return data;
  },

  getTransaction: async (id: string): Promise<InventoryTransactionDto> => {
    const { data } = await api.get(`/warehouses/transactions/${id}`);
    return data;
  },

  getItemTransactions: async (itemId: string): Promise<InventoryTransactionDto[]> => {
    const { data } = await api.get(`/warehouses/items/${itemId}/transactions`);
    return data;
  },

  getWarehouseTransactions: async (
    warehouseId: string,
    filters?: {
      startDate?: Date;
      endDate?: Date;
      type?: InventoryTransactionType;
    }
  ): Promise<InventoryTransactionDto[]> => {
    const { data } = await api.get(`/warehouses/warehouse/${warehouseId}/transactions`, {
      params: {
        startDate: filters?.startDate?.toISOString(),
        endDate: filters?.endDate?.toISOString(),
        type: filters?.type,
      },
    });
    return data;
  },

  // ==================== Premix Methods ====================
  createPremix: async (dto: CreatePremixDto): Promise<PremixDto> => {
    const { data } = await api.post('/warehouses/premixes', dto);
    return data;
  },

  getPremix: async (id: string): Promise<PremixDto> => {
    const { data } = await api.get(`/warehouses/premixes/${id}`);
    return data;
  },

  updatePremix: async (id: string, dto: UpdatePremixDto): Promise<PremixDto> => {
    const { data } = await api.put(`/warehouses/premixes/${id}`, dto);
    return data;
  },

  deletePremix: async (id: string): Promise<void> => {
    await api.delete(`/warehouses/premixes/${id}`);
  },

 getAllInventoryItems: async (): Promise<any> => {
    const response = await api.get('/warehouses/items/all');
    return response.data;
  },

  preparePremix: async (
    id: string, 
    quantity: number, 
    userId?: string
  ): Promise<void> => {
    await api.post(`/warehouses/premixes/${id}/prepare`, { quantity, userId });
  },

  // ==================== Premix Ingredient Methods ====================
  addPremixIngredient: async (
    premixId: string, 
    dto: AddPremixIngredientDto
  ): Promise<PremixIngredientDto> => {
    const { data } = await api.post(`/warehouses/premixes/${premixId}/ingredients`, dto);
    return data;
  },

  updatePremixIngredient: async (
    premixId: string,
    inventoryItemId: string,
    quantity: number
  ): Promise<PremixIngredientDto> => {
    const { data } = await api.put(
      `/warehouses/premixes/${premixId}/ingredients/${inventoryItemId}`,
      { quantity }
    );
    return data;
  },

  removePremixIngredient: async (
    premixId: string, 
    inventoryItemId: string
  ): Promise<void> => {
    await api.delete(`/warehouses/premixes/${premixId}/ingredients/${inventoryItemId}`);
  },

  // ==================== Product Ingredient Methods ====================
  addProductIngredient: async (
    productId: string,
    dto: AddProductIngredientDto
  ): Promise<ProductIngredientDto> => {
    const { data } = await api.post(`/warehouses/products/${productId}/ingredients`, dto);
    return data;
  },

  updateProductIngredient: async (
    productId: string,
    inventoryItemId: string,
    quantity: number
  ): Promise<ProductIngredientDto> => {
    const { data } = await api.put(
      `/warehouses/products/${productId}/ingredients/${inventoryItemId}`,
      { quantity }
    );
    return data;
  },

  removeProductIngredient: async (
    productId: string,
    inventoryItemId: string
  ): Promise<void> => {
    await api.delete(`/warehouses/products/${productId}/ingredients/${inventoryItemId}`);
  },

  // ==================== Utility Methods ====================
  checkProductAvailability: async (
    productId: string, 
    quantity: number = 1
  ): Promise<InventoryAvailabilityDto> => {
    const { data } = await api.get(`/warehouses/products/${productId}/availability`, {
      params: { quantity },
    });
    return data;
  },

getWarehouseItems: async (
  warehouseId: string,
  filters?: {
    search?: string;
    lowStock?: boolean;
    storageLocationId?: string;
  }
): Promise<WarehouseItemDto[]> => {
  const { data } = await api.get(`/warehouses/${warehouseId}/items`, {
    params: {
      search: filters?.search,
      lowStock: filters?.lowStock,
      storageLocationId: filters?.storageLocationId,
    },
  });
  return data;
},

listStorageLocations: async (
  warehouseId: string,
  filters?: {
    search?: string;
  }
): Promise<StorageLocationDto[]> => {
  const { data } = await api.get(`/warehouses/${warehouseId}/locations`, {
    params: {
      search: filters?.search,
    },
  });
  return data;
},

listPremixes: async (filters?: {
  search?: string;
}): Promise<PremixDto[]> => {
  const { data } = await api.get('/warehouses/premixes', {
    params: {
      search: filters?.search,
    },
  });
  return data;
},

listWarehousePremixes: async (
  warehouseId: string,
  filters?: {
    search?: string;
  }
): Promise<PremixDto[]> => {
  const { data } = await api.get(`/warehouses/${warehouseId}/premixes`, {
    params: {
      search: filters?.search,
    },
  });
  return data;
},
 async getPremixWithWarehouseDetails(premixId: string, warehouseId: string): Promise<any> {
  const response = await api.get(`/warehouses/${warehouseId}/premixes/${premixId}/details`);
  return response.data;
},

 async getPremixTransactions(premixId: string, warehouseId: string): Promise<any[]> {
  const response = await api.get(`/warehouses/${warehouseId}/premixes/${premixId}/transactions`);
  return response.data;
},
// ==================== Inventory Item Methods ====================
searchInventoryItems: async (
  search: string
): Promise<InventoryItemDto[]> => {
  const { data } = await api.get('/warehouses/items/search', {
    params: { search },
  });
  return data;
},

// ==================== Premix Methods ====================
getPremixDetails: async (id: string): Promise<PremixDto> => {
  const { data } = await api.get(`/warehouses/premixes/${id}/details`);
  return data;
},



getWarehouseTransactionsByPeriod: async (
  warehouseId: string,
  startDate: string,
  endDate: string
): Promise<InventoryTransactionDto[]> => {
  const { data } = await api.get(`/warehouses/${warehouseId}/transactions/period`, {
    params: {
      startDate,
      endDate,
    },
  });
  return data;
},
// ==================== Inventory Category Methods ====================
  createInventoryCategory: async (dto: CreateInventoryCategoryDto): Promise<InventoryCategoryDto> => {
    const { data } = await api.post('/warehouses/categories', dto);
    return data;
  },

  getInventoryCategory: async (id: string): Promise<InventoryCategoryDto> => {
    const { data } = await api.get(`/warehouses/categories/${id}`);
    return data;
  },

  getAllInventoryCategories: async (filters?: {
    search?: string;
    includeInactive?: boolean;
    parentId?: string | null;
  }): Promise<InventoryCategoryDto[]> => {
    const { data } = await api.get('/warehouses/categories', {
      params: {
        search: filters?.search,
        includeInactive: filters?.includeInactive,
        parentId: filters?.parentId,
      },
    });
    return data;
  },

  getCategoryTree: async (): Promise<InventoryCategoryDto[]> => {
    const { data } = await api.get('/warehouses/categories/tree');
    return data;
  },

  updateInventoryCategory: async (
    id: string,
    dto: UpdateInventoryCategoryDto
  ): Promise<InventoryCategoryDto> => {
    const { data } = await api.put(`/warehouses/categories/${id}`, dto);
    return data;
  },

  deleteInventoryCategory: async (id: string): Promise<void> => {
    await api.delete(`/warehouses/categories/${id}`);
  },

  getItemsByCategory: async (
    categoryId: string,
    filters?: {
      includeInactive?: boolean;
      warehouseId?: string;
    }
  ): Promise<InventoryItemDto[]> => {
    const { data } = await api.get(`/warehouses/categories/${categoryId}/items`, {
      params: {
        includeInactive: filters?.includeInactive,
        warehouseId: filters?.warehouseId,
      },
    });
    return data;
  },

  bulkUpdateItemsCategory: async (
    itemIds: string[],
    categoryId: string | null
  ): Promise<Array<{ itemId: string; status: string; data?: any; error?: string }>> => {
    const { data } = await api.post('/warehouses/items/bulk-update-category', {
      itemIds,
      categoryId,
    });
    return data;
  },

  getWarehouseCoverage: async (warehouseId: string): Promise<{
    totalActiveItems: number;
    itemsInWarehouse: number;
    coveragePercentage: number;
    missingCount: number;
    missingItems: Array<{ id: string; name: string; unit: string }>;
  }> => {
    const { data } = await api.get(`/warehouses/${warehouseId}/coverage`);
    return data;
  },

  addMissingItemsToWarehouse: async (
    warehouseId: string,
    dto: {
      defaultQuantity?: number;
      defaultMinQuantity?: number;
      defaultStorageLocationId?: string;
      ignoreErrors?: boolean;
    }
  ): Promise<{
    status: string;
    message: string;
    totalMissing: number;
    added: number;
    errors: number;
    details: Array<{
      inventoryItemId: string;
      inventoryItemName: string;
      status: 'added' | 'error';
      error?: string;
    }>;
  }> => {
    const { data } = await api.post(`/warehouses/${warehouseId}/add-missing-items`, dto);
    return data;
  },

  bulkCreateWarehouseItems: async (
    dto: {
      restaurantId: string;
      warehouseId?: string;
      defaultQuantity?: number;
      defaultMinQuantity?: number;
      defaultStorageLocationId?: string;
      specificItemIds?: string[];
      skipExisting?: boolean;
    }
  ): Promise<{
    totalItems: number;
    created: number;
    skipped: number;
    errors: number;
    details: Array<{
      inventoryItemId: string;
      inventoryItemName: string;
      status: 'created' | 'skipped' | 'error';
      error?: string;
    }>;
  }> => {
    const { data } = await api.post('/warehouses/bulk-create-items', dto);
    return data;
  },

  getTransferTransactions: async (
    warehouseId: string,
    filters?: {
      startDate?: string;
      endDate?: string;
      direction?: 'incoming' | 'outgoing' | 'both';
    }
  ): Promise<InventoryTransactionDto[]> => {
    const { data } = await api.get(`/warehouses/${warehouseId}/transfers`, {
      params: {
        startDate: filters?.startDate,
        endDate: filters?.endDate,
        direction: filters?.direction,
      },
    });
    return data;
  },

  getAllTransfers: async (
    filters?: {
      startDate?: string;
      endDate?: string;
    }
  ): Promise<InventoryTransactionDto[]> => {
    const { data } = await api.get('/warehouses/transfers', {
      params: {
        startDate: filters?.startDate,
        endDate: filters?.endDate,
      },
    });
    return data;
  },
  updateItemCost: async (
    itemId: string,
    cost: number
  ): Promise<WarehouseItemDto> => {
    const { data } = await api.put(`/warehouses/items/${itemId}/cost`, { cost });
    return data;
  },
   getInventoryValue: async (
    warehouseId: string
  ): Promise<{
    totalValue: number;
    itemsCount: number;
    averageCost: number;
  }> => {
    const { data } = await api.get(`/warehouses/${warehouseId}/inventory-value`);
    return data;
  },
};