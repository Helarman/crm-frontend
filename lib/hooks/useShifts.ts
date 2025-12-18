// lib/hooks/useShifts.ts
import useSWR from 'swr';
import { ShiftService } from '@/lib/api/shift.service';

export const useShifts = (params?: {
  restaurantId?: string;
  status?: string;
  page?: number;
  limit?: number;
}) => {
  const { data, error, isLoading, mutate } = useSWR(
    ['shifts', params],
    ([, params]) => ShiftService.getAllShifts(params || {}),
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
      revalidateOnMount: true,
      onError: (err) => console.error('Error in useShifts:', err)
    }
  );

  return {
    data,
    error,
    isLoading,
    mutate
  };
};

export const useShift = (id: string) => {
  return useSWR(
    id ? `shift-${id}` : null,
    () => {
      if (!id) return null;
      return ShiftService.getShiftDetails(id);
    },
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
      onError: (err) => console.error('Error in useShift:', err)
    }
  );
};

export const useShiftUsers = (shiftId: string) => {
  return useSWR(
    shiftId ? `shift-users-${shiftId}` : null,
    () => {
      if (!shiftId) return null;
      return ShiftService.getShiftDetails(shiftId).then(shift => shift.users);
    },
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
      onError: (err) => console.error('Error in useShiftUsers:', err)
    }
  );
};

export const useShiftOrders = (shiftId: string) => {
  return useSWR(
    shiftId ? `shift-orders-${shiftId}` : null,
    async () => {
      if (!shiftId) return null;
      const shift = await ShiftService.getShiftDetails(shiftId);
      return shift.orders;
    },
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
      onError: (err) => console.error('Error in useShiftOrders:', err)
    }
  );
};