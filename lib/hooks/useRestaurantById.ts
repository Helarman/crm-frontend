import useSWR from 'swr';
import { RestaurantService } from '@/lib/api/restaurant.service';

export const useRestaurantById = (id: string | null) => {
  const { data, error, isLoading, mutate } = useSWR(
    id ? `restaurant-${id}` : null,
    () => RestaurantService.getById(id!),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  return {
    restaurant: data,
    isLoading,
    error,
    mutate
  };
};