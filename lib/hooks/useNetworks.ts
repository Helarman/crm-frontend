import useSWR from 'swr';
import { Network, NetworkService } from '../api/network.service';
import { Restaurant } from '@/components/features/staff/StaffTable';
import { useAuth } from './useAuth';

export const useNetworks = () => {
  const result = useSWR<Network[]>(
    '/networks',
    async () => {
      console.log('Fetching networks...'); // Логируем начало запроса
      try {
        const data = await NetworkService.getAll();
        console.log('Networks data:', data); // Логируем полученные данные
        return data;
      } catch (error) {
        console.error('Error fetching networks:', error);
        throw error;
      }
    },
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
    }
  );

  console.log('SWR result:', result); // Логируем весь результат SWR

  return {
    networks: result.data || [],
    isLoading: result.isLoading,
    error: result.error,
    isValidating: result.isValidating,
    mutate: result.mutate,
  };
};

export const useNetwork = (id?: string) => {
  const { data, error, isLoading, isValidating, mutate } = useSWR<Network>(
    id ? `/networks/${id}` : null,
    id ? () => NetworkService.getById(id) : null,
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
    }
  );

  return {
    network: data,
    isLoading: isLoading || (!error && !data && !!id),
    error,
    isValidating,
    mutate,
  };
};

export const useUserNetworks = () => {
  const { user } = useAuth();
  
  const shouldFetch = !!user?.id;
  const isSupervisor = user?.role === 'SUPERVISOR';

  const result = useSWR(
    shouldFetch ? `/user/${user.id}/networks` : null,
    async () => {
      try {
        if (isSupervisor) {
          return await NetworkService.getAll();
        } else {
          return await NetworkService.getByUser(user.id);
        }
      } catch (error) {
        console.error('Error fetching user networks:', error);
        throw error;
      }
    },
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
    }
  );

  return {
    networks: result.data || [],
    isLoading: result.isLoading,
    error: result.error,
    isValidating: result.isValidating,
    mutate: result.mutate,
  };
};

export const useNetworkRestaurants = (networkId?: string) => {
  const { data, error, isLoading, isValidating, mutate } = useSWR<Restaurant[]>(
    networkId ? `/networks/${networkId}/restaurants` : null,
    networkId ? () => NetworkService.getRestaurants(networkId) : null,
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
    }
  );

  return {
    restaurants: data || [],
    isLoading: isLoading || (!error && !data && !!networkId),
    error,
    isValidating,
    mutate,
  };
};
export const useNetworkActions = () => {
  return {
    createNetwork: NetworkService.create,
    updateNetwork: NetworkService.update,
    deleteNetwork: NetworkService.delete,
  };
};
