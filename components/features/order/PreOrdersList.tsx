'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { OrderCard } from '@/components/features/order/OrderCard'
import { OrderResponse } from '@/lib/api/order.service'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/lib/hooks/useAuth'
import { useRestaurantArchive, useRestaurantOrders } from '@/lib/hooks/useOrders'
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
import { DateRange } from 'react-day-picker'
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination'
import { Archive, Volume2, VolumeX, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DateRangePicker } from '@/components/ui/data-range-picker'

const RESTAURANT_STORAGE_KEY = 'selectedRestaurantId'
const KITCHEN_SOUNDS_ENABLED_KEY = 'kitchenSoundsEnabled'

const createSound = (frequency: number, duration: number, type: OscillatorType = 'sine') => {
  return () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.value = frequency
      oscillator.type = type
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration)
      
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + duration)
      
      return audioContext
    } catch (error) {
      console.warn('Web Audio API not supported:', error)
      return null
    }
  }
}

const newOrderSound = createSound(800, 1, 'sine')
const orderUpdateSound = createSound(600, 0.3, 'sine')

const translations = {
  authRequired: {
    ru: 'Пожалуйста, авторизуйтесь для просмотра заказов',
    ka: 'გთხოვთ, გაიაროთ ავტორიზაცია შეკვეთების სანახავად'
  },
  noRestaurants: {
    ru: 'У вас нет доступных ресторанов',
    ka: 'თქვენ არ გაქვთ ხელმისაწვდომი რესტორანები'
  },
    showArchive: {
    ru: 'Архив заказов',
    ka: 'შეკვეთების არქივი'
  },
  showActive: {
    ru: 'Активные заказы',
    ka: 'აქტიური შეკვეთები'
  },
  sounds: {
    ru: 'Звуки уведомлений',
    ka: 'შეტყობინებების ხმები'
  },
  dateRange: {
    ru: 'Диапазон дат',
    ka: 'თარიღების დიაპაზონი'
  },
  clearFilters: {
    ru: 'Очистить фильтры',
    ka: 'ფილტრების გასუფთავება'
  },
  selectRestaurant: {
    ru: 'Выберите ресторан',
    ka: 'აირჩიეთ რესტორანი'
  },
  kitchenOrders: {
    ru: 'Заказы на кухне',
    ka: 'სამზარეულოს შეკვეთები'
  },
  preorders:{
    ru: 'Предзаказы',
    ka: ''
  }
  ,
  noOrders: {
    ru: 'Нет предзаказов',
    ka: 'მოსამზადებელი შეკვეთები არ არის'
  },
  orderError: {
    ru: 'Ошибка загрузки заказов',
    ka: 'შეკვეთების ჩატვირთვის შეცდომა'
  },
  archiveOrders: {
    ru: 'Архив заказов кухни',
    ka: 'სამზარეულოს შეკვეთების არქივი'
  },
  noArchiveOrders: {
    ru: 'Нет заказов в архиве',
    ka: 'არქივში შეკვეთები არ არის'
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



export default function PreOrdersList() {
  const { user } = useAuth()
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string>('')
  const [soundsEnabled, setSoundsEnabled] = useState<boolean>(true)
  
  const previousOrdersRef = useRef<Map<string, OrderResponse>>(new Map())
  const soundsEnabledRef = useRef(soundsEnabled)

  useEffect(() => {
    soundsEnabledRef.current = soundsEnabled
  }, [soundsEnabled])

  useEffect(() => {
    const savedSoundsSetting = localStorage.getItem(KITCHEN_SOUNDS_ENABLED_KEY)
    if (savedSoundsSetting !== null) {
      const enabled = JSON.parse(savedSoundsSetting)
      setSoundsEnabled(enabled)
      soundsEnabledRef.current = enabled
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(KITCHEN_SOUNDS_ENABLED_KEY, JSON.stringify(soundsEnabled))
  }, [soundsEnabled])


  useEffect(() => {
    localStorage.setItem(KITCHEN_SOUNDS_ENABLED_KEY, JSON.stringify(soundsEnabled))
  }, [soundsEnabled])

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
    data: activeOrders = [], 
    isLoading: activeLoading, 
    error: activeError,
    mutate: mutateActive 
  } = useRestaurantOrders(selectedRestaurantId)

  const updatePreviousOrders = useCallback((orders: OrderResponse[]) => {
    const newMap = new Map<string, OrderResponse>()
    orders.forEach(order => {
      newMap.set(order.id, order)
    })
    previousOrdersRef.current = newMap
  }, [])

  useEffect(() => {
    if (activeOrders.length > 0) {
      updatePreviousOrders(activeOrders)
    }
  }, [activeOrders, updatePreviousOrders])

  const handleOrdersUpdate = useCallback((
    updatedOrder: OrderResponse, 
    mutateFunction: any,
    source: string
  ) => {
    mutateFunction((prevOrders: OrderResponse[] | undefined) => {
      const existingOrders = prevOrders || []
      
      let newOrders: OrderResponse[]
      
      if (['COMPLETED', 'CANCELLED'].includes(updatedOrder.status)) {
        newOrders = existingOrders.filter(order => order.id !== updatedOrder.id)
      } else {
        const existingIndex = existingOrders.findIndex(order => order.id === updatedOrder.id)
        if (existingIndex !== -1) {
          newOrders = [...existingOrders]
          newOrders[existingIndex] = updatedOrder
        } else {
          newOrders = [updatedOrder, ...existingOrders]
        }
      }
         
      setTimeout(() => {
        updatePreviousOrders(newOrders)
      }, 0)
      
      return newOrders
    }, false)
  }, [ updatePreviousOrders])

  const { isConnected } = useOrderWebSocket({
    restaurantId: selectedRestaurantId,
    enabled: !!selectedRestaurantId,
    onOrderCreated: useCallback((newOrder: OrderResponse) => {
      console.log('📦 New order received via WebSocket:', newOrder)

      handleOrdersUpdate(newOrder, mutateActive, 'onOrderCreated')
    }, [mutateActive, handleOrdersUpdate]),

    onOrderUpdated: useCallback((updatedOrder: OrderResponse) => {
      handleOrdersUpdate(updatedOrder, mutateActive, 'onOrderUpdated')
    }, [mutateActive, handleOrdersUpdate]),

    onOrderStatusUpdated: useCallback((updatedOrder: OrderResponse) => {
      handleOrdersUpdate(updatedOrder, mutateActive, 'onOrderStatusUpdated')
    }, [mutateActive, handleOrdersUpdate]),

    onOrderModified: useCallback((updatedOrder: OrderResponse) => {

      handleOrdersUpdate(updatedOrder, mutateActive, 'onOrderModified')
    }, [mutateActive, handleOrdersUpdate])
  })

  const filteredActiveOrders = activeOrders.filter((order: OrderResponse) => 
    ['CONFIRMED'].includes(order.status)
  )




  const handleStatusChange = (updatedOrder: OrderResponse) => {
    mutateActive((prevOrders: OrderResponse[] | undefined) => 
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

  if (activeError) {
    return (
      <Card className="p-6 text-center">
        <p className="text-destructive">
          {translations.orderError.ru}: {activeError.message}
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center gap-4 flex-col lg:flex-row">
        <div className="flex items-center gap-4">
         <h2 className="text-2xl font-bold">
            Предзаказы
          </h2>
        </div>
        
        <div className="flex flex-wrap gap-3 items-center">
          {/* Выбор ресторана */}
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

      {!selectedRestaurantId ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-[300px] w-full rounded-lg" />
          ))}
        </div>
      ) : filteredActiveOrders.length === 0 ? (
        <Card className="p-6 text-center">
          <p className="text-muted-foreground">
            {translations.noOrders.ru}
          </p>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredActiveOrders.map(order => (
              <div 
                key={order.id}
                className="cursor-pointer"
              >
                <OrderCard
                  selectedRestaurantId={selectedRestaurantId}
                  className="min-h-[300px] w-full"
                  order={order as any}
                  variant="preorder"
                  onStatusChange={handleStatusChange}
                />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}