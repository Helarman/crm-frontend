import useSWR from 'swr';
import { OrderService } from '@/lib/api/order.service';
import {
  OrderFilterParams,
  OrderListResponse,
  OrderResponse,
  OrderArchiveFilterParams,
  OrderArchiveResponse,
  PaginatedMeta,
  UpdateOrderItemDto,
  UpdateOrderItemStatusDto,
  AddItemToOrderDto,
  UpdateOrderDto,
  AttentionFlagsDto
} from '@/lib/api/order.service';

// Основные хуки для работы с заказами

/**
 * Хук для получения списка заказов с фильтрацией
 * @param params Параметры фильтрации
 */
export const useOrders = (params?: OrderFilterParams) => {
  return useSWR<OrderListResponse>(
    ['orders', params],
    () => OrderService.getList(params || {}),
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
      onError: (err) => console.error('Error in useOrders:', err)
    }
  );
};

/**
 * Хук для получения конкретного заказа по ID
 * @param id ID заказа
 */
export const useOrder = (id: string) => {
  return useSWR<OrderResponse>(
    id ? `order-${id}` : null,
    () => OrderService.getById(id),
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
      onError: (err) => console.error('Error in useOrder:', err),
      // Частое обновление для активного заказа
      refreshInterval: (data) => 
        data?.status !== 'COMPLETED' && data?.status !== 'CANCELLED' ? 15000 : 0
    }
  );
};

/**
 * Хук для получения заказов пользователя
 * @param userId ID пользователя
 * @param params Дополнительные параметры фильтрации
 */
export const useUserOrders = (
  userId: string,
  params?: Omit<OrderFilterParams, 'customerId'>
) => {
  return useSWR<OrderListResponse>(
    userId ? ['user-orders', userId, params] : null,
    () => OrderService.getUserOrders(userId, params),
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
      onError: (err) => console.error('Error in useUserOrders:', err)
    }
  );
};

/**
 * Хук для получения всех заказов ресторана
 * @param restaurantId ID ресторана
 */
export const useRestaurantOrders = (restaurantId: string | undefined) => {
  return useSWR<OrderResponse[]>(
    restaurantId ? ['restaurant-orders', restaurantId] : null,
    async ([, id]: [string, string]) => {
      return OrderService.getRestaurantOrders(id);
    },
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
      onError: (err) => console.error('Ошибка при получении заказов ресторана:', err)
    }
  );
};

// Новые хуки для активных и архивных заказов

/**
 * Хук для получения активных заказов ресторана (за последние 2 дня)
 * @param restaurantId ID ресторана
 */
export const useActiveRestaurantOrders = (restaurantId: string | undefined) => {
  return useSWR<OrderResponse[]>(
    restaurantId ? ['active-restaurant-orders', restaurantId] : null,
    async ([, id]: [string, string]) => {
      return OrderService.getActiveRestaurantOrders(id);
    },
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
      onError: (err) => console.error('Ошибка при получении активных заказов:', err),
      refreshInterval: 20000
    }
  );
};

/**
 * Хук для получения архива заказов ресторана с пагинацией и фильтрами
 * @param restaurantId ID ресторана
 * @param params Параметры фильтрации и пагинации
 */
export const useRestaurantArchive = (
  restaurantId: string | undefined,
  params?: OrderArchiveFilterParams
) => {
  return useSWR<OrderArchiveResponse>(
    restaurantId ? ['restaurant-archive', restaurantId, params] : null,
    async ([, id, filterParams]: [string, string, OrderArchiveFilterParams | undefined]) => {
      return OrderService.getRestaurantArchive(id, filterParams || {});
    },
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
      onError: (err) => console.error('Ошибка при получении архива заказов:', err)
    }
  );
};

// Хуки для работы с элементами заказа

/**
 * Хук для работы с элементами конкретного заказа
 * @param orderId ID заказа
 */
export const useOrderItems = (orderId: string) => {
  const { data: order, mutate } = useOrder(orderId);

  const updateItem = async (itemId: string, dto: UpdateOrderItemDto) => {
    const updatedOrder = await OrderService.updateOrderItem(orderId, itemId, dto);
    mutate(updatedOrder, false); // Оптимистичное обновление
    return updatedOrder;
  };

  const updateItemStatus = async (itemId: string, dto: UpdateOrderItemStatusDto) => {
    const updatedOrder = await OrderService.updateItemStatus(orderId, itemId, dto);
    mutate(updatedOrder, false);
    return updatedOrder;
  };

  const addItem = async (dto: AddItemToOrderDto) => {
    const updatedOrder = await OrderService.addItemToOrder(orderId, dto);
    mutate(updatedOrder, false);
    return updatedOrder;
  };

  const removeItem = async (itemId: string) => {
    const updatedOrder = await OrderService.removeItemFromOrder(orderId, itemId);
    mutate(updatedOrder, false);
    return updatedOrder;
  };

  return {
    items: order?.items || [],
    updateItem,
    updateItemStatus,
    addItem,
    removeItem
  };
};

// Комплексный хук для всех действий с заказами

/**
 * Хук для всех возможных действий с заказами
 */
export const useOrderActions = () => {
  return {
    // Основные действия
    createOrder: OrderService.create,
    updateOrder: OrderService.updateOrder,
    updateOrderStatus: OrderService.updateStatus,
    cancelOrder: OrderService.cancel,
    repeatOrder: OrderService.repeat,
    
    // Работа с элементами заказа
    addItemToOrder: OrderService.addItemToOrder,
    removeItemFromOrder: OrderService.removeItemFromOrder,
    updateOrderItem: OrderService.updateOrderItem,
    updateItemStatus: OrderService.updateItemStatus,
    
    // Флаги внимания
    updateAttentionFlags: OrderService.updateAttentionFlags,
    setReorderedFlag: (orderId: string, value: boolean) => 
      OrderService.updateAttentionFlags(orderId, { isReordered: value }),
    setPrecheckFlag: (orderId: string, value: boolean) =>
      OrderService.updateAttentionFlags(orderId, { isPrecheck: value }),
    setRefundFlag: (orderId: string, value: boolean) =>
      OrderService.updateAttentionFlags(orderId, { isRefund: value }),
    
    // Возвраты
    refundItem: OrderService.refundItem,
    
    // Дополнительные действия
    getKitchenOrders: OrderService.getKitchenOrders
  };
};

/**
 * Хук для работы с пагинацией архива заказов
 */
export const useOrderPagination = (meta?: PaginatedMeta) => {
  const totalPages = meta?.totalPages || 1;
  const currentPage = meta?.page || 1;
  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;

  return {
    totalPages,
    currentPage,
    hasNextPage,
    hasPrevPage,
    isFirstPage: currentPage === 1,
    isLastPage: currentPage === totalPages
  };
};

// Вспомогательные хуки

/**
 * Хук для подписки на изменения статуса заказа
 */
export const useOrderStatusSubscription = (orderId: string) => {
  const { data: order, mutate } = useOrder(orderId);

  // Здесь может быть реализация WebSocket или polling для отслеживания изменений статуса

  return {
    status: order?.status,
    isLoading: !order,
    isCompleted: order?.status === 'COMPLETED',
    isCancelled: order?.status === 'CANCELLED',
    mutateStatus: mutate
  };
};