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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRestaurants } from '@/lib/hooks/useRestaurant';
import { useDebounceCallback } from '@/lib/hooks/useDebounce';
import { useState } from 'react';
import { Restaurant } from '../staff/StaffTable';
import { useLanguageStore } from '@/lib/stores/language-store';

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
  
  const { language } = useLanguageStore();
  const { data: restaurants = [], isLoading: isRestaurantsLoading } = useRestaurants();
  const debouncedFilterChange = useDebounceCallback(onFilterChange, 500);

  // Переводы для вкладок
  const statusTranslations = {
    all: {
      ru: 'Все смены',
      ka: 'ყველა ცვლა'
    },
    PLANNED: {
      ru: 'Запланированные',
      ka: 'დაგეგმილი'
    },
    STARTED: {
      ru: 'Активные',
      ka: 'აქტიური'
    },
    COMPLETED: {
      ru: 'Завершенные',
      ka: 'დასრულებული'
    }
  };

  const handleFilterChange = (newFilters: any) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    debouncedFilterChange(updatedFilters);
  };

  const handleStatusChange = (status: string) => {
    handleFilterChange({ status: status === "all" ? undefined : status });
  };

  return (
    <div className="space-y-4 mb-6">
      {/* Вкладки статусов */}
      <Tabs 
        defaultValue="all" 
        onValueChange={handleStatusChange}
        className="w-full"
      >
        <TabsList className="flex w-full flex-col gap-2 sm:flex-row sm:grid sm:grid-cols-4">
          <TabsTrigger value="all" className="flex-1">
            {statusTranslations.all[language]}
          </TabsTrigger>
          <TabsTrigger value="PLANNED" className="flex-1">
            {statusTranslations.PLANNED[language]}
          </TabsTrigger>
          <TabsTrigger value="STARTED" className="flex-1">
            {statusTranslations.STARTED[language]}
          </TabsTrigger>
          <TabsTrigger value="COMPLETED" className="flex-1">
            {statusTranslations.COMPLETED[language]}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Фильтр по ресторану */}
      <div className="max-w-xs">
        <Select 
          onValueChange={(value) =>
            handleFilterChange({ restaurantId: value === "all" ? undefined : value })
          }
          disabled={isRestaurantsLoading}
        >
          <SelectTrigger className='w-full'>
            <SelectValue placeholder={language === 'ka' ? 'ყველა რესტორნი' : 'Все рестораны'} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              {language === 'ka' ? 'ყველა რესტორნი' : 'Все рестораны'}
            </SelectItem>
            {restaurants?.map((restaurant: Restaurant) => (
              <SelectItem key={restaurant.id} value={restaurant.id}>
                {restaurant.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}