// components/features/shift/ShiftsFilters.tsx
'use client';

import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useRestaurants } from '@/lib/hooks/useRestaurant';
import { useDebounceCallback } from '@/lib/hooks/useDebounce';
import { useState } from 'react';
import { Restaurant } from '../staff/StaffTable';

interface ShiftsFiltersProps {
  onFilterChange: (filters: {
    restaurantId?: string;
    status?: string;
    date?: string;
  }) => void;
}

export function ShiftsFilters({ onFilterChange }: ShiftsFiltersProps) {
  const [filters, setFilters] = useState({
    restaurantId: undefined,
    status: undefined,
    date: undefined
  });
  
  const { data: restaurants = [], isLoading: isRestaurantsLoading } = useRestaurants();
  const debouncedFilterChange = useDebounceCallback(onFilterChange, 500);

  const handleFilterChange = (newFilters: any) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    debouncedFilterChange(updatedFilters);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <div >
        <Select 
          onValueChange={(value) =>
            handleFilterChange({ restaurantId: value === "all" ? undefined : value })
          }
          disabled={isRestaurantsLoading}
        >
          <SelectTrigger className='w-full'>
            <SelectValue/>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все рестораны</SelectItem>
            {restaurants?.map((restaurant : Restaurant) => (
              <SelectItem key={restaurant.id} value={restaurant.id}>
                {restaurant.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Select
          onValueChange={(value) =>
            handleFilterChange({ status: value === "all" ? undefined : value })
          }
        >
          <SelectTrigger className='w-full'> 
            <SelectValue/>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все статусы</SelectItem>
            <SelectItem value="PLANNED">Запланирована</SelectItem>
            <SelectItem value="STARTED">Начата</SelectItem>
            <SelectItem value="COMPLETED">Завершена</SelectItem>
          </SelectContent>
        </Select>
      </div>
    
    </div>
  );
}