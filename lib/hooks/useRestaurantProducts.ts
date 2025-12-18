import useSWR from 'swr';
import { RestaurantService } from '@/lib/api/restaurant.service';

export const useRestaurantProducts = (restaurantId: string) => {
  return useSWR(
    ['restaurantProducts', restaurantId],
    () => RestaurantService.getProducts(restaurantId),
    {
      revalidateOnFocus: false,
      fallbackData: [] // Добавляем fallback
    }
  );
};