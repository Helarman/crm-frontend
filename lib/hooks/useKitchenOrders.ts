import useSWR from 'swr';
import { OrderService } from '@/lib/api/order.service';
import { OrderListResponse } from '@/lib/api/order.service';

export const useKitchenOrders = (restaurantId: string) => {
  return useSWR<OrderListResponse>(
    restaurantId ? ['kitchen-orders', restaurantId] : null,
    () => OrderService.getKitchenOrders(restaurantId),
    {
      refreshInterval: 10000,
      revalidateOnFocus: true,
      onError: (err) => console.error('Error fetching kitchen orders:', err)
    }
  );
};