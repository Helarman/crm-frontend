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

interface Restaurant {
  id: string
  title: string
}

export function DeliveryOrdersList() {
  const router = useRouter()
  const { user } = useAuth()
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string>('')
  const { 
    data: orders = [], 
    isLoading: ordersLoading, 
    error: ordersError,
    mutate 
  } = useRestaurantOrders(selectedRestaurantId)

  // Set first restaurant as default when user is loaded
  useEffect(() => {
    if (user?.restaurant?.length > 0) {
      setSelectedRestaurantId(user.restaurant[0].id)
    }
  }, [user])

  // Filter delivery orders with relevant statuses
  const filteredOrders = orders.filter((order: OrderResponse) => 
    order.type === 'DELIVERY' && ['CONFIRMED', 'PREPARING', 'READY', 'DELIVERING'].includes(order.status)
  )

  type OrderStatus = 'DELIVERING' | 'READY' | 'PREPARING' | 'CONFIRMED';
  
  const sortedOrders = [...filteredOrders].sort((a, b) => {
      const statusPriority: Record<OrderStatus, number> = {
        'DELIVERING': 1,  // Highest priority - currently being delivered
        'READY': 2,       // Ready for delivery
        'PREPARING': 3,    // Being prepared
        'CONFIRMED': 4     // Just confirmed
      }

      const aStatus = a.status as OrderStatus;
      const bStatus = b.status as OrderStatus;

      if (statusPriority[aStatus] === statusPriority[bStatus]) {
        // If same status, sort by creation time (newest first)
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
    router.push(`/orders/${orderId}`)
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
        <h2 className="text-2xl font-bold">Заказы на доставку</h2>
        
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

      {ordersLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-[300px] w-full rounded-lg" />
          ))}
        </div>
      ) : sortedOrders.length === 0 ? (
        <Card className="p-6 text-center">
          <p className="text-muted-foreground">
            Нет заказов на доставку
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
                variant="delivery" 
                onStatusChange={handleStatusChange}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}