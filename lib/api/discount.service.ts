import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});


export type DiscountType = 'PERCENTAGE' | 'FIXED';
export type DiscountTargetType = 'ALL' | 'RESTAURANT' | 'CATEGORY' | 'PRODUCT' | 'ORDER_TYPE';
export type OrderType = 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY' | 'BANQUET';

export interface CreateDiscountDto {
  title?: string;
  description?: string;
  restaurantIds?: string[];
  productIds?: string[];
  type?: DiscountType;
  value?: number;
  targetType?: DiscountTargetType;
  minOrderAmount?: number;
  restaurants?: { restaurantId: string }[];
  categories?: { categoryId: string }[];
  products?: { productId: string }[];
  orderTypes?: OrderType[];
  daysOfWeek?: number[];
  code?: string;
  startTime?: number;
  endTime?: number;
  maxUses?: number;
  startDate?: Date | null;
  endDate?: Date | null;
  isActive?: boolean;
}

export interface UpdateDiscountDto extends Partial<CreateDiscountDto> {}

export interface DiscountFormState extends Omit<Partial<CreateDiscountDto>, 'restaurants' | 'categories' | 'products'> {
  restaurantIds: string[];
  categoryIds: string[];
  productIds: string[];
}

export interface DiscountResponseDto {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  title: string;
  description?: string;
  type: DiscountType;
  value: number;
  targetType: DiscountTargetType;
  minOrderAmount?: number;
  orderTypes: OrderType[];
  daysOfWeek: number[];
  isActive: boolean;
  code?: string;
  maxUses?: number;
  currentUses: number;
  startDate?: Date;
  endDate?: Date;
  startTime: number;
  endTime: number;
  restaurants?: {
    restaurant: {
      id: string;
      title: string;
    };
  }[];
  categories?: {
    category: {
      id: string;
      title: string;
    };
  }[];
  products?: {
    product: {
      id: string;
      title: string;
    };
  }[];
}
export const DiscountService = {
  /**
   * Создание новой скидки
   */
  create: async (dto: CreateDiscountDto): Promise<DiscountResponseDto> => {
    try {
      const { data } = await api.post<DiscountResponseDto>('/discounts', dto);
      return data;
    } catch (error) {
      console.error('Failed to create discount:', error);
      throw error;
    }
  },

  /**
   * Получение всех скидок
   */
  getAll: async (): Promise<DiscountResponseDto[]> => {
    try {
      const { data } = await api.get<DiscountResponseDto[]>('/discounts');
      return data;
    } catch (error) {
      console.error('Failed to get discounts:', error);
      throw error;
    }
  },

  /**
   * Получение скидки по ID
   */
  getById: async (id: string): Promise<DiscountResponseDto> => {
    try {
      const { data } = await api.get<DiscountResponseDto>(`/discounts/${id}`);
      return data;
    } catch (error) {
      console.error(`Failed to get discount with ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Обновление скидки
   */
  update: async (id: string, dto: UpdateDiscountDto): Promise<DiscountResponseDto> => {
    try {
      const { data } = await api.put<DiscountResponseDto>(`/discounts/${id}`, dto);
      return data;
    } catch (error) {
      console.error(`Failed to update discount with ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Удаление скидки
   */
  delete: async (id: string): Promise<DiscountResponseDto> => {
    try {
      const { data } = await api.delete<DiscountResponseDto>(`/discounts/${id}`);
      return data;
    } catch (error) {
      console.error(`Failed to delete discount with ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Получение скидок по ресторану
   */
  getByRestaurant: async (restaurantId: string): Promise<DiscountResponseDto[]> => {
    try {
      const { data } = await api.get<DiscountResponseDto[]>(`/discounts/restaurant/${restaurantId}`);
       return data.filter(discount => !discount.code || discount.code === "");
    } catch (error) {
      console.error(`Failed to get discounts for restaurant ${restaurantId}:`, error);
      throw error;
    }
  },

  /**
   * Получение скидок по продукту
   */
  getByProduct: async (productId: string): Promise<DiscountResponseDto[]> => {
    try {
      const { data } = await api.get<DiscountResponseDto[]>(`/discounts/product/${productId}`);
      return data;
    } catch (error) {
      console.error(`Failed to get discounts for product ${productId}:`, error);
      throw error;
    }
  },

  /**
   * Получение скидок по массиву продуктов
   */
  getByProducts: async (productIds: string[]): Promise<DiscountResponseDto[]> => {
    try {
      const { data } = await api.post<DiscountResponseDto[]>('/discounts/products', { productIds });
      return data;
    } catch (error) {
      console.error('Failed to get discounts for products:', error);
      throw error;
    }
  },

  /**
   * Получение скидки по промокоду
   */
  getByPromoCode: async (code: string): Promise<DiscountResponseDto> => {
    try {
      const { data } = await api.get<DiscountResponseDto>(`/discounts/promo/${code}`);
      return data;
    } catch (error) {
      console.error(`Failed to get discount by promo code ${code}:`, error);
      throw error;
    }
  },
};