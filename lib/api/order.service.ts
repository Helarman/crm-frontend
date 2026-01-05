  import axios from 'axios';
  import { DiscountResponseDto, OrderType } from './discount.service';
  import { OrderItem } from '../types/order';

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

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

  export interface AssignCourierDto {
    courierId: string;
  }

  export interface DeliveryCourierDto {
    id: string;
    name: string;
    phone: string;
  }

  export interface DeliveryInfoExtendedDto {
    address: string;
    time?: Date;
    notes?: string;
    startedAt?: Date;
    courier?: DeliveryCourierDto;
  }

  export interface UpdateOrderItemDto {
    comment?: string;
    additiveIds?: string[];
  }

  export interface RefundItemDto {
    reason: string;
    userId?: string;
  }

  export enum EnumOrderType {
    DINE_IN = 'DINE_IN',
    TAKEAWAY = 'TAKEAWAY',
    DELIVERY = 'DELIVERY',
    BANQUET = 'BANQUET'
  }

  export enum EnumPaymentMethod {
    CASH = 'CASH',
    CARD = 'CARD',
    //ONLINE = 'ONLINE'
  }

  export interface UpdateOrderItemStatusDto {
    status: string;
    userId?: string;
    description?: string;
  }

  export enum OrderItemStatus {
    CREATED = 'CREATED',
    IN_PROGRESS = 'IN_PROGRESS',
    CONFIRMED='CONFIRMED',
    PARTIALLY_DONE = 'PARTIALLY_DONE',
    PAUSED = 'PAUSED',
    COMPLETED = 'COMPLETED',
    CANCELLED = 'CANCELLED',
    REFUNDED = 'REFUNDED'
    
  }

  export interface OrderItemDto {
    id: string;
    title: string;
    type?: string
    product: OrderItemProductDto;
    quantity: number;
    comment?: string;
    additives: OrderItemAdditiveDto[];
    totalPrice: number;
    status: any;
    workshops: any;
    createdAt: Date;
    user?: { 
      id: string;
      name: string;
    };
  }


  export enum EnumOrderStatus {
    CREATED = 'CREATED',
    CONFIRMED = 'CONFIRMED',
    PREPARING = 'PREPARING',
    READY = 'READY',
    DELIVERING = 'DELIVERING',
    COMPLETED = 'COMPLETED',
    CANCELLED = 'CANCELLED'
  }

  export interface OrderItemAdditiveDto {
    id: string;
    title: string
    name: string;
    price: number;
  }

  export interface OrderItemProductDto {
    id: string
    title: string
    workshops: any;
    ingredients: any;
    price: number
    restaurantPrices: {
      price: number
      restaurantId: string
      isStopList: boolean
    }[]
  }

  export interface AttentionFlagsDto {
    isReordered?: boolean;
    hasDiscount?: boolean;
    discountCanceled?: boolean;
    isPrecheck?: boolean;
    isRefund?: boolean;
  }

  export interface OrderItemDto {
    id: string;
    product: OrderItemProductDto;
    quantity: number;
    comment?: string;
    additives: OrderItemAdditiveDto[];
    totalPrice: number;
  }

  export interface PaymentDto {
    id: string;
    method: EnumPaymentMethod;
    amount: number;
    status: string;
    externalId?: string;
    processedAt?: Date;
    createdAt: Date;
  }

  export interface CustomerDto {
    id: string;
    name: string;
    phone: string;
    email?: string;
  }

  export interface RestaurantDto {
    id: string;
    title: string;
    network: any;
    legalInfo: string;
    address: string;
  }

  export interface DeliveryInfoDto {
    address: string;
    time?: Date;
    notes?: string;
    courier?: {
      id: string;
      name: string;
      phone: string;
    };
  }

  export interface CreateOrderItemDto {
    productId: string;
    quantity: number;
    comment?: string;
    additiveIds?: string[];
  }

  export interface CreatePaymentDto {
    method: EnumPaymentMethod;
    externalId?: string;
  }

  export interface CreateOrderDto {
    customerId?: string;
    restaurantId: string;
    shiftId?: string;
    type: EnumOrderType;
    items: CreateOrderItemDto[];
    scheduledAt?: Date;
    comment?: string;
    phone?: string;
    payment?: CreatePaymentDto;
    deliveryAddress?: string;
    deliveryTime?: Date;
    deliveryNotes?: string;
  }

  export interface UpdateOrderStatusDto {
    status: string;
  }

  export interface OrderResponse {
    totalAmount: number
    discountAmount: number
    bonusPointsUsed: number
    orderAdditives: any
    source: string
    tableNumber?: string;
    numberOfPeople?: string;
    id: string;
    number: number;
    status: EnumOrderStatus;
    type: EnumOrderType;
    createdAt: Date;
    updatedAt: Date;
    scheduledAt?: Date;
    comment?: string;
    isScheduled?: boolean
    customer?: Customer;
    restaurant: RestaurantDto;
    items: OrderItem[];
    payment?: PaymentDto;
    delivery?: DeliveryInfoExtendedDto;
    
    totalPrice: number;
    totalItems: number;
    surcharges?: {
      id: string;
      surchargeId: string;
      title: string;
      amount: number;
      type: 'FIXED' | 'PERCENTAGE';
      description?: string;
    }[];
    attentionFlags: AttentionFlagsDto;
    deliveryAddress: string;
    deliveryNotes: string;
    deliveryTime: string;
  }

  export interface OrderListResponse {
    items: OrderResponse[];
    total: number;
    page: number;
    limit: number;
  }

  export interface OrderFilterParams {
    status?: EnumOrderStatus;
    type?: EnumOrderType;
    restaurantId?: string;
    customerId?: string;
    fromDate?: Date;
    toDate?: Date;
    page?: number;
    limit?: number;
  }
  export interface GetOrdersParams {
    restaurantId: string;
    status?: string; 
  }

  export interface AddItemToOrderDto {
    productId: string;
    quantity: number;
    additiveIds?: string[];
    comment?: string;
  }

  export interface UpdateOrderDto {
    type?: OrderType;
    customerPhone?: string;
    customerId?: string | null;
    numberOfPeople?: number;
    tableNumber?: string;
    comment?: string;
    deliveryAddress?: string;
    deliveryTime?: string;
    deliveryNotes?: string;
    scheduledAt?: string;
    shiftId?: string;
    payment?: {
      method: EnumPaymentMethod;
    };
  }

  export interface OrderArchiveFilterParams {
    startDate?: string;
    endDate?: string;
    isReordered?: boolean;
    hasDiscount?: boolean;
    discountCanceled?: boolean;
    isRefund?: boolean;
    status?: EnumOrderStatus[];
    searchQuery?: string;
    page?: number;
    limit?: number;
  }

  export interface PaginatedMeta {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }

  export interface PaginatedResponse<T> {
    data: T[];
    meta: PaginatedMeta;
  }

  export interface CreateOrderLogDto {
    orderId: string;
    action: string;
    userId?: string;
    details?: Record<string, any>;
    status?: string;
  }

  export interface OrderLogResponseDto {
    id: string;
    orderId: string;
    action: string;
    userId?: string;
    details?: Record<string, any>;
    status?: string;
    createdAt: Date;
    updatedAt: Date;
  }


  export interface OrderArchiveResponse extends PaginatedResponse<OrderResponse> {}

  export interface Customer {
    id: string;
    name: string;
    bonusPoints: number;
    pointsUsed: number;
  discountApplied: number;
  personalDiscount: number;
  phone: string;
  }

  export const OrderService = {
    /**
     * Создание нового заказа
     */
    create: async (dto: any): Promise<OrderResponse> => {
      const { data } = await api.post<OrderResponse>('/orders', dto);
      return data;
    },

    /**
     * Получение информации о заказе по ID
     */
    getById: async (id: string): Promise<OrderResponse> => {
      const { data } = await api.get<OrderResponse>(`/orders/${id}`);
      return data;
    },

    assignOrderToShift: async (orderId: string, shiftId: string): Promise<OrderResponse> => {
      try {
        const { data } = await api.patch<OrderResponse>(
          `/orders/${orderId}/shift`,
          { shiftId }
        );
        return data;
      } catch (error) {
        console.error('Failed to assign order to shift:', error);
        throw error;
      }
    },

    /**
     * Обновление статуса заказа
     */
    updateStatus: async (id: string, dto: UpdateOrderStatusDto): Promise<OrderResponse> => {
      
      if (typeof dto?.status !== 'string') {
        console.error('Invalid status format:', dto);
        throw new Error('Status must be a string value');
      }
    
      // Нормализация статуса
      const normalizedStatus = String(dto.status).toUpperCase();
      
      const { data } = await api.patch<OrderResponse>(
        `/orders/${id}/status`,
        { status: normalizedStatus } // Явно передаем строку
      );
      
      return data;
    },

    /**
     * Получение списка заказов с фильтрацией
     */
    getList: async (params: OrderFilterParams): Promise<OrderListResponse> => {
      const { data } = await api.get<OrderListResponse>('/orders', { params });
      return data;
    },

    /**
     * Получение заказов пользователя
     */
    getUserOrders: async (userId: string, params?: Omit<OrderFilterParams, 'customerId'>): Promise<OrderListResponse> => {
      const { data } = await api.get<OrderListResponse>(`/orders/user/${userId}`, { 
        params: { ...params, customerId: userId } 
      });
      return data;
    },

    /**
     * Получение заказов ресторана
     */

    
    getRestaurantOrders: async (restaurantId: string) => {
      try {
        const url = `/orders/restaurant/${restaurantId}`;
        const response = await api.get(url);
        return response.data;
      } catch (error) {
        console.error('Failed to fetch orders:', error);
        throw error;
      }
    },

    /**
     * Отмена заказа
     */
    cancel: async (id: string): Promise<OrderResponse> => {
      const { data } = await api.patch<OrderResponse>(`/orders/${id}/cancel`);
      return data;
    },

    /**
     * Повтор заказа (на основе существующего)
     */
    repeat: async (id: string): Promise<OrderResponse> => {
      const { data } = await api.post<OrderResponse>(`/orders/${id}/repeat`);
      return data;
    },
    updateOrderItem: async (
      orderId: string,
      itemId: string,
      dto: UpdateOrderItemDto
    ): Promise<OrderResponse> => {
      const { data } = await api.patch<OrderResponse>(
        `/orders/${orderId}/items/${itemId}`,
        dto
      );
      return data;
    },
    updateItemStatus: async (
      orderId: string,
      itemId: string,
      dto: UpdateOrderItemStatusDto
    ): Promise<OrderResponse> => {
      const { data } = await api.patch<OrderResponse>(
        `/orders/${orderId}/items/${itemId}/status`,
        dto
      );
      return data;
    },
    /**
     * Получение заказов для кухни (только с определенными статусами)
     */
    getKitchenOrders: async (
      restaurantId: string,
      statuses: EnumOrderStatus[] = [EnumOrderStatus.CONFIRMED, EnumOrderStatus.PREPARING]
    ): Promise<OrderListResponse> => {
      const { data } = await api.get<OrderListResponse>(
        `/orders/restaurant/${restaurantId}/kitchen`,
        { params: { statuses: statuses.join(',') } }
      );
      return data;
    },

      addItemToOrder: async (orderId: string, item: AddItemToOrderDto): Promise<OrderResponse> => {
      try {
        const { data } = await api.post<OrderResponse>(
          `/orders/${orderId}/items`,
          item
        );
        return data;
      } catch (error) {
        console.error('Failed to add item to order:', error);
        throw error;
      }
    },
    
    removeItemFromOrder: async (orderId: string, itemId: string): Promise<OrderResponse> => {
      try {
        const { data } = await api.delete<OrderResponse>(
          `/orders/${orderId}/items/${itemId}`
        );
        return data;
      } catch (error) {
        console.error('Failed to remove item from order:', error);
        throw error;
      }
    },
    updateOrder: async (id: string, dto: UpdateOrderDto): Promise<OrderResponse> => {
      try {
        // Prepare the data for the API
        const requestData = {
          ...dto,
          // Convert deliveryTime to ISO string if it exists
          deliveryTime: dto.deliveryTime ? new Date(dto.deliveryTime).toISOString() : undefined,
          // Convert scheduledAt to ISO string if it exists
          scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt).toISOString() : undefined,
        };

        const { data } = await api.patch<OrderResponse>(`/orders/${id}`, requestData);
        return data;
      } catch (error) {
        console.error('Failed to update order:', error);
        throw error;
      }
    },

    updateAttentionFlags: async (
      orderId: string,
      dto: Partial<AttentionFlagsDto>
    ): Promise<OrderResponse> => {
      try {
        const { data } = await api.patch<OrderResponse>(
          `/orders/${orderId}/attention-flags`,
          dto
        );
        return data;
      } catch (error) {
        console.error('Failed to update attention flags:', error);
        throw error;
      }
    },

    /**
     * Установка флага дозаказа
     */
    setReorderedFlag: async (
      orderId: string,
      value: boolean
    ): Promise<OrderResponse> => {
      return OrderService.updateAttentionFlags(orderId, { isReordered: value });
    },

    /**
     * Установка флага пречека
     */
    setPrecheckFlag: async (
      orderId: string,
      value: boolean
    ): Promise<OrderResponse> => {
      return OrderService.updateAttentionFlags(orderId, { isPrecheck: value });
    },

    /**
     * Установка флага возврата
     */
    setRefundFlag: async (
      orderId: string,
      value: boolean
    ): Promise<OrderResponse> => {
      return OrderService.updateAttentionFlags(orderId, { isRefund: value });
    },

    /**
     * Установка флагов скидки
     */
    setDiscountFlags: async (
      orderId: string,
      hasDiscount: boolean,
      canceled: boolean = false
    ): Promise<OrderResponse> => {
      return OrderService.updateAttentionFlags(orderId, {
        hasDiscount,
        discountCanceled: canceled,
      });
    },

    /**
     * Возврат позиции
     */
    refundItem: async (
      orderId: string,
      itemId: string,
      dto: RefundItemDto
    ): Promise<OrderResponse> => {
      try {
        const { data } = await api.post<OrderResponse>(
          `/orders/${orderId}/items/${itemId}/refund`,
          dto
        );
        return data;
      } catch (error) {
        console.error('Failed to refund item:', error);
        throw error;
      }
    },
    /**
     * Получение активных заказов ресторана (за последние 2 дня)
     */
    getActiveRestaurantOrders: async (restaurantId: string): Promise<OrderResponse[]> => {
      try {
        const { data } = await api.get<OrderResponse[]>(
          `/orders/restaurant/${restaurantId}/active`
        );
        return data;
      } catch (error) {
        console.error('Failed to fetch active orders:', error);
        throw error;
      }
    },

    /**
     * Получение архива заказов ресторана с пагинацией и фильтрами
     */
    getRestaurantArchive: async (
      restaurantId: string,
      params: OrderArchiveFilterParams = {}
    ): Promise<OrderArchiveResponse> => {
      try {
        // Нормализация параметров
        const normalizedParams = {
          ...params,
          page: params.page || 1,
          limit: params.limit || 10,
        };

        const { data } = await api.get<OrderArchiveResponse>(
          `/orders/restaurant/${restaurantId}/archive`,
          { params: normalizedParams }
        );
        return data;
      } catch (error) {
        console.error('Failed to fetch order archive:', error);
        throw error;
      }
    },

    createLog: async (dto: CreateOrderLogDto): Promise<OrderLogResponseDto> => {
      try {
        const { data } = await api.post<OrderLogResponseDto>('/order-logs', dto);
        return data;
      } catch (error) {
        console.error('Failed to create order log:', error);
        throw error;
      }
    },

    /**
     * Получение логов для конкретного заказа
     */
    getOrderLogs: async (orderId: string): Promise<OrderLogResponseDto[]> => {
      try {
        const { data } = await api.get<OrderLogResponseDto[]>(`/order-logs/${orderId}`);
        return data;
      } catch (error) {
        console.error('Failed to fetch order logs:', error);
        throw error;
      }
    },

    applyCustomerToOrder: async (orderId: string, customerId: string): Promise<OrderResponse> => {
      try {
        const { data } = await api.patch<OrderResponse>(
          `/orders/${orderId}/customer`,
          { customerId }
        );
        return data;
      } catch (error) {
        console.error('Failed to apply customer to order:', error);
        throw error;
      }
    },

    /**
     * Применить скидку клиента к заказу
     */
    applyCustomerDiscount: async (orderId: string): Promise<OrderResponse> => {
      try {
        const { data } = await api.post<OrderResponse>(
          `/orders/${orderId}/apply-customer-discount`
        );
        return data;
      } catch (error) {
        console.error('Failed to apply customer discount:', error);
        throw error;
      }
    },

    /**
     * Применить бонусные баллы клиента к заказу
     */
    applyCustomerPoints: async (orderId: string, points: number): Promise<OrderResponse> => {
      try {
        const { data } = await api.post<OrderResponse>(
          `/orders/${orderId}/apply-points`,
          { points }
        );
        return data;
      } catch (error) {
        console.error('Failed to apply customer points:', error);
        throw error;
      }
    },

    /**
     * Удалить бонусные баллы из заказа
     */
    removeCustomerPoints: async (orderId: string): Promise<OrderResponse> => {
      try {
        const { data } = await api.delete<OrderResponse>(
          `/orders/${orderId}/remove-points`
        );
        return data;
      } catch (error) {
        console.error('Failed to remove customer points:', error);
        throw error;
      }
    },
    /**
     * Отвязать клиента от заказа
     */
    removeCustomerFromOrder: async (orderId: string): Promise<OrderResponse> => {
      try {
        const { data } = await api.delete<OrderResponse>(
          `/orders/${orderId}/customer`
        );
        return data;
      } catch (error) {
        console.error('Failed to remove customer from order:', error);
        throw error;
      }
    },

    /**
     * Удалить скидку клиента из заказа
     */
    removeCustomerDiscount: async (orderId: string): Promise<OrderResponse> => {
      try {
        const { data } = await api.delete<OrderResponse>(
          `/orders/${orderId}/discount`
        );
        return data;
      } catch (error) {
        console.error('Failed to remove customer discount:', error);
        throw error;
      }
    },

    applyDiscountToOrder: async (orderId: string, discountId: string): Promise<OrderResponse> => {
      try {
        const { data } = await api.post<OrderResponse>(
          `/orders/apply-to-order/${orderId}/${discountId}`,
        );
        return data;
      } catch (error) {
        console.error('Failed to apply discount to order:', error);
        throw error;
      }
    },
    removeDiscountFromOrder: async (orderId: string): Promise<OrderResponse> => {
      try {
        const { data } = await api.delete<OrderResponse>(
          `/orders/${orderId}/discount`
        );
        return data;
      } catch (error) {
        console.error('Failed to remove discount from order:', error);
        throw error;
      }
    },

    getAvailableDiscounts: async (restaurantId: string): Promise<DiscountResponseDto[]> => {
      try {
        const { data } = await api.get<DiscountResponseDto[]>(
          `/discounts/restaurant/${restaurantId}`
        );
        return data;
      } catch (error) {
        console.error('Failed to fetch available discounts:', error);
        throw error;
      }
    },

    getProductDiscounts: async (productIds: string[]): Promise<DiscountResponseDto[]> => {
      try {
        const { data } = await api.post<DiscountResponseDto[]>(
          '/discounts/products',
          { productIds }
        );
        return data;
      } catch (error) {
        console.error('Failed to fetch product discounts:', error);
        throw error;
      }
    },
    validateDiscount: async (orderId: string, discountId: string): Promise<{
      isValid: boolean;
      discountAmount?: number;
      message?: string;
    }> => {
      try {
        const { data } = await api.post<{
          isValid: boolean;
          discountAmount?: number;
          message?: string;
        }>(`/orders/${orderId}/validate-discount`, { discountId });
        return data;
      } catch (error) {
        console.error('Failed to validate discount:', error);
        throw error;
      }
    },

    calculateDiscountAmount: async (orderId: string, discountId: string): Promise<{
      amount: number;
      newTotal: number;
    }> => {
      try {
        const { data } = await api.post<{
          amount: number;
          newTotal: number;
        }>(`/orders/${orderId}/calculate-discount`, { discountId });
        return data;
      } catch (error) {
        console.error('Failed to calculate discount amount:', error);
        throw error;
      }
    },
    updateOrderItemQuantity: async (
      orderId: string,
      itemId: string,
      quantity: number,
      userId?: string
    ): Promise<OrderResponse> => {
      try {
        const { data } = await api.patch<OrderResponse>(
          `/orders/${orderId}/items/${itemId}/quantity`,
          { quantity, userId }
        );
        return data;
      } catch (error) {
        console.error('Failed to update item quantity:', error);
        throw error;
      }
    },

    /**
     * Частичный возврат позиции заказа
     */
    partialRefundOrderItem: async (
      orderId: string,
      itemId: string,
      quantity: number,
      reason: string,
      userId?: string
    ): Promise<OrderResponse> => {
      try {
        const { data } = await api.post<OrderResponse>(
          `/orders/${orderId}/items/${itemId}/partial-refund`,
          { quantity, reason, userId }
        );
        return data;
      } catch (error) {
        console.error('Failed to process partial refund:', error);
        throw error;
      }
    },
    /**
     * Увеличить количество позиции на указанное значение
     */
    increaseItemQuantity: async (
      orderId: string,
      itemId: string,
      increment: number = 1,
      userId?: string
    ): Promise<OrderResponse> => {
      // Сначала получаем текущее состояние заказа
      const order = await OrderService.getById(orderId);
      const item = order.items.find(i => i.id === itemId);
      
      if (!item) {
        throw new Error('Item not found');
      }

      const newQuantity = item.quantity + increment;
      return OrderService.updateOrderItemQuantity(
        orderId,
        itemId,
        newQuantity,
        userId
      );
    },

    /**
     * Уменьшить количество позиции на указанное значение
     */
    decreaseItemQuantity: async (
      orderId: string,
      itemId: string,
      decrement: number = 1,
      userId?: string
    ): Promise<OrderResponse> => {
      const order = await OrderService.getById(orderId);
      const item = order.items.find(i => i.id === itemId);
      
      if (!item) {
        throw new Error('Item not found');
      }

      const newQuantity = Math.max(1, item.quantity - decrement);
      return OrderService.updateOrderItemQuantity(
        orderId,
        itemId,
        newQuantity,
        userId
      );
    },

  assignCourierToDelivery: async (
    orderId: string,
    courierId: string
  ): Promise<OrderResponse> => {
    try {
      const { data } = await api.post<OrderResponse>(
        `/orders/${orderId}/assign-courier`,
        { courierId }
      );
      return data;
    } catch (error) {
      console.error('Failed to assign courier to delivery:', error);
      throw error;
    }
  },

  /**
   * Начать доставку
   */
  startDelivery: async (orderId: string): Promise<OrderResponse> => {
    try {
      const { data } = await api.post<OrderResponse>(
        `/orders/${orderId}/start-delivery`
      );
      return data;
    } catch (error) {
      console.error('Failed to start delivery:', error);
      throw error;
    }
  },

  /**
   * Завершить доставку
   */
  completeDelivery: async (orderId: string): Promise<OrderResponse> => {
    try {
      const { data } = await api.post<OrderResponse>(
        `/orders/${orderId}/complete-delivery`
      );
      return data;
    } catch (error) {
      console.error('Failed to complete delivery:', error);
      throw error;
    }
  },

  /**
   * Удалить курьера из доставки
   */
  removeCourierFromDelivery: async (orderId: string): Promise<OrderResponse> => {
    try {
      const { data } = await api.delete<OrderResponse>(
        `/orders/${orderId}/courier`
      );
      return data;
    } catch (error) {
      console.error('Failed to remove courier from delivery:', error);
      throw error;
    }
  },

  /**
   * Получить активные заказы доставки
   */
  getDeliveryOrders: async (restaurantId?: string): Promise<OrderResponse[]> => {
    try {
      const params = restaurantId ? { restaurantId } : {};
      const { data } = await api.get<OrderResponse[]>(
        '/orders/delivery/active',
        { params }
      );
      return data;
    } catch (error) {
      console.error('Failed to get delivery orders:', error);
      throw error;
    }
  },

  /**
   * Получить активные доставки курьера
   */
  getCourierActiveDeliveries: async (courierId: string): Promise<OrderResponse[]> => {
    try {
      const { data } = await api.get<OrderResponse[]>(
        `/orders/courier/${courierId}/active-deliveries`
      );
      return data;
    } catch (error) {
      console.error('Failed to get courier active deliveries:', error);
      throw error;
    }
  },

  };

