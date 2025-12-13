import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});
export interface GetNetworkTransactionsParams {
  types?: string[]; // Можно передать как 'DEPOSIT,WITHDRAWAL' или ['DEPOSIT', 'WITHDRAWAL']
  minAmount?: number;
  maxAmount?: number;
  minBalanceAfter?: number;
  maxBalanceAfter?: number;
  startDate?: string;
  endDate?: string;
  createdById?: string;
  referenceType?: string;
  referenceId?: string;
  search?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'amount' | 'type' | 'balanceAfter';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  page?: number;
  includeSummary?: boolean;
  includeCreator?: boolean;
  groupBy?: 'day' | 'month' | 'year';
  lastNDays?: number;
}

export interface GetNetworkTransactionsResponse {
  transactions: NetworkTransaction[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  summary?: {
    totalDeposits: number;
    totalWithdrawals: number;
    netChange: number;
    averageAmount: number;
    totalTransactions: number;
    depositCount: number;
    withdrawalCount: number;
    depositAverage: number;
    withdrawalAverage: number;
    dateRange?: {
      from: string;
      to: string;
    };
  };
}

export interface GroupedTransactionsResponse {
  groupedTransactions: Array<{
    date: string;
    totalDeposits: number;
    totalWithdrawals: number;
    netChange: number;
    count: number;
    transactions?: NetworkTransaction[];
  }>;
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface Network {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  owner: any;
  tenantId?: string;
  logo?: string;
  primaryColor: string;
  balance: number;
  isBlocked: boolean;
  createdAt: string;
  updatedAt: string;
  // Заменяем массив тарифов на один текущий тариф
  currentTariff?: NetworkTariff;
  currentTariffId?: string;
  _count?: {
    restaurants: number;
    transactions: number;
  };
}

export interface NetworkTariff {
  id: string;
  name: string;
  price: number;
  period: 'month' | 'quarter' | 'year';
  features?: string;
  isActive: boolean;
  // Убираем networkId, так как тариф теперь независим
  createdAt: string;
  updatedAt: string;
  _count?: {
    networks: number; // Количество сетей, использующих этот тариф
  };
  networks?: Network[]; // Сети, использующие этот тариф
}

export interface CreateNetworkDto {
  name: string;
  description?: string;
  ownerId: string;
  tenantId?: string | null;
  logo?: string;
  primaryColor?: string;
  currentTariffId?: string; // Добавляем возможность указать тариф при создании
}

export interface UpdateNetworkDto extends Partial<CreateNetworkDto> {}

export interface NetworkWithRestaurants extends Network {
  restaurants?: any[];
}

export interface NetworkTransaction {
  id: string;
  type: 'DEPOSIT' | 'WITHDRAWAL';
  amount: number;
  description?: string;
  balanceAfter: number;
  createdById?: string;
  createdBy?: any;
  referenceType?: string;
  referenceId?: string;
  networkId: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateNetworkDto extends Partial<CreateNetworkDto> {}

export interface UpdateNetworkBalanceDto {
  operation: 'DEPOSIT' | 'WITHDRAWAL';
  amount: number;
  reason?: string;
  performedById?: string;
}

export interface ToggleNetworkBlockDto {
  isBlocked: boolean;
}

export interface CreateNetworkTariffDto {
  name: string;
  price: number;
  period?: 'month' | 'quarter' | 'year';
  features?: string;
  isActive?: boolean;
}

export interface UpdateNetworkTariffDto extends Partial<CreateNetworkTariffDto> {}

export const NetworkService = {
  async getAll(): Promise<Network[]> {
    const { data } = await api.get('/networks');
    return data;
  },

  async getByUser(userId: string): Promise<Network[]> {
    const { data } = await api.get(`/networks/user/${userId}`);
    return data;
  },

  async getById(id: string): Promise<Network> {
    const { data } = await api.get(`/networks/${id}`);
    return data;
  },

  async create(dto: CreateNetworkDto): Promise<Network> {
    const { data } = await api.post('/networks', dto);
    return data;
  },

  async update(id: string, dto: UpdateNetworkDto): Promise<Network> {
    const { data } = await api.put(`/networks/${id}`, dto);
    return data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/networks/${id}`);
  },

  async getRestaurants(networkId: string): Promise<any[]> {
    const { data } = await api.get(`/networks/${networkId}/restaurants`);
    return data;
  },

  async addUser(networkId: string, userId: string): Promise<void> {
    await api.post(`/networks/${networkId}/users`, { userId });
  },

  async removeUser(networkId: string, userId: string): Promise<void> {
    await api.delete(`/networks/${networkId}/users/${userId}`);
  },

  // Новые методы для баланса
  async updateBalance(
    networkId: string, 
    dto: UpdateNetworkBalanceDto
  ): Promise<Network> {
    const { data } = await api.put(`/networks/${networkId}/balance`, dto);
    return data;
  },

  async getTransactions(networkId: string): Promise<NetworkTransaction[]> {
    const { data } = await api.get(`/networks/${networkId}/transactions`);
    return data;
  },

  // Методы для блокировки/разблокировки
  async toggleBlock(
    networkId: string, 
    dto: ToggleNetworkBlockDto
  ): Promise<Network> {
    const { data } = await api.put(`/networks/${networkId}/block`, dto);
    return data;
  },

  // === ОБНОВЛЕННЫЕ МЕТОДЫ ДЛЯ ТАРИФОВ ===

  // Получить все тарифы (независимо от сети)
  async getAllTariffs(): Promise<NetworkTariff[]> {
    const { data } = await api.get('/networks/tariffs/all');
    return data;
  },

  // Получить тариф по ID
  async getTariffById(tariffId: string): Promise<NetworkTariff> {
    const { data } = await api.get(`/networks/tariffs/${tariffId}`);
    return data;
  },

  // Создать новый тариф
  async createTariff(dto: CreateNetworkTariffDto): Promise<NetworkTariff> {
    const { data } = await api.post('/networks/tariffs', dto);
    return data;
  },

  // Обновить тариф
  async updateTariff(
    tariffId: string, 
    dto: UpdateNetworkTariffDto
  ): Promise<NetworkTariff> {
    const { data } = await api.put(`/networks/tariffs/${tariffId}`, dto);
    return data;
  },

  // Удалить тариф
  async deleteTariff(tariffId: string): Promise<void> {
    await api.delete(`/networks/tariffs/${tariffId}`);
  },

  // Получить сети, использующие определенный тариф
  async getNetworksByTariff(tariffId: string): Promise<Network[]> {
    const { data } = await api.get(`/networks/tariffs/${tariffId}/networks`);
    return data;
  },

  // Назначить тариф сети
  async assignTariffToNetwork(
    networkId: string,
    tariffId: string
  ): Promise<Network> {
    const { data } = await api.put(`/networks/${networkId}/tariff/${tariffId}`);
    return data;
  },

  // Убрать тариф у сети
  async removeTariffFromNetwork(networkId: string): Promise<Network> {
    const { data } = await api.delete(`/networks/${networkId}/tariff`);
    return data;
  },

  // Получить текущий тариф сети
  async getNetworkCurrentTariff(networkId: string): Promise<NetworkTariff> {
    const { data } = await api.get(`/networks/${networkId}/active-tariff`);
    return data;
  },


  async getNetworkTransactions (networkId: string, params?: GetNetworkTransactionsParams): Promise<GetNetworkTransactionsResponse>  {
    try {
      const queryParams = params;
      const { data } = await api.get(`/networks/${networkId}/transactions`, {
        params: queryParams,
        paramsSerializer: (params) => {
          return Object.entries(params)
            .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
            .join('&');
        }
      });
      return data;
    } catch (error) {
      console.error('Ошибка при получении транзакций сети:', error);
      throw error;
    }
  }
};

