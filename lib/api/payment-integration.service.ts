  import axios from 'axios';

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  export const api = axios.create({
    baseURL: API_URL,
    withCredentials: true,
  });

  api.interceptors.request.use((config) => {
    const token = getAccessTokenFromCookie(); //
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

export enum PaymentProviderType {
  YOOKASSA = 'YOOKASSA',
  CLOUDPAYMENTS = 'CLOUDPAYMENTS', 
  SBERBANK = 'SBERBANK',
  ALFABANK = 'ALFABANK',
  SBP = 'SBP',
  TINKOFF = 'TINKOFF'
}

export interface CreatePaymentIntegrationDto {
  name: string;
  provider: PaymentProviderType;
  isActive?: boolean;
  isTestMode?: boolean;
  
  // ЮKassa
  yookassaShopId?: string;
  yookassaSecretKey?: string;
  
  // CloudPayments
  cloudpaymentsPublicId?: string;
  cloudpaymentsApiSecret?: string;
  
  // Сбербанк
  sberbankLogin?: string;
  sberbankPassword?: string;
  sberbankToken?: string;
  sberbankMerchantLogin?: string;
  
  // Альфа-банк
  alfabankLogin?: string;
  alfabankPassword?: string;
  alfabankToken?: string;
  alfabankRefreshToken?: string;
  alfabankGatewayMerchantId?: string;
  alfabankRestApiUrl?: string;
  
  // СБП
  sbpMerchantId?: string;
  sbpSecretKey?: string;
  sbpBankName?: string;
  sbpApiUrl?: string;
  sbpQrIssuerId?: string;
  
  // Тинькофф
  tinkoffTerminalKey?: string;
  tinkoffPassword?: string;
  
  // URLы
  webhookUrl?: string;
  successUrl?: string;
  failUrl?: string;
}

export interface UpdatePaymentIntegrationDto extends Partial<CreatePaymentIntegrationDto> {}

export interface PaymentIntegration {
  id: string;
  name: string;
  provider: PaymentProviderType;
  isActive: boolean;
  isTestMode: boolean;
  restaurantId: string;
  createdAt: string;
  updatedAt: string;
  
  // Поля провайдеров
  yookassaShopId?: string;
  yookassaSecretKey?: string;
  cloudpaymentsPublicId?: string;
  cloudpaymentsApiSecret?: string;
  sberbankLogin?: string;
  sberbankPassword?: string;
  sberbankToken?: string;
  sberbankMerchantLogin?: string;
  alfabankLogin?: string;
  alfabankPassword?: string;
  alfabankToken?: string;
  alfabankRefreshToken?: string;
  alfabankGatewayMerchantId?: string;
  alfabankRestApiUrl?: string;
  sbpMerchantId?: string;
  sbpSecretKey?: string;
  sbpBankName?: string;
  sbpApiUrl?: string;
  sbpQrIssuerId?: string;
  tinkoffTerminalKey?: string;
  tinkoffPassword?: string;
  webhookUrl?: string;
  successUrl?: string;
  failUrl?: string;
  
  restaurant?: {
    id: string;
    title: string;
  };
}

export const PaymentIntegrationService = {
  // Создание интеграции
  create: async (restaurantId: string, dto: CreatePaymentIntegrationDto): Promise<PaymentIntegration> => {
    const { data } = await api.post(`/restaurants/${restaurantId}/payment-integrations`, dto);
    return data;
  },

  // Получение всех интеграций ресторана
  getAll: async (restaurantId: string): Promise<PaymentIntegration[]> => {
    const { data } = await api.get(`/restaurants/${restaurantId}/payment-integrations`);
    return data;
  },

  // Получение интеграции по ID
  getById: async (id: string): Promise<PaymentIntegration> => {
    const { data } = await api.get(`/payment-integrations/${id}`);
    return data;
  },

  // Получение активной интеграции по типу провайдера
  getActiveByProvider: async (restaurantId: string, provider: PaymentProviderType): Promise<PaymentIntegration | null> => {
    const { data } = await api.get(`/restaurants/${restaurantId}/payment-integrations/provider/${provider}`);
    return data;
  },

  // Обновление интеграции
  update: async (restaurantId: string, id: string, dto: UpdatePaymentIntegrationDto): Promise<PaymentIntegration> => {
    const { data } = await api.patch(`/restaurants/${restaurantId}/payment-integrations/${id}`, dto);
    return data;
  },

  // Удаление интеграции
  delete: async (restaurantId: string, id: string): Promise<void> => {
    await api.delete(`/restaurants/${restaurantId}/payment-integrations/${id}`);
  },

  // Включение/выключение интеграции
  toggleStatus: async (restaurantId: string, id: string, isActive: boolean): Promise<PaymentIntegration> => {
    const { data } = await api.put(`/restaurants/${restaurantId}/payment-integrations/${id}/toggle`, { isActive });
    return data;
  },

  // Получение интеграции ресторана (с проверкой на существование)
  getIntegration: async (restaurantId: string, provider: PaymentProviderType): Promise<PaymentIntegration | null> => {
    try {
      return await PaymentIntegrationService.getActiveByProvider(restaurantId, provider);
    } catch (error) {
      throw error;
    }
  },

  // Проверка, есть ли активная интеграция
  hasActiveIntegration: async (restaurantId: string, provider: PaymentProviderType): Promise<boolean> => {
    try {
      const integration = await PaymentIntegrationService.getActiveByProvider(restaurantId, provider);
      return !!integration && integration.isActive;
    } catch (error) {
      return false;
    }
  },

  // Получение настроек для конкретного провайдера
  getProviderConfig: async (restaurantId: string, provider: PaymentProviderType) => {
    const integration = await PaymentIntegrationService.getActiveByProvider(restaurantId, provider);
    
    if (!integration) {
      throw new Error(`Integration for ${provider} not found`);
    }

    // Возвращаем только нужные поля для конкретного провайдера
    switch (provider) {
      case PaymentProviderType.YOOKASSA:
        return {
          shopId: integration.yookassaShopId,
          secretKey: integration.yookassaSecretKey,
          isTestMode: integration.isTestMode
        };
      
      case PaymentProviderType.CLOUDPAYMENTS:
        return {
          publicId: integration.cloudpaymentsPublicId,
          apiSecret: integration.cloudpaymentsApiSecret,
          isTestMode: integration.isTestMode
        };
      
      case PaymentProviderType.SBERBANK:
        return {
          login: integration.sberbankLogin,
          password: integration.sberbankPassword,
          token: integration.sberbankToken,
          merchantLogin: integration.sberbankMerchantLogin,
          isTestMode: integration.isTestMode
        };
      
      case PaymentProviderType.ALFABANK:
        return {
          login: integration.alfabankLogin,
          password: integration.alfabankPassword,
          token: integration.alfabankToken,
          refreshToken: integration.alfabankRefreshToken,
          gatewayMerchantId: integration.alfabankGatewayMerchantId,
          apiUrl: integration.alfabankRestApiUrl,
          isTestMode: integration.isTestMode
        };
      
      case PaymentProviderType.SBP:
        return {
          merchantId: integration.sbpMerchantId,
          secretKey: integration.sbpSecretKey,
          bankName: integration.sbpBankName,
          apiUrl: integration.sbpApiUrl,
          qrIssuerId: integration.sbpQrIssuerId,
          isTestMode: integration.isTestMode
        };
      
      case PaymentProviderType.TINKOFF:
        return {
          terminalKey: integration.tinkoffTerminalKey,
          password: integration.tinkoffPassword,
          isTestMode: integration.isTestMode
        };
      
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }
};