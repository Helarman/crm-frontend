'use client'

import { useRestaurant } from '@/lib/hooks/useRestaurant';
import { RestaurantService } from '@/lib/api/restaurant.service';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { RestaurantUsers } from '@/components/features/restaurant/RestaurantUsers';
import { RestaurantProducts } from '@/components/features/restaurant/RestaurantProducts';
import { useState } from 'react';
import { EditRestaurantForm } from '@/components/features/restaurant/EditRestaurantForm';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { toast } from 'sonner'; // Библиотека для уведомлений

// Типы для TypeScript
interface Restaurant {
  id: string;
  name: string;
  address: string;
  description?: string;
  // другие поля при необходимости
}

export function RestaurantDetails({ restaurantId }: { restaurantId: string }) {
  // Получаем данные ресторана, состояние загрузки и ошибки
  const { data: restaurant, error, isLoading, mutate } = useRestaurant(restaurantId);
  const [isEditing, setIsEditing] = useState(false); // Режим редактирования

  // Обработчик обновления данных ресторана
  const handleUpdate = async (values: Restaurant) => {
    try {
      await RestaurantService.update(restaurantId, values);
      await mutate(); // Обновляем данные
      setIsEditing(false);
      toast.success('Данные ресторана успешно обновлены');
    } catch (err) {
      console.error('Ошибка при обновлении ресторана', err);
      toast.error('Не удалось обновить данные ресторана');
    }
  };

  // Состояние загрузки
  if (isLoading) return <LoadingSpinner className="mx-auto mt-8" />;
  
  // Обработка ошибок
  if (error) return <div className="text-red-500 text-center mt-8">Ошибка загрузки данных</div>;
  
  // Если ресторан не найден
  if (!restaurant) return <div className="text-center mt-8">Ресторан не найден</div>;

  return (
    <div className="space-y-8">
      
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{restaurant.title}</h2>
      </div>
      <div className="border rounded-lg p-4">

      <EditRestaurantForm 
            initialValues={restaurant}
            onSubmit={handleUpdate}
            onCancel={() => setIsEditing(false)}
          />
        </div>
        <div className="border rounded-lg p-4">
          <RestaurantUsers/>
        </div>
        <div className="border rounded-lg p-4">
          <RestaurantProducts restaurantId={restaurantId} />
        </div>
      </div>
  );
}