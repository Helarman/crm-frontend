'use client'

import { useState, useEffect, useCallback } from 'react'
import { OrderCard } from '@/components/features/order/OrderCard'
import { OrderResponse } from '@/lib/api/order.service'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/lib/hooks/useAuth'
import { useRestaurantOrders } from '@/lib/hooks/useOrders'
import { useOrderWebSocket } from '@/lib/hooks/useOrderWebSocket'
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

const RESTAURANT_STORAGE_KEY = 'selectedRestaurantId'

// Функция для получения токена из куки
function getTokenFromCookie(): string | null {
  if (typeof document === 'undefined') return null
  
  const cookies = document.cookie.split(';')
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=')
    if (name === 'accessToken') {
      return decodeURIComponent(value)
    }
  }
  return null
}

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
  },
  newOrder: {
    ru: 'Новый заказ',
    ka: 'ახალი შეკვეთა'
  },
  orderUpdated: {
    ru: 'Заказ обновлен',
    ka: 'შეკვეთა განახლდა'
  },
  newItem: {
    ru: 'Новая позиция в заказе',
    ka: 'ახალი პოზიცია შეკვეთაში'
  }
}

export default function KitchenOrdersList() {
  const router = useRouter()
  const { user } = useAuth()
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string>('')
  
  const { 
    data: orders = [], 
    isLoading: ordersLoading, 
    error: ordersError,
    mutate 
  } = useRestaurantOrders(selectedRestaurantId)

  // WebSocket подключение с улучшенными колбэками
  const { isConnected } = useOrderWebSocket({
    restaurantId: selectedRestaurantId,
    enabled: !!selectedRestaurantId,
    onOrderCreated: useCallback((newOrder: OrderResponse) => {
      console.log('📦 New order received via WebSocket:', newOrder)
      
      // Показываем тост только для заказов в нужных статусах
      if (['CONFIRMED', 'PREPARING'].includes(newOrder.status)) {
        toast.success(`${translations.newOrder.ru} #${newOrder.number}`)
      }
      
      mutate((prevOrders: OrderResponse[] | undefined) => {
        const existingOrders = prevOrders || []
        
        // Если заказ уже есть в списке, обновляем его
        const existingIndex = existingOrders.findIndex(order => order.id === newOrder.id)
        if (existingIndex !== -1) {
          const updatedOrders = [...existingOrders]
          updatedOrders[existingIndex] = newOrder
          return updatedOrders
        }
        
        // Если заказа нет в списке и он в нужном статусе, добавляем его
        if (['CONFIRMED', 'PREPARING'].includes(newOrder.status)) {
          return [newOrder, ...existingOrders]
        }
        
        return existingOrders
      }, false)
    }, [mutate]),

    onOrderUpdated: useCallback((updatedOrder: OrderResponse) => {
      console.log('🔄 Order updated via WebSocket:', updatedOrder)
      
      mutate((prevOrders: OrderResponse[] | undefined) => 
        prevOrders?.map(order => 
          order.id === updatedOrder.id ? updatedOrder : order
        ) || []
      , false)
    }, [mutate]),

    onOrderStatusUpdated: useCallback((updatedOrder: OrderResponse) => {
      console.log('📊 Order status updated via WebSocket:', updatedOrder)
      
      mutate((prevOrders: OrderResponse[] | undefined) => {
        const existingOrders = prevOrders || []
        
        // Если статус изменился на неактивный (COMPLETED, CANCELLED), удаляем из списка
        if (['COMPLETED', 'CANCELLED'].includes(updatedOrder.status)) {
          return existingOrders.filter(order => order.id !== updatedOrder.id)
        }
        
        // Иначе обновляем заказ
        return existingOrders.map(order => 
          order.id === updatedOrder.id ? updatedOrder : order
        )
      }, false)
    }, [mutate]),

    onOrderModified: useCallback((updatedOrder: OrderResponse) => {
      console.log('✏️ Order modified via WebSocket:', updatedOrder)
      
      // Проверяем, есть ли новые позиции
      const hasNewItems = updatedOrder.items.some(item => 
        item.status === 'CREATED' || item.status === 'IN_PROGRESS'
      )
      
      if (hasNewItems) {
        toast.info(`${translations.newItem.ru} #${updatedOrder.number}`)
      }
      
      mutate((prevOrders: OrderResponse[] | undefined) => 
        prevOrders?.map(order => 
          order.id === updatedOrder.id ? updatedOrder : order
        ) || []
      , false)
    }, [mutate])
  })

  // Установка выбранного ресторана с сохранением в localStorage
  useEffect(() => {
    if (user?.restaurant?.length > 0) {
      const savedRestaurantId = localStorage.getItem(RESTAURANT_STORAGE_KEY)
      const defaultRestaurantId = user.restaurant[0].id
      
      const isValidSavedRestaurant = savedRestaurantId && 
        user.restaurant.some((r: Restaurant) => r.id === savedRestaurantId)
      
      const newRestaurantId = isValidSavedRestaurant ? savedRestaurantId : defaultRestaurantId
      
      setSelectedRestaurantId(newRestaurantId)
      
      if (!isValidSavedRestaurant || savedRestaurantId !== newRestaurantId) {
        localStorage.setItem(RESTAURANT_STORAGE_KEY, newRestaurantId)
      }
    }
  }, [user])

  // Сохраняем выбор ресторана при изменении
  useEffect(() => {
    if (selectedRestaurantId) {
      localStorage.setItem(RESTAURANT_STORAGE_KEY, selectedRestaurantId)
    }
  }, [selectedRestaurantId])

  // Фильтруем заказы по нужным статусам
  const filteredOrders = orders.filter((order: OrderResponse) => 
    ['CONFIRMED', 'PREPARING'].includes(order.status)
  )

  type OrderStatus = 'PREPARING' | 'CONFIRMED' | 'READY'
  
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    const statusPriority: Record<OrderStatus, number> = {
      'PREPARING': 2,
      'CONFIRMED': 1,
      'READY': 3
    }

    const aStatus = a.status as OrderStatus
    const bStatus = b.status as OrderStatus

    if (statusPriority[aStatus] === statusPriority[bStatus]) {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    }
    return statusPriority[aStatus] - statusPriority[bStatus]
  })

  const handleStatusChange = (updatedOrder: OrderResponse) => {
    mutate((prevOrders: OrderResponse[] | undefined) => 
      prevOrders?.map(o => o.id === updatedOrder.id ? updatedOrder : o) || []
    )
  }

  const handleOrderClick = (orderId: string) => {
    router.push(`/kitchen/orders/${orderId}`)
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
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold">{translations.kitchenOrders.ru}</h2>
          <div className={`flex items-center gap-2 ${isConnected ? 'text-green-500' : 'text-gray-500'}`}>
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
            <span className="text-sm">
              {selectedRestaurantId 
                ? (isConnected ? 'Подключено' : 'Подключение...') 
                : 'Выберите ресторан'
              }
            </span>
          </div>
        </div>
        
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