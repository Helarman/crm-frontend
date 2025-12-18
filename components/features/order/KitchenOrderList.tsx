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
import { DateRange } from 'react-day-picker'
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination'
import { Archive, Volume2, VolumeX, X, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DateRangePicker } from '@/components/ui/data-range-picker'
import { Badge } from '@/components/ui/badge'
import { Restaurant } from '@/lib/types/restaurant'

const RESTAURANT_STORAGE_KEY = 'selectedRestaurantId'
const KITCHEN_SOUNDS_ENABLED_KEY = 'kitchenSoundsEnabled'

const createAudio = (src: string) => {
  if (typeof window === 'undefined') return null
  const audio = new Audio(src)
  audio.volume = 0.3 // Устанавливаем громкость 30%
  return audio
}

// Инициализация звуков
const orderSound = createAudio('/sounds/order.mp3')
const reorderSound = createAudio('/sounds/item.mp3')
const refundSound = createAudio('/sounds/refaund.mp3')

const playSound = (audio: HTMLAudioElement | null) => {
  if (!audio) return
  
  try {
    // Сбрасываем звук на начало если он уже играет
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
  noOrders: {
    ru: 'Нет заказов для приготовления',
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
  },
  refundedItems: {
    ru: 'Возвращенные позиции',
    ka: 'დაბრუნებული პოზიციები'
  }
}

const createSafeOrder = (order: OrderResponse) => {
  return {
    ...order,
    id: order.id || `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    number: order.number || order.id?.slice(-6) || 'N/A',
    status: order.status || 'UNKNOWN',
    type: order.type || 'UNKNOWN',
    items: order.items || [],
    createdAt: order.createdAt || new Date().toISOString(),
    updatedAt: order.updatedAt || new Date().toISOString(),
  }
}

const hasOrderBecomePreparing = (newOrder: OrderResponse, previousOrder?: OrderResponse): boolean => {
  return newOrder.status === 'PREPARING' && previousOrder?.status !== 'PREPARING'
}

const hasItemsBecomeInProgress = (newOrder: OrderResponse, previousOrder?: OrderResponse): boolean => {
  if (!previousOrder) return false
  
  const newInProgressItems = newOrder.items?.filter(item => item.status === 'IN_PROGRESS') || []
  const previousInProgressItems = previousOrder.items?.filter(item => item.status === 'IN_PROGRESS') || []
  
  // Находим items которые стали IN_PROGRESS (были в другом статусе, теперь IN_PROGRESS)
  const becameInProgress = newInProgressItems.filter(newItem => {
    const previousItem = previousInProgressItems.find(prevItem => prevItem.id === newItem.id)
    // Item стал IN_PROGRESS если его не было в предыдущих IN_PROGRESS
    return !previousItem
  })
  
  return becameInProgress.length > 0
}

const hasNewItemsRefunded = (newOrder: OrderResponse, previousOrder?: OrderResponse): boolean => {
  if (!previousOrder) return false
  
  const newRefundedItems = newOrder.items?.filter(item => 
    item.status === 'REFUNDED'
  ) || []
  
  const previousRefundedItems = previousOrder.items?.filter(item => 
    item.status === 'REFUNDED'
  ) || []
  
  return newRefundedItems.length > previousRefundedItems.length
}




export default function KitchenOrdersList() {
  const router = useRouter()
  const { user } = useAuth()
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string>('')
  const [showArchive, setShowArchive] = useState<boolean>(false)
  const [soundsEnabled, setSoundsEnabled] = useState<boolean>(true)
  const [page, setPage] = useState(1)
  const limit = 12
  
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  
  const previousOrdersRef = useRef<Map<string, OrderResponse>>(new Map())
  const soundsEnabledRef = useRef(soundsEnabled)
  const [ordersWithRefunded, setOrdersWithRefunded] = useState<Set<string>>(new Set())
  const highlightTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map())

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

    const playNewOrderSound = useCallback(() => {
    if (soundsEnabledRef.current && orderSound) {
      playSound(orderSound)
    }
  }, [])

  const playItemInProgressSound = useCallback(() => {
  playSound(reorderSound)
  }, [])

  const playItemRefundedSound = useCallback(() => {
    if (soundsEnabledRef.current && refundSound) {
      playSound(refundSound)
    }
  }, [])

  const highlightOrderWithRefunded = useCallback((orderId: string) => {
    const existingTimeout = highlightTimeoutsRef.current.get(orderId)
    if (existingTimeout) {
      clearTimeout(existingTimeout)
    }
    
    setOrdersWithRefunded(prev => new Set(prev).add(orderId))
    
    const timeoutId = setTimeout(() => {
      setOrdersWithRefunded(prev => {
        const newSet = new Set(prev)
        newSet.delete(orderId)
        return newSet
      })
      highlightTimeoutsRef.current.delete(orderId)
    }, 30000) // 30 секунд
    
    // Сохраняем ID таймаута
    highlightTimeoutsRef.current.set(orderId, timeoutId)
  }, [])

  // Очистка таймаутов при размонтировании компонента
  useEffect(() => {
    return () => {
      highlightTimeoutsRef.current.forEach(timeout => {
        clearTimeout(timeout)
      })
      highlightTimeoutsRef.current.clear()
    }
  }, [])

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

  
  const archiveFilters = {
    page,
    limit,
    status: ['CONFIRMED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED'] as any,
    startDate: dateRange?.from?.toISOString(),
    endDate: dateRange?.to?.toISOString(),
  }

  const { 
    data: activeOrders = [], 
    isLoading: activeLoading, 
    error: activeError,
    mutate: mutateActive 
  } = useRestaurantOrders(selectedRestaurantId)

  const {
    data: archiveData,
    isLoading: archiveLoading,
    error: archiveError,
    mutate: mutateArchive
  } = useRestaurantArchive(selectedRestaurantId, archiveFilters)

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
    const previousOrder = previousOrdersRef.current.get(updatedOrder.id)
    
    if (hasOrderBecomePreparing(updatedOrder, previousOrder)) {
      playNewOrderSound()
    }
     if (hasItemsBecomeInProgress(updatedOrder, previousOrder)) {
      playItemInProgressSound()
    }

    if (hasNewItemsRefunded(updatedOrder, previousOrder)) {
      playItemRefundedSound()
      highlightOrderWithRefunded(updatedOrder.id)
      
    }
    
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
  }, [playNewOrderSound, playItemInProgressSound, playItemRefundedSound, highlightOrderWithRefunded, updatePreviousOrders])



  const { isConnected } = useOrderWebSocket({
    restaurantId: selectedRestaurantId,
    enabled: !!selectedRestaurantId,
    onOrderCreated: useCallback((newOrder: OrderResponse) => {
      
      if (newOrder.status === 'PREPARING') {
        playNewOrderSound()
      }

      handleOrdersUpdate(newOrder, mutateActive, 'onOrderCreated')
    }, [mutateActive, playNewOrderSound, handleOrdersUpdate]),

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

  type OrderStatus = 'PREPARING' | 'READY'

  const filteredActiveOrders = activeOrders.filter((order: OrderResponse) => 
    [ 'PREPARING', 'READY'].includes(order.status)
  )

  const currentData = showArchive ? archiveData?.data || [] : activeOrders
  const isLoading = showArchive ? archiveLoading : activeLoading
  const error = showArchive ? archiveError : activeError
  const totalPages = archiveData?.meta?.totalPages || 1

const sortedActiveOrders = [...filteredActiveOrders].sort((a, b) => {
  const statusPriority: Record<OrderStatus, number> = {
    'PREPARING': 1,
    'READY': 2,
  }

  const aStatus = a.status as OrderStatus
  const bStatus = b.status as OrderStatus

  if (statusPriority[aStatus] !== statusPriority[bStatus]) {
    return statusPriority[aStatus] - statusPriority[bStatus]
  }

  if (aStatus === 'PREPARING') {
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  } else {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  }
})

  const sortedOrders = showArchive 
    ? [...currentData]
        .filter(order => order?.id)
        .map(order => createSafeOrder(order))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    : sortedActiveOrders

  const handleStatusChange = (updatedOrder: OrderResponse) => {
    mutateActive((prevOrders: OrderResponse[] | undefined) => 
      prevOrders?.map(o => o.id === updatedOrder.id ? updatedOrder : o) || []
    )
  }

  const clearFilters = () => {
    setDateRange(undefined)
  }

  const hasActiveFilters = () => {
    return dateRange?.from || dateRange?.to
  }
  
  const renderPagination = () => {
    if (!showArchive || totalPages <= 1) return null

    return (
      <Pagination className="mt-6">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => setPage(p => Math.max(1, p - 1))}
            />
          </PaginationItem>

          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum
            if (totalPages <= 5) {
              pageNum = i + 1
            } else if (page <= 3) {
              pageNum = i + 1
            } else if (page >= totalPages - 2) {
              pageNum = totalPages - 4 + i
            } else {
              pageNum = page - 2 + i
            }

            return (
              <PaginationItem key={pageNum}>
                <PaginationLink
                  isActive={pageNum === page}
                  onClick={() => setPage(pageNum)}
                >
                  {pageNum}
                </PaginationLink>
              </PaginationItem>
            )
          })}

          <PaginationItem>
            <PaginationNext
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
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
            {showArchive ? translations.archiveOrders.ru : translations.kitchenOrders.ru}
          </h2>
          {!showArchive && (
            <div className={`flex items-center gap-2 ${isConnected ? 'text-green-500' : 'text-gray-500'}`}>
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
              <span className="text-sm">
                {selectedRestaurantId 
                  ? (isConnected ? 'Подключено' : 'Подключение...') 
                  : 'Выберите ресторан'
                }
              </span>
            </div>
          )}
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

          <Button
            variant={showArchive ? 'default' : 'outline'}
            onClick={() => setShowArchive(!showArchive)}
            className="flex items-center gap-2"
          >
            <Archive className="h-4 w-4" />
            <span className="hidden sm:inline">
              {showArchive ? translations.showActive.ru : translations.showArchive.ru}
            </span>
          </Button>
           {showArchive && (
        <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3 p-4 bg-muted/50 rounded-lg">
          <DateRangePicker
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            className="w-full sm:w-[280px]"
          />

          {hasActiveFilters() && (
            <Button
              variant="ghost"
              onClick={clearFilters}
              className="text-destructive h-8 px-3"
              size="sm"
            >
              <X className="h-3 w-3 mr-2" />
              {translations.clearFilters.ru}
            </Button>
          )}
        </div>
      )}
      
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

      {isLoading || !selectedRestaurantId ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-[300px] w-full rounded-lg" />
          ))}
        </div>
      ) : sortedOrders.length === 0 ? (
        <Card className="p-6 text-center">
          <p className="text-muted-foreground">
            {showArchive ? translations.noArchiveOrders.ru : translations.noOrders.ru}
          </p>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedOrders.map(order => {
              const hasRefundedItems = order.items?.some(item => item.status === 'REFUNDED')
              const isHighlighted = ordersWithRefunded.has(order.id)
              
              return (
                <div 
                  key={order.id}
                  className={`cursor-pointer relative transition-all duration-300`}
                >

                  <OrderCard
                    kitchenArchive={showArchive}
                    selectedRestaurantId={selectedRestaurantId}
                    className={`min-h-[300px] w-full transition-all duration-300 ${isHighlighted ? 'bg-red-100 border-2 border-red-400' : ''}`}
                    order={order as any}
                    variant="kitchen"
                    onStatusChange={handleStatusChange}
                  />
                </div>
              )
            })}
          </div>
          {renderPagination()}
        </>
      )}
    </div>
  )
}