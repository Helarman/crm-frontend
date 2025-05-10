'use client'

import { useState, useEffect } from 'react'
import { OrderCard } from '@/components/features/order/OrderCard'
import  { OrderResponse } from '@/lib/api/order.service'
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

interface Restaurant {
  id: string
  title: string
}


export function KitchenOrdersList() {
  const router = useRouter()
  const { user } = useAuth()
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string>(user?.restaurant[0].id)
  const { 
    data: orders = [], 
    isLoading: ordersLoading, 
    error: ordersError,
    mutate 
  } = useRestaurantOrders(selectedRestaurantId)

  // Сортируем заказы: сначала активные (не COMPLETED и не CANCELLED), затем завершенные/отмененные
  const sortedOrders = [...orders].sort((a, b) => {
    const isACompletedOrCancelled = a.status === 'COMPLETED' || a.status === 'CANCELLED'
    const isBCompletedOrCancelled = b.status === 'COMPLETED' || b.status === 'CANCELLED'

    // Если оба имеют одинаковый статус (оба активные или оба завершены/отменены), сортируем по дате
    if (isACompletedOrCancelled === isBCompletedOrCancelled) {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime() // новые сверху
    }
    
    // Активные заказы идут перед завершенными/отмененными
    return isACompletedOrCancelled ? 1 : -1
  })

  // Set first restaurant as default
  useEffect(() => {
    if (user?.restaurants?.length > 0 && !selectedRestaurantId) {
      setSelectedRestaurantId(user.restaurant[0].id)
    }
  }, [user, selectedRestaurantId])

  const handleStatusChange = (updatedOrder: OrderResponse) => {
    mutate((prevOrders: OrderResponse[] | undefined) => 
      prevOrders?.map(o => o.id === updatedOrder.id ? updatedOrder : o) || []
    )
  }

  const handleOrderClick = (orderId: string) => {
    router.push(`/kitchen/${orderId}`)
  }

  if (!user) {
    return (
      <Card className="p-6 text-center">
        <p className="text-muted-foreground">
          Пожалуйста, авторизуйтесь для просмотра заказов
        </p>
      </Card>
    )
  }

  if (!user.restaurant?.length) {
    return (
      <Card className="p-6 text-center">
        <p className="text-muted-foreground">
          У вас нет доступных ресторанов
        </p>
      </Card>
    )
  }

  if (ordersLoading || !selectedRestaurantId) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-[300px] w-full" />
          ))}
        </div>
      </div>
    )
  }

  if (ordersError) {
    return (
      <Card className="p-6 text-center">
        <p className="text-destructive">
          Ошибка загрузки заказов: {ordersError.message}
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between gap-4">
        <h2 className="text-xl font-semibold">Заказы на кухне</h2>
        
        {user.restaurant.length > 1 && (
          <Select
            value={selectedRestaurantId}
            onValueChange={setSelectedRestaurantId}
          >
            <SelectTrigger className="w-[280px]">
              <SelectValue placeholder="Выберите ресторан" />
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

      {sortedOrders.length === 0 ? (
        <Card className="p-6 text-center">
          <p className="text-muted-foreground">
            Нет заказов для приготовления
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