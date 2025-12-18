import useSWR from 'swr';
import { RestaurantService } from '@/lib/api/restaurant.service';

export const useRestaurants = () => {
  return useSWR('restaurants', () => RestaurantService.getAll());
};

export const useRestaurant = (id: string) => {
  return useSWR(`restaurant-${id}`, () => RestaurantService.getById(id));
};

export const useRestaurantUsers = (restaurantId: string) => {
  return useSWR(
    restaurantId ? `restaurant-users-${restaurantId}` : null,
    () => {
      if (!restaurantId) return null;
      return RestaurantService.getUsers(restaurantId);
    },
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
      onError: (err) => console.error('Error in useRestaurantUsers:', err)
    }
  );
};

export const useRestaurantProducts = (restaurantId: string) => {
  return useSWR(`restaurant-products-${restaurantId}`, () => 
    RestaurantService.getProducts(restaurantId)
  );
};