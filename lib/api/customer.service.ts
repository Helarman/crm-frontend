import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

export interface CustomerDto {
  id: string;
  phone: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  birthday?: Date;

  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
  networks?: NetworkCustomerInfo[];
  networkId?: string;
}

export interface NetworkCustomerInfo {
  networkId: string;
  networkName?: string;
  balance?: number;
  personalDiscounts?: PersonalDiscountDto[];
}

export interface PersonalDiscountDto {
  id: string;
  customerId: string;
  restaurantId: string;
  restaurantName?: string;
  discount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface BonusTransactionDto {
  id: string;
  customerId: string;
  networkId: string;
  networkName?: string;
  type: 'EARN' | 'SPEND' | 'ADJUSTMENT' | 'EXPIRATION';
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  orderId?: string;
  description?: string;
  reason?: string;
  createdAt: Date;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CustomerLoyaltySummary {
  customer: CustomerDto;
  totalBonusPoints: number;
  networksCount: number;
  averagePersonalDiscount: number;
  totalTransactions: number;
  lastTransactionDate?: Date;
}

export interface ShortCodeResponseDto {
  shortCode: string;
  expiresAt: Date;
  customerId: string;
}

export interface UpdatePersonalDiscountDto {
  discount: number;
}

export interface EarnBonusPointsDto {
  amount: number;
  orderId?: string;
  description?: string;
}

export interface SpendBonusPointsDto {
  amount: number;
  orderId?: string;
  description?: string;
}

export interface AdjustBonusBalanceDto {
  amount: number;
  reason: string;
}

export const CustomerService = {
  // ========== ПОИСК И ПОЛУЧЕНИЕ КЛИЕНТОВ ==========
  requestCode: async(dto:any): Promise<CustomerDto> =>{
    const {data} = await api.post(`/customers/request-code`, {dto})
    return data
  },
  /**
   * Получить клиента по 4-символьному коду
   */
  getByShortCode: async (code: string): Promise<CustomerDto> => {
    const { data } = await api.get(`/customers/short-code/${code}`);
    return data;
  },

  /**
   * Поиск клиента по номеру телефона во всех сетях
   */
  searchByPhone: async (phone: string): Promise<CustomerDto[]> => {
    const { data } = await api.get(`/customers/search/${phone}`);
    return data.data;
  },

  /**
   * Получить всех клиентов в сети с пагинацией
   */
  getAllByNetwork: async (
    networkId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<PaginatedResponse<CustomerDto>> => {
    const { data } = await api.get(`/customers/networks/${networkId}/customers`, {
      params: { page, limit }
    });
    return data;
  },

  /**
   * Получить клиента по номеру телефона в конкретной сети
   */
  getByPhoneAndNetwork: async (phone: string, networkId: string): Promise<CustomerDto> => {
    const { data } = await api.get(`/customers/networks/${networkId}/customers/${phone}`);
    return data;
  },

  // ========== КРАТКИЙ КОД ==========

  /**
   * Сгенерировать новый 4-символьный код для клиента
   */
  generateShortCode: async (customerId: string): Promise<ShortCodeResponseDto> => {
    const { data } = await api.post(`/customers/${customerId}/short-code`);
    return data;
  },

  // ========== СВОДНАЯ ИНФОРМАЦИЯ ==========

  /**
   * Получить сводную информацию о лояльности клиента
   */
  getLoyaltySummary: async (customerId: string): Promise<CustomerLoyaltySummary> => {
    const { data } = await api.get(`/customers/${customerId}/summary`);
    return data;
  },

  // ========== ПЕРСОНАЛЬНЫЕ СКИДКИ ==========

  /**
   * Получить все персональные скидки клиента
   */
  getPersonalDiscounts: async (customerId: string): Promise<PersonalDiscountDto[]> => {
    const { data } = await api.get(`/customers/${customerId}/discounts`);
    return data.data;
  },

  /**
   * Получить персональную скидку для конкретного ресторана
   */
  getPersonalDiscount: async (
    customerId: string,
    restaurantId: string
  ): Promise<PersonalDiscountDto> => {
    const { data } = await api.get(`/customers/${customerId}/discounts/${restaurantId}`);
    return data;
  },

  /**
   * Установить/обновить персональную скидку для ресторана
   */
  setPersonalDiscount: async (
    customerId: string,
    restaurantId: string,
    discount: number
  ): Promise<PersonalDiscountDto> => {
    const { data } = await api.patch(
      `/customers/${customerId}/discounts/${restaurantId}`,
      { discount }
    );
    return data;
  },

  // ========== БОНУСНЫЕ БАЛЛЫ ==========

  /**
   * Получить все бонусные балансы клиента по сетям
   */
  getBonusBalances: async (customerId: string): Promise<NetworkCustomerInfo[]> => {
    const { data } = await api.get(`/customers/${customerId}/bonuses`);
    return data;
  },

  /**
   * Получить бонусный баланс в конкретной сети
   */
  getBonusBalance: async (
    customerId: string,
    networkId: string
  ): Promise<NetworkCustomerInfo> => {
    const { data } = await api.get(`/customers/${customerId}/bonuses/${networkId}`);
    return data;
  },

  /**
   * Начислить бонусные баллы
   */
  earnBonusPoints: async (
    customerId: string,
    networkId: string,
    amount: number,
    orderId?: string,
    description?: string
  ): Promise<BonusTransactionDto> => {
    const { data } = await api.post(
      `/customers/${customerId}/bonuses/${networkId}/earn`,
      { amount, orderId, description }
    );
    return data;
  },

  /**
   * Списать бонусные баллы
   */
  spendBonusPoints: async (
    customerId: string,
    networkId: string,
    amount: number,
    orderId?: string,
    description?: string
  ): Promise<BonusTransactionDto> => {
    const { data } = await api.post(
      `/customers/${customerId}/bonuses/${networkId}/spend`,
      { amount, orderId, description }
    );
    return data;
  },

  /**
   * Скорректировать бонусный баланс (административная операция)
   */
  adjustBonusBalance: async (
    customerId: string,
    networkId: string,
    amount: number,
    reason: string
  ): Promise<BonusTransactionDto> => {
    const { data } = await api.patch(
      `/customers/${customerId}/bonuses/${networkId}/adjust`,
      { amount, reason }
    );
    return data;
  },

  // ========== ИСТОРИЯ ТРАНЗАКЦИЙ ==========

  /**
   * Получить историю бонусных транзакций
   */
  getTransactions: async (
    customerId: string,
    networkId?: string,
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedResponse<BonusTransactionDto>> => {
    const { data } = await api.get(`/customers/${customerId}/transactions`, {
      params: { networkId, page, limit }
    });
    return data;
  },

  // ========== УТИЛИТНЫЕ МЕТОДЫ ==========

  /**
   * Форматировать номер телефона
   */
  formatPhone: (phone: string): string => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return `+${cleaned[0]} (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7, 9)}-${cleaned.slice(9)}`;
    }
    return phone;
  },

  /**
   * Форматировать дату
   */
  formatDate: (date: Date | string): string => {
    const d = new Date(date);
    return d.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  },

  /**
   * Форматировать дату и время
   */
  formatDateTime: (date: Date | string): string => {
    const d = new Date(date);
    return d.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  /**
   * Рассчитать возраст по дате рождения
   */
  calculateAge: (birthday: Date | string): number => {
    const birthDate = new Date(birthday);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  },


  /**
   * Получить среднюю персональную скидку по всем ресторанам
   */
  getAveragePersonalDiscount: (customer: CustomerDto): number => {
    const discounts = customer.networks?.flatMap(network => 
      network.personalDiscounts?.map(d => d.discount) || []
    ) || [];
    
    if (discounts.length === 0) return 0;
    
    const sum = discounts.reduce((total, discount) => total + discount, 0);
    return Math.round((sum / discounts.length) * 10) / 10; // Округляем до 1 знака после запятой
  },


  /**
   * Получить максимальную скидку клиента в конкретной сети
   */
  getNetworkDiscount: (customer: CustomerDto, networkId: string): number => {
    const network = customer.networks?.find(n => n.networkId === networkId);
    if (!network || !network.personalDiscounts?.length) return 0;
    
    return Math.max(...network.personalDiscounts.map(d => d.discount));
  },

  /**
   * Проверить, есть ли клиент в сети
   */
  isInNetwork: (customer: CustomerDto, networkId: string): boolean => {
    return customer.networks?.some(n => n.networkId === networkId) || false;
  },
};