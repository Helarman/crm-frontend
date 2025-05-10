import useSWR from 'swr';
import { OrderService } from '@/lib/api/order.service';
import { OrderFilterParams, OrderListResponse, OrderResponse } from '@/lib/api/order.service';

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

export const useOrder = (id: string) => {
  return useSWR<OrderResponse>(
    id ? `order-${id}` : null,
    () => OrderService.getById(id),
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
      onError: (err) => console.error('Error in useOrder:', err)
    }
  );
};

export const useUserOrders = (userId: string, params?: Omit<OrderFilterParams, 'customerId'>) => {
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

export const useRestaurantOrders = (restaurantId: string) => {
  return useSWR(
    restaurantId ? `restaurant-orders-${restaurantId}` : null,
    () => {
      if (!restaurantId) return null;
      return OrderService.getRestaurantOrders(restaurantId);
    },
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
      onError: (err) => console.error('Error in useRestaurantOrders:', err)
    }
  );
};

export const useOrderActions = () => {
  return {
    createOrder: OrderService.create,
    updateOrderStatus: OrderService.updateStatus,
    cancelOrder: OrderService.cancel,
    repeatOrder: OrderService.repeat
  };
};