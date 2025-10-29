'use client'

import { useState, useEffect } from 'react'
import { OrderCard } from '@/components/features/order/OrderCard'
import { OrderResponse } from '@/lib/api/order.service'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/lib/hooks/useAuth'
import { useRestaurantOrders } from '@/lib/hooks/useOrders'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card } from '@/components/ui/card'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Restaurant } from '../staff/StaffTable'

const RESTAURANT_STORAGE_KEY = 'kitchenSelectedRestaurantId';

const translations = {
  authRequired: {
    ru: 'Пожалуйста, авторизуйтесь для просмотра заказов',
    ka: 'გთხოვთ, გაიაროთ ავტორიზაცია შეკვეთების სანახავად'
  },
  noRestaurants: {
    ru: 'У вас нет доступных ресторанов',
    ka: 'თქვენ არ გაქვთ ხელმისაწვდომი რესტორანები'
  },
  selectRestaurant: {
    ru: 'Выберите ресторан',
    ka: 'აირჩიეთ რესტორანი'
  },
  kitchenOrders: {
    ru: 'Заказы на кухне',
    ka: 'სამზარეულოს შეკვეთები'
  },
  noOrders: {
    ru: 'Нет заказов для приготовления',
    ka: 'მოსამზადებელი შეკვეთები არ არის'
  },
  orderError: {
    ru: 'Ошибка загрузки заказов',
    ka: 'შეკვეთების ჩატვირთვის შეცდომა'
  }
}

export function KitchenOrdersList() {
  const router = useRouter()
  const { user } = useAuth()
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string>('')
  const { 
    data: orders = [], 
    isLoading: ordersLoading, 
    error: ordersError,
    mutate 
  } = useRestaurantOrders(selectedRestaurantId)

  // Установка выбранного ресторана с сохранением в localStorage
  useEffect(() => {
    if (user?.restaurant?.length > 0) {
      const savedRestaurantId = localStorage.getItem(RESTAURANT_STORAGE_KEY);
      const defaultRestaurantId = user.restaurant[0].id;
      
      // Проверяем, что сохраненный ресторан все еще доступен пользователю
      const isValidSavedRestaurant = savedRestaurantId && 
        user.restaurant.some((r: Restaurant) => r.id === savedRestaurantId);
      
      const newRestaurantId = isValidSavedRestaurant ? savedRestaurantId : defaultRestaurantId;
      
      setSelectedRestaurantId(newRestaurantId);
      
      // Сохраняем в localStorage если это новый выбор или если предыдущий был невалидным
      if (!isValidSavedRestaurant || savedRestaurantId !== newRestaurantId) {
        localStorage.setItem(RESTAURANT_STORAGE_KEY, newRestaurantId);
      }
    }
  }, [user])

  // Сохраняем выбор ресторана при изменении
  useEffect(() => {
    if (selectedRestaurantId) {
      localStorage.setItem(RESTAURANT_STORAGE_KEY, selectedRestaurantId);
    }
  }, [selectedRestaurantId])

  // Фильтруем заказы по нужным статусам
  const filteredOrders = orders.filter((order: OrderResponse) => 
    ['CONFIRMED', 'PREPARING'].includes(order.status)
  )

  type OrderStatus = 'PREPARING' | 'CONFIRMED' | 'READY';
  
  const sortedOrders = [...filteredOrders].sort((a, b) => {
      const statusPriority: Record<OrderStatus, number> = {
        'PREPARING': 2,
        'CONFIRMED': 1,
        'READY': 3
      }

      const aStatus = a.status as OrderStatus;
      const bStatus = b.status as OrderStatus;

      if (statusPriority[aStatus] === statusPriority[bStatus]) {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return statusPriority[aStatus] - statusPriority[bStatus];
  });

  const handleStatusChange = (updatedOrder: OrderResponse) => {
    mutate((prevOrders: OrderResponse[] | undefined) => 
      prevOrders?.map(o => o.id === updatedOrder.id ? updatedOrder : o) || []
    )
  }

  const handleOrderClick = (orderId: string) => {
    // Обработка клика по заказу
  }

  if (!user) {
    return (
      <Card className="p-6 text-center">
        <p className="text-muted-foreground">
          {translations.authRequired.ru}
        </p>
      </Card>
    )
  }

  if (!user.restaurant?.length) {
    return (
      <Card className="p-6 text-center">
        <p className="text-muted-foreground">
          {translations.noRestaurants.ru}
        </p>
      </Card>
    )
  }

  if (ordersError) {
    return (
      <Card className="p-6 text-center">
        <p className="text-destructive">
          {translations.orderError.ru}: {ordersError.message}
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center gap-4 flex-col lg:flex-row">
        <h2 className="text-2xl font-bold">{translations.kitchenOrders.ru}</h2>
        
        <div className="flex gap-2">
          {user.restaurant.length > 1 && (
            <Select
              value={selectedRestaurantId}
              onValueChange={setSelectedRestaurantId}
            >
              <SelectTrigger className="w-[280px]">
                <SelectValue placeholder={translations.selectRestaurant.ru} />
              </SelectTrigger>
              <SelectContent>
                {user.restaurant.map((restaurant: Restaurant) => (
                  <SelectItem key={restaurant.id} value={restaurant.id}>
                    {restaurant.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {ordersLoading || !selectedRestaurantId ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-[300px] w-full rounded-lg" />
          ))}
        </div>
      ) : sortedOrders.length === 0 ? (
        <Card className="p-6 text-center">
          <p className="text-muted-foreground">
            {translations.noOrders.ru}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedOrders.map(order => (
            <div 
              key={order.id}
              onClick={() => handleOrderClick(order.id)}
              className="cursor-pointer transition-transform hover:scale-[1.02]"
            >
              <OrderCard
              selectedRestaurantId={selectedRestaurantId}
                className="min-h-[300px] w-full"
                order={order}
                variant="kitchen"
                onStatusChange={handleStatusChange}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}