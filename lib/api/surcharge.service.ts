import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

export interface NetworkInfo {
  id: string;
  name: string;
}

export interface SurchargeDto {
  id?: string;
  title: string;
  description?: string;
  type: 'FIXED' | 'PERCENTAGE';
  amount: number;
  orderTypes: Array<'DINE_IN' | 'TAKEAWAY' | 'DELIVERY' | 'BANQUET'>;
  isActive?: boolean;
  startDate?: string | null;
  endDate?: string | null;
  restaurantIds?: string[];
  networkId?: string;
}

export interface SurchargeResponse {
  id: string;
  title: string;
  description: string | null;
  type: 'FIXED' | 'PERCENTAGE';
  amount: number;
  orderTypes: Array<'DINE_IN' | 'TAKEAWAY' | 'DELIVERY' | 'BANQUET'>;
  isActive: boolean;
  startDate: string | null;
  endDate: string | null;
  networkId: string | null; 
  createdAt: string;
  updatedAt: string;
  network?: NetworkInfo; 
  restaurants?: Array<{
    restaurant: {
      id: string;
      title: string;
    };
  }>;
}

export interface AssignRestaurantsDto {
  restaurantIds: string[];
}

export interface GetForOrderParams {
  orderType: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY' | 'BANQUET';
  restaurantId?: string;
  networkId?: string;
}

export const SurchargeService = {
  // Получение всех надбавок с фильтрацией по сети
  getAll: async (networkId?: string, searchTerm?: string): Promise<SurchargeResponse[]> => {
    const { data } = await api.get('/surcharges', {
      params: { 
        networkId,
        searchTerm 
      }
    });
    return data;
  },

  // Получение надбавки по ID
  getById: async (id: string): Promise<SurchargeResponse> => {
    const { data } = await api.get(`/surcharges/${id}`);
    return data;
  },

  // Создание новой надбавки
  create: async (dto: SurchargeDto): Promise<SurchargeResponse> => {
    const { data } = await api.post('/surcharges', dto);
    return data;
  },

  // Обновление надбавки
  update: async (id: string, dto: Partial<SurchargeDto>): Promise<SurchargeResponse> => {
    const { data } = await api.patch(`/surcharges/${id}`, dto);
    return data;
  },

  // Удаление надбавки
  delete: async (id: string): Promise<void> => {
    await api.delete(`/surcharges/${id}`);
  },

  // Получение надбавок для типа заказа
  getForOrderType: async (
    params: GetForOrderParams
  ): Promise<SurchargeResponse[]> => {
    const { data } = await api.get(`/surcharges/for-order/${params.orderType}`, {
      params: { 
        restaurantId: params.restaurantId,
        networkId: params.networkId
      }
    });
    return data;
  },

  // НОВЫЙ МЕТОД: Получение надбавок по сети
  getByNetwork: async (
    networkId: string, 
    activeOnly: boolean = true
  ): Promise<SurchargeResponse[]> => {
    const { data } = await api.get(`/surcharges/network/${networkId}`, {
      params: { activeOnly }
    });
    return data;
  },

  // Назначение ресторанов надбавке
  assignRestaurants: async (surchargeId: string, dto: AssignRestaurantsDto): Promise<void> => {
    await api.post(`/surcharges/${surchargeId}/restaurants`, dto);
  },

  // Удаление ресторанов из надбавки
  removeRestaurants: async (surchargeId: string, restaurantIds: string[]): Promise<void> => {
    await api.delete(`/surcharges/${surchargeId}/restaurants`, { 
      data: { restaurantIds } 
    });
  },

  // Получение ресторанов для надбавки
  getRestaurants: async (surchargeId: string): Promise<Array<{
    id: string;
    title: string;
  }>> => {
    const { data } = await api.get(`/surcharges/${surchargeId}/restaurants`);
    return data;
  },

  // Активация/деактивация надбавки
  toggleStatus: async (id: string, isActive: boolean): Promise<SurchargeResponse> => {
    const { data } = await api.patch(`/surcharges/${id}/status`, { isActive });
    return data;
  },

  // Получение доступных типов надбавок
  getTypes: async (): Promise<Array<'FIXED' | 'PERCENTAGE'>> => {
    return ['FIXED', 'PERCENTAGE'];
  },

  // Получение доступных типов заказов
  getOrderTypes: async (): Promise<Array<'DINE_IN' | 'TAKEAWAY' | 'DELIVERY' | 'BANQUET'>> => {
    return ['DINE_IN', 'TAKEAWAY', 'DELIVERY', 'BANQUET'];
  },

  // Вспомогательный метод: проверка активности надбавки
  isSurchargeActive: (surcharge: SurchargeResponse): boolean => {
    if (!surcharge.isActive) return false;
    
    const now = new Date();
    
    // Проверка даты начала
    if (surcharge.startDate) {
      const startDate = new Date(surcharge.startDate);
      if (now < startDate) return false;
    }
    
    // Проверка даты окончания
    if (surcharge.endDate) {
      const endDate = new Date(surcharge.endDate);
      if (now > endDate) return false;
    }
    
    return true;
  },

};