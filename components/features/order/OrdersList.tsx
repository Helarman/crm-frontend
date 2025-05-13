'use client'

import { useState, useEffect } from 'react'
import { OrderCard } from '@/components/features/order/OrderCard'
import type { OrderItemDto, OrderResponse } from '@/lib/api/order.service'
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
import { OrderService } from '@/lib/api/order.service'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import useSWRMutation from 'swr/mutation'
import { Restaurant } from '../staff/StaffTable'
import { Button } from '@/components/ui/button'
import { Utensils, ShoppingBag, Truck, GlassWater } from 'lucide-react'

const ORDER_TYPES = [
  {
    value: 'ALL',
    label: 'Все',
    icon: null,
    color: 'bg-gray-100 hover:bg-gray-200'
  },
  {
    value: 'DINE_IN',
    label: 'В зале',
    icon: Utensils,
    color: 'bg-blue-100 hover:bg-blue-200'
  },
  {
    value: 'TAKEAWAY',
    label: 'Навынос',
    icon: ShoppingBag,
    color: 'bg-green-100 hover:bg-green-200'
  },
  {
    value: 'DELIVERY',
    label: 'Доставка',
    icon: Truck,
    color: 'bg-purple-100 hover:bg-purple-200'
  },
  {
    value: 'BANQUET',
    label: 'Банкет',
    icon: GlassWater,
    color: 'bg-amber-100 hover:bg-amber-200'
  }
]

export function OrdersList() {
  const router = useRouter()
  const { user } = useAuth()
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string>('')
  const [selectedOrderType, setSelectedOrderType] = useState<string>('ALL')
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

  // Filter orders by selected type
  const filteredOrders = selectedOrderType === 'ALL' 
    ? orders 
    : orders.filter((order : OrderItemDto) => order.type === selectedOrderType)

  // Sort orders: active first, then completed/cancelled
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    const isACompletedOrCancelled = a.status === 'COMPLETED' || a.status === 'CANCELLED'
    const isBCompletedOrCancelled = b.status === 'COMPLETED' || b.status === 'CANCELLED'

    if (isACompletedOrCancelled === isBCompletedOrCancelled) {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    }
    
    return isACompletedOrCancelled ? 1 : -1
  })

  const { trigger: updateStatus } = useSWRMutation(
    ['update-order-status'],
    async (_, { arg }: { arg: { orderId: string, status: string } }) => {
      const response = await OrderService.updateStatus(arg.orderId, { status: arg.status })
      return response
    },
    {
      onSuccess: (updatedOrder: OrderResponse) => {
        mutate((prevOrders: OrderResponse[] | undefined) => 
          prevOrders?.map(o => o.id === updatedOrder.id ? updatedOrder : o) || []
        )
        toast.success('Статус заказа обновлен')
      },
      onError: (error) => {
        toast.error('Не удалось обновить статус заказа')
        console.error('Failed to update order status:', error)
      }
    }
  )

  const handleStatusChange = (updatedOrder: OrderResponse) => {
    mutate((prevOrders: OrderResponse[] | undefined) => 
      prevOrders?.map(o => o.id === updatedOrder.id ? updatedOrder : o) || []
    )
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
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-[300px] w-full rounded-lg" />
        ))}
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
      <div className="flex flex-col gap-4">
        <div className="flex justify-between flex-col lg:flex-row items-center gap-4">
          <h2 className="text-xl font-semibold">Список заказов</h2>
           <div className="flex flex-wrap gap-2">
          {ORDER_TYPES.map((type) => {
            const Icon = type.icon
            return (
              <Button
                key={type.value}
                variant={selectedOrderType === type.value ? 'default' : 'outline'}
                onClick={() => setSelectedOrderType(type.value)}
              >
                {Icon && <Icon className="h-5 w-5" />}
                <span className="font-medium">{type.label}</span>
              </Button>
            )
          })}
        </div>
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
      </div>

      {sortedOrders.length === 0 ? (
        <Card className="p-6 text-center">
          <p className="text-muted-foreground">
            Нет заказов по выбранному фильтру
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {sortedOrders.map(order => (
            <div 
              key={order.id}
              className="cursor-pointer transition-transform hover:scale-[1.02]"
            >
              <OrderCard
                order={order}
                onStatusChange={handleStatusChange}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}