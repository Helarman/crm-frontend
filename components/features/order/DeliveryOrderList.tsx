// app/delivery-orders/page.tsx
'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { DeliveryOrderCard } from '@/components/features/order/DeliveryOrderCard'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { Volume2, VolumeX } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Restaurant {
  id: string
  title: string
}

const RESTAURANT_STORAGE_KEY = 'deliverySelectedRestaurantId'
const DELIVERY_SOUNDS_ENABLED_KEY = 'deliverySoundsEnabled'

const createAudio = (src: string) => {
  if (typeof window === 'undefined') return null
  const audio = new Audio(src)
  audio.volume = 0.3
  return audio
}

const readyOrderSound = createAudio('/sounds/order.mp3')
const orderUpdatedSound = createAudio('/sounds/item.mp3')

const playSound = (audio: HTMLAudioElement | null) => {
  if (!audio) return
  
  try {
    audio.currentTime = 0
    audio.play().catch(error => {
      console.warn('Failed to play sound:', error)
    })
  } catch (error) {
    console.warn('Error playing sound:', error)
  }
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
  sounds: {
    ru: 'Звуки уведомлений',
    ka: 'შეტყობინებების ხმები'
  },
  selectRestaurant: {
    ru: 'Выберите ресторан',
    ka: 'აირჩიეთ რესტორანი'
  },
  deliveryOrders: {
    ru: 'Заказы на доставку',
    ka: 'დორაკების შეკვეთები'
  },
  noOrders: {
    ru: 'Нет заказов',
    ka: 'შეკვეთები არ არის'
  },
  orderError: {
    ru: 'Ошибка загрузки заказов',
    ka: 'შეკვეთების ჩატვირთვის შეცდომა'
  },
  connected: {
    ru: 'Подключено',
    ka: 'დაკავშირებულია'
  },
  connecting: {
    ru: 'Подключение...',
    ka: 'მიმდინარეობს კავშირი...'
  },
  selectRestaurantFirst: {
    ru: 'Выберите ресторан',
    ka: 'აირჩიეთ რესტორანი'
  },
  newReadyOrder: {
    ru: 'Новый заказ готов к доставке',
    ka: 'ახალი შეკვეთა მზადაა დორაკებისთვის'
  },
  orderStatusUpdated: {
    ru: 'Статус заказа обновлен',
    ka: 'შეკვეთის სტატუსი განახლდა'
  },
  availableOrders: {
    ru: 'Доступные',
    ka: 'ხელმისაწვდომი'
  },
  activeOrders: {
    ru: 'Доставляется',
    ka: 'მიეწოდება'
  },
  completedOrders: {
    ru: 'Доставлено',
    ka: 'მიწოდებული'
  },
  noAvailableOrders: {
    ru: 'Нет доступных заказов для доставки',
    ka: 'მიტანისთვის ხელმისაწვდომი შეკვეთები არ არის'
  },
  noActiveOrders: {
    ru: 'Нет заказов в доставке',
    ka: 'მიტანის პროცესში შეკვეთები არ არის'
  },
  noCompletedOrders: {
    ru: 'Нет завершенных доставок',
    ka: 'დასრულებული მიტანები არ არის'
  }
}

