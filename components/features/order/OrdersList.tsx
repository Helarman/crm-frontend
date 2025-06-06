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
import { Utensils, ShoppingBag, Truck, GlassWater, Archive } from 'lucide-react'
import { useLanguageStore } from '@/lib/stores/language-store'
import Loading from '../Loading'

const ORDER_TYPES = [
  {
    value: 'ALL',
    label: {
      ru: 'Все',
      ka: 'ყველა'
    },
    icon: null,
    color: 'bg-gray-100 hover:bg-gray-200'
  },
  {
    value: 'DINE_IN',
    label: {
      ru: 'В зале',
      ka: 'დარბაზში'
    },
    icon: Utensils,
    color: 'bg-blue-100 hover:bg-blue-200'
  },
  {
    value: 'TAKEAWAY',
    label: {
      ru: 'Навынос',
      ka: 'წინასწარ'
    },
    icon: ShoppingBag,
    color: 'bg-green-100 hover:bg-green-200'
  },
  {
    value: 'DELIVERY',
    label: {
      ru: 'Доставка',
      ka: 'მიტანა'
    },
    icon: Truck,
    color: 'bg-purple-100 hover:bg-purple-200'
  },
  {
    value: 'BANQUET',
    label: {
      ru: 'Банкет',
      ka: 'ბანკეტი'
    },
    icon: GlassWater,
    color: 'bg-amber-100 hover:bg-amber-200'
  }
]

const translations = {
  title: {
    ru: 'Заказы ресторана',
    ka: 'რესტორნის შეკვეთები'
  },
  newOrder: {
    ru: 'Новый заказ',
    ka: 'ახალი შეკვეთა'
  },
  authRequired: {
    ru: 'Пожалуйста, авторизуйтесь для просмотра заказов',
    ka: 'გთხოვთ, გაიაროთ ავტორიზაცია შეკვეთების სანახავად'
  },
  noRestaurants: {
    ru: 'У вас нет доступных ресторанов',
    ka: 'თქვენ არ გაქვთ ხელმისაწვდომი რესტორანები'
  },
  loadingOrders: {
    ru: 'Загрузка заказов...',
    ka: 'შეკვეთების ჩატვირთვა...'
  },
  orderError: {
    ru: 'Ошибка загрузки заказов',
    ka: 'შეკვეთების ჩატვირთვის შეცდომა'
  },
  noOrders: {
    ru: 'Нет заказов по выбранному фильтру',
    ka: 'არჩეული ფილტრის მიხედვით შეკვეთები არ მოიძებნა'
  },
  noRecentOrders: {
    ru: 'Нет заказов за последние 2 дня',
    ka: 'შეკვეთები ბოლო 2 დღის განმავლობაში არ მოიძებნა'
  },
  selectRestaurant: {
    ru: 'Выберите ресторан',
    ka: 'აირჩიეთ რესტორანი'
  },
  statusUpdated: {
    ru: 'Статус заказа обновлен',
    ka: 'შეკვეთის სტატუსი განახლდა'
  },
  statusUpdateError: {
    ru: 'Не удалось обновить статус заказа',
    ka: 'შეკვეთის სტატუსის განახლება ვერ მოხერხდა'
  },
  ordersList: {
    ru: 'Список заказов',
    ka: 'შეკვეთების სია'
  },
  showArchive: {
    ru: 'Архив заказов',
    ka: 'შეკვეთების არქივი'
  },
  recentOrders: {
    ru: 'Последние заказы',
    ka: 'ბოლო შეკვეთები'
  }
}

export function OrdersList() {
  const { language } = useLanguageStore()
  const t = (key: keyof typeof translations) => translations[key][language]

  const router = useRouter()
  const { user } = useAuth()
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string>('')
  const [selectedOrderType, setSelectedOrderType] = useState<string>('ALL')
  const [showArchive, setShowArchive] = useState<boolean>(false)
  const { 
    data: orders = [], 
    isLoading: ordersLoading, 
    error: ordersError,
    mutate 
  } = useRestaurantOrders(selectedRestaurantId)

  // Установка первого ресторана по умолчанию при загрузке пользователя
  useEffect(() => {
    if (user?.restaurant?.length > 0) {
      setSelectedRestaurantId(user.restaurant[0].id)
    }
  }, [user])

  // Фильтрация заказов по дате (последние 2 дня), если архив не показан
  const filterByDate = (order: OrderItemDto) => {
    if (showArchive) return true
    
    const twoDaysAgo = new Date()
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)
    return new Date(order.createdAt) >= twoDaysAgo
  }

  // Фильтрация заказов по выбранному типу
  const filteredOrders = (selectedOrderType === 'ALL' 
    ? orders 
    : orders.filter((order : OrderItemDto) => order.type === selectedOrderType))
    .filter(filterByDate)

  // Сортировка заказов: сначала активные, затем завершенные/отмененные
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
        toast.success(t('statusUpdated'))
      },
      onError: (error) => {
        toast.error(t('statusUpdateError'))
        console.error('Ошибка при обновлении статуса заказа:', error)
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
          {t('authRequired')}
        </p>
      </Card>
    )
  }

  if (!user.restaurant?.length) {
    return (
      <Card className="p-6 text-center">
        <p className="text-muted-foreground">
          {t('noRestaurants')}
        </p>
      </Card>
    )
  }

  if (ordersLoading || !selectedRestaurantId) {
    return (
      <div className="space-y-4">
        <Loading/>
      </div>
    )
  }

  if (ordersError) {
    return (
      <Card className="p-6 text-center">
        <p className="text-destructive">
          {t('orderError')}: {ordersError.message}
        </p>
      </Card>
    )
  }


  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex justify-between flex-col lg:flex-row items-center gap-4">
          <h2 className="text-2xl font-bold">
            {showArchive ? t('ordersList') : t('recentOrders')}
          </h2>
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
                  <span className="font-medium">{type.label[language]}</span>
                </Button>
              )
            })}
          </div>
          <div className='flex space-x-2'>
            {user.restaurant.length > 1 && (
              <Select
                value={selectedRestaurantId}
                onValueChange={setSelectedRestaurantId}
              >
                <SelectTrigger className="w-[280px]">
                  <SelectValue placeholder={t('selectRestaurant')} />
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
            <Button 
              variant={showArchive ? 'default' : 'outline'} 
              onClick={() => setShowArchive(!showArchive)}
            >
              <Archive className="h-5 w-5 mr-2" />
              {t('showArchive')}
            </Button>
            <Button onClick={() => router.push('/orders/new')}>
              {t('newOrder')}
            </Button>
          </div>
        </div>
      </div>

      {sortedOrders.length === 0 ? (
        <Card className="p-6 text-center">
          <p className="text-muted-foreground">
            {showArchive ? t('noOrders') : t('noRecentOrders')}
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