export function DeliveryOrdersList() {
  const { user } = useAuth()
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string>('')
  const [soundsEnabled, setSoundsEnabled] = useState<boolean>(true)
  const [activeTab, setActiveTab] = useState('available')
  
  const previousOrdersRef = useRef<Map<string, OrderResponse>>(new Map())
  const soundsEnabledRef = useRef(soundsEnabled)

  useEffect(() => {
    soundsEnabledRef.current = soundsEnabled
  }, [soundsEnabled])

  useEffect(() => {
    const savedSoundsSetting = localStorage.getItem(DELIVERY_SOUNDS_ENABLED_KEY)
    if (savedSoundsSetting !== null) {
      const enabled = JSON.parse(savedSoundsSetting)
      setSoundsEnabled(enabled)
      soundsEnabledRef.current = enabled
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(DELIVERY_SOUNDS_ENABLED_KEY, JSON.stringify(soundsEnabled))
  }, [soundsEnabled])

  const playReadyOrderSound = useCallback(() => {
    if (soundsEnabledRef.current && readyOrderSound) {
      playSound(readyOrderSound)
    }
  }, [])

  const playOrderUpdatedSound = useCallback(() => {
    if (soundsEnabledRef.current && orderUpdatedSound) {
      playSound(orderUpdatedSound)
    }
  }, [])

  // Загрузка сохраненного ресторана
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
  
  useEffect(() => {
    if (selectedRestaurantId) {
      localStorage.setItem(RESTAURANT_STORAGE_KEY, selectedRestaurantId)
    }
  }, [selectedRestaurantId])

  const { 
    data: orders = [], 
    isLoading: ordersLoading, 
    error: ordersError,
    mutate: mutateOrders 
  } = useRestaurantOrders(selectedRestaurantId)

  const updatePreviousOrders = useCallback((orders: OrderResponse[]) => {
    const newMap = new Map<string, OrderResponse>()
    orders.forEach(order => {
      newMap.set(order.id, order)
    })
    previousOrdersRef.current = newMap
  }, [])

  useEffect(() => {
    if (orders.length > 0) {
      updatePreviousOrders(orders)
    }
  }, [orders, updatePreviousOrders])

  const hasOrderBecomeReady = useCallback((newOrder: OrderResponse, previousOrder?: OrderResponse): boolean => {
    return newOrder.status === 'READY' && previousOrder?.status !== 'READY'
  }, [])

  const hasOrderStatusChanged = useCallback((newOrder: OrderResponse, previousOrder?: OrderResponse): boolean => {
    return (previousOrder && newOrder.status !== previousOrder.status)!
  }, [])

 const handleOrdersUpdate = useCallback((
  updatedOrder: OrderResponse, 
  mutateFunction: any,
  source: string
) => {
  const previousOrder = previousOrdersRef.current.get(updatedOrder.id)
  
  if (hasOrderBecomeReady(updatedOrder, previousOrder)) {
    playReadyOrderSound()
    toast.success(translations.newReadyOrder.ru)
  }
  
  if (hasOrderStatusChanged(updatedOrder, previousOrder)) {
    playOrderUpdatedSound()
  }
  
  mutateFunction((prevOrders: OrderResponse[] | undefined) => {
    const existingOrders = prevOrders || []
    
    let newOrders: OrderResponse[]
    
    // Обновляем логику фильтрации завершенных заказов
    if (updatedOrder.status === 'COMPLETED') {
      // Для завершенных заказов оставляем их в списке, но фильтруем по вкладкам
      newOrders = existingOrders.map(order => 
        order.id === updatedOrder.id ? updatedOrder : order
      )
    } else if (updatedOrder.status === 'CANCELLED') {
      // Отмененные заказы удаляем из всех списков
      newOrders = existingOrders.filter(order => order.id !== updatedOrder.id)
    } else {
      const existingIndex = existingOrders.findIndex(order => order.id === updatedOrder.id)
      if (existingIndex !== -1) {
        newOrders = [...existingOrders]
        newOrders[existingIndex] = updatedOrder
      } else {
        newOrders = updatedOrder.status === 'READY' && updatedOrder.type === 'DELIVERY'
          ? [updatedOrder, ...existingOrders]
          : existingOrders
      }
    }
       
    setTimeout(() => {
      updatePreviousOrders(newOrders)
    }, 0)
    
    return newOrders
  }, false)
}, [playReadyOrderSound, playOrderUpdatedSound, hasOrderBecomeReady, hasOrderStatusChanged, updatePreviousOrders])
  // Вебсокет для заказов доставки
  const { isConnected } = useOrderWebSocket({
    restaurantId: selectedRestaurantId,
    enabled: !!selectedRestaurantId,
    onOrderCreated: useCallback((newOrder: OrderResponse) => {
      if (newOrder.status === 'READY') {
        playReadyOrderSound()
        toast.success(translations.newReadyOrder.ru)
      }
      handleOrdersUpdate(newOrder, mutateOrders, 'onOrderCreated')
    }, [mutateOrders, playReadyOrderSound, handleOrdersUpdate]),

    onOrderUpdated: useCallback((updatedOrder: OrderResponse) => {
      handleOrdersUpdate(updatedOrder, mutateOrders, 'onOrderUpdated')
    }, [mutateOrders, handleOrdersUpdate]),

    onOrderStatusUpdated: useCallback((updatedOrder: OrderResponse) => {
      handleOrdersUpdate(updatedOrder, mutateOrders, 'onOrderStatusUpdated')
    }, [mutateOrders, handleOrdersUpdate]),

    onOrderModified: useCallback((updatedOrder: OrderResponse) => {
      handleOrdersUpdate(updatedOrder, mutateOrders, 'onOrderModified')
    }, [mutateOrders, handleOrdersUpdate])
  })

  const availableOrders = orders.filter((order: OrderResponse) => 
    order.status === 'READY' && 
    order.type === 'DELIVERY' && 
    !order.delivery?.courier
  )

  const activeOrders = orders.filter((order: OrderResponse) => 
    (order.status === 'READY' || order.status === 'DELIVERING') && 
    order.type === 'DELIVERY' && 
    order.delivery?.courier &&
    (user?.role === 'COURIER' ? order.delivery.courier.id === user.id : true)
  )

  const completedOrders = orders.filter((order: OrderResponse) => 
    order.status === 'COMPLETED' && 
    order.type === 'DELIVERY' &&
    (user?.role === 'COURIER' ? order.delivery?.courier?.id === user.id : true)
  )

  const handleStatusChange = (updatedOrder: OrderResponse) => {
    mutateOrders((prevOrders: OrderResponse[] | undefined) => 
      prevOrders?.map(o => o.id === updatedOrder.id ? updatedOrder : o) || []
    )
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
          <h2 className="text-2xl font-bold">
            {translations.deliveryOrders.ru}
          </h2>
          <div className={`flex items-center gap-2 ${isConnected ? 'text-green-500' : 'text-gray-500'}`}>
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
            <span className="text-sm">
              {selectedRestaurantId 
                ? (isConnected ? translations.connected.ru : translations.connecting.ru) 
                : translations.selectRestaurantFirst.ru
              }
            </span>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-3 items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSoundsEnabled(!soundsEnabled)}
            className="flex items-center gap-2"
          >
            {soundsEnabled ? (
              <Volume2 className="h-4 w-4" />
            ) : (
              <VolumeX className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">{translations.sounds.ru}</span>
          </Button>

          {user.restaurant.length > 1 && (
            <Select
              value={selectedRestaurantId}
              onValueChange={setSelectedRestaurantId}
            >
              <SelectTrigger className="w-[200px]">
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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="available">
            {translations.availableOrders.ru}
            {availableOrders.length > 0 && (
              <span className="ml-2 bg-primary text-primary-foreground rounded-full px-2 py-1 text-xs min-w-6">
                {availableOrders.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="active">
            {translations.activeOrders.ru}
            {activeOrders.length > 0 && (
              <span className="ml-2 bg-primary text-primary-foreground rounded-full px-2 py-1 text-xs min-w-6">
                {activeOrders.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="completed">
            {translations.completedOrders.ru}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="available" className="space-y-4">
          {ordersLoading || !selectedRestaurantId ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-[300px] w-full rounded-lg" />
              ))}
            </div>
          ) : availableOrders.length === 0 ? (
            <Card className="p-6 text-center">
              <p className="text-muted-foreground">
                {translations.noAvailableOrders.ru}
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableOrders.map(order => (
                <DeliveryOrderCard
                  key={order.id}
                  order={order}
                  variant="available"
                  onStatusChange={handleStatusChange}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          {ordersLoading || !selectedRestaurantId ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-[300px] w-full rounded-lg" />
              ))}
            </div>
          ) : activeOrders.length === 0 ? (
            <Card className="p-6 text-center">
              <p className="text-muted-foreground">
                {translations.noActiveOrders.ru}
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeOrders.map(order => (
                <DeliveryOrderCard
                  key={order.id}
                  order={order}
                  variant="active"
                  onStatusChange={handleStatusChange}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {ordersLoading || !selectedRestaurantId ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-[300px] w-full rounded-lg" />
              ))}
            </div>
          ) : completedOrders.length === 0 ? (
            <Card className="p-6 text-center">
              <p className="text-muted-foreground">
                {translations.noCompletedOrders.ru}
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {completedOrders.map(order => (
                <DeliveryOrderCard
                  key={order.id}
                  order={order}
                  variant="completed"
                  onStatusChange={handleStatusChange}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}