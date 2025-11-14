'use client'

import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination'
import { useState, useEffect, useCallback } from 'react'
import { OrderCard } from '@/components/features/order/OrderCard'
import type { OrderItemDto, OrderResponse } from '@/lib/api/order.service'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/lib/hooks/useAuth'
import { useActiveRestaurantOrders, useRestaurantArchive, useRestaurantOrders } from '@/lib/hooks/useOrders'
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
import { Utensils, ShoppingBag, Truck, GlassWater, Archive, Calendar, Filter, X, Clock, AlertTriangle } from 'lucide-react'
import { useLanguageStore } from '@/lib/stores/language-store'
import Loading from '../Loading'
import { DateRange } from 'react-day-picker'
import { format } from 'date-fns'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { DateRangePicker } from '@/components/ui/data-range-picker'
import { useOrderWebSocket } from '@/lib/hooks/useOrderWebSocket'
import { useRestaurantSchedule } from '@/lib/hooks/useRestaurantSchedule'
import { useRestaurants } from '@/lib/hooks/useRestaurant';
import { useRestaurantById } from '@/lib/hooks/useRestaurantById'

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
    ru: 'Заказы',
    ka: 'შეკვეთები'
  },
  dateRange: {
    ru: 'Диапазон дат',
    ka: 'თარიღების დიაპაზონი'
  },
  clearFilters: {
    ru: 'Очистить фильтры',
    ka: 'ფილტრების გასუფთავება'
  },
  filters: {
    ru: 'Фильтры',
    ka: 'ფილტრები'
  },
  reordered: {
    ru: 'Дозаказ',
    ka: 'განმეორებითი'
  },
  discount: {
    ru: 'Со скидкой',
    ka: 'ფასდაკლებით'
  },
  discountCanceled: {
    ru: 'Скидка отменена',
    ka: 'ფასდაკლება გაუქმებული'
  },
  refund: {
    ru: 'Возвраты',
    ka: 'დაბრუნებები'
  },
  newOrderWs: {
    ru: 'Новый заказ',
    ka: 'ახალი შეკვეთა'
  },
  orderUpdatedWs: {
    ru: 'Заказ обновлен',
    ka: 'შეკვეთა განახლდა'
  },
  newItemWs: {
    ru: 'Новая позиция в заказе',
    ka: 'ახალი პოზიცია შეკვეთაში'
  }
}

const RESTAURANT_STORAGE_KEY = 'selectedRestaurantId';

// Функция для создания безопасной копии заказа
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

export function OrdersList() {
  const { language } = useLanguageStore()
  const t = (key: keyof typeof translations) => translations[key][language]

  const router = useRouter()
  const { user } = useAuth()
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string>('')
  const [selectedOrderType, setSelectedOrderType] = useState<string>('ALL')
  const [showArchive, setShowArchive] = useState<boolean>(false)
  const [page, setPage] = useState(1)
  const limit = 12
  const { isRestaurantOpen } = useRestaurantSchedule();
  const { restaurant: selectedRestaurant, isLoading: restaurantLoading } = useRestaurantById(selectedRestaurantId);
  const [restaurantStatus, setRestaurantStatus] = useState<{ 
    isOpen: boolean; 
    message: string;
    nextOpenTime?: string;
  } | null>(null);

  // Фильтры архива
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [isReordered, setIsReordered] = useState<boolean | undefined>()
  const [hasDiscount, setHasDiscount] = useState<boolean | undefined>()
  const [discountCanceled, setDiscountCanceled] = useState<boolean | undefined>()
  const [isRefund, setIsRefund] = useState<boolean | undefined>()
  
  useEffect(() => {
      if (!selectedRestaurantId || !selectedRestaurant) {
        setRestaurantStatus(null);
        return;
    }})

  const archiveFilters = {
    page,
    limit,
    status: selectedOrderType === 'ALL' ? undefined : [selectedOrderType as any],
    startDate: dateRange?.from?.toISOString(),
    endDate: dateRange?.to?.toISOString(),
    isReordered,
    hasDiscount,
    discountCanceled,
    isRefund
  }

   const handleNewOrder = () => {
    if (!selectedRestaurantId) {
      toast.error('Выберите ресторан');
      return;
    }

    if (restaurantStatus && !restaurantStatus.isOpen) {
      toast.error(`Невозможно создать заказ: ${restaurantStatus.message}`);
      return;
    }

    router.push('/orders/new');
  };

  
useEffect(() => {
    if (!selectedRestaurantId || !selectedRestaurant) {
      setRestaurantStatus(null);
      return;
    }

    // Функция для проверки статуса
    const checkRestaurantStatus = () => {
      try {
        const newStatus = isRestaurantOpen(selectedRestaurant, language);
        console.log('🕒 Restaurant status check:', newStatus);
        setRestaurantStatus(newStatus);
      } catch (error) {
        console.error('Error checking restaurant status:', error);
        setRestaurantStatus({
          isOpen: false,
          message: language === 'ru' ? 'Ошибка проверки расписания' : 'განრიგის შემოწმების შეცდომა'
        });
      }
    };

    checkRestaurantStatus();

    const interval = setInterval(checkRestaurantStatus, 30000);

    return () => clearInterval(interval);
  }, [selectedRestaurantId, selectedRestaurant, isRestaurantOpen, language]);


   useEffect(() => {
      if (selectedRestaurantId) {
        localStorage.setItem(RESTAURANT_STORAGE_KEY, selectedRestaurantId)
      }
    }, [selectedRestaurantId])
    
    useEffect(() => {
      if (selectedRestaurantId && selectedRestaurant) {
        const newStatus = isRestaurantOpen(selectedRestaurant, language);
        setRestaurantStatus(newStatus);
      }
    }, [selectedRestaurantId, selectedRestaurant]);
  const {
    data: activeOrders = [],
    isLoading: activeLoading,
    error: activeError,
    mutate: mutateActive
  } = useActiveRestaurantOrders(selectedRestaurantId)

  const {
    data: archiveData,
    isLoading: archiveLoading,
    error: archiveError,
    mutate: mutateArchive
  } = useRestaurantArchive(selectedRestaurantId, archiveFilters)

  // WebSocket подключение с защитой от undefined полей
  const { isConnected } = useOrderWebSocket({
    restaurantId: selectedRestaurantId,
    enabled: !!selectedRestaurantId && !showArchive,
    onOrderCreated: useCallback((newOrder: OrderResponse) => {
      console.log('📦 New order received via WebSocket:', newOrder)
      
      // Защита от undefined полей
      const orderNumber = newOrder.number || newOrder.id?.slice(-6) || 'N/A'
      
      // Показываем тост только для активных заказов
      if (!['COMPLETED', 'CANCELLED'].includes(newOrder.status || '')) {
        toast.success(`${t('newOrderWs')}`)
      }
      
      mutateActive((prevOrders: OrderResponse[] | undefined) => {
        const existingOrders = prevOrders || []
        
        // Если заказ уже есть в списке, обновляем его
        const existingIndex = existingOrders.findIndex(order => order.id === newOrder.id)
        if (existingIndex !== -1) {
          const updatedOrders = [...existingOrders]
          updatedOrders[existingIndex] = newOrder
          return updatedOrders
        }
        
        // Если заказа нет в списке и он активный, добавляем его
        if (!['COMPLETED', 'CANCELLED'].includes(newOrder.status || '')) {
          return [newOrder, ...existingOrders]
        }
        
        return existingOrders
      }, false)
    }, [mutateActive, t]),

    onOrderUpdated: useCallback((updatedOrder: OrderResponse) => {
      console.log('🔄 Order updated via WebSocket:', updatedOrder)
      
      mutateActive((prevOrders: OrderResponse[] | undefined) => 
        prevOrders?.map(order => 
          order.id === updatedOrder.id ? updatedOrder : order
        ) || []
      , false)
    }, [mutateActive]),

    onOrderStatusUpdated: useCallback((updatedOrder: OrderResponse) => {
      console.log('📊 Order status updated via WebSocket:', updatedOrder)
      
      mutateActive((prevOrders: OrderResponse[] | undefined) => {
        const existingOrders = prevOrders || []
        
        // Если статус изменился на неактивный, удаляем из списка
        if (['COMPLETED', 'CANCELLED'].includes(updatedOrder.status || '')) {
          return existingOrders.filter(order => order.id !== updatedOrder.id)
        }
        
        // Иначе обновляем заказ
        return existingOrders.map(order => 
          order.id === updatedOrder.id ? updatedOrder : order
        )
      }, false)
    }, [mutateActive]),

    onOrderModified: useCallback((updatedOrder: OrderResponse) => {
      console.log('✏️ Order modified via WebSocket:', updatedOrder)
      
      // Защита от undefined полей
      const items = updatedOrder.items || []
      const orderNumber = updatedOrder.number || updatedOrder.id?.slice(-6) || 'N/A'
      
      // Проверяем, есть ли новые позиции
      const hasNewItems = items.some(item => 
        item.status === 'CREATED' || item.status === 'IN_PROGRESS'
      )
      
      if (hasNewItems) {
        toast.info(`${t('newItemWs')} #${orderNumber}`)
      }
      
      mutateActive((prevOrders: OrderResponse[] | undefined) => 
        prevOrders?.map(order => 
          order.id === updatedOrder.id ? updatedOrder : order
        ) || []
      , false)
    }, [mutateActive, t])
  })

  useEffect(() => {
    if (user?.restaurant?.length > 0) {
      const savedRestaurantId = localStorage.getItem(RESTAURANT_STORAGE_KEY);
      const defaultRestaurantId = user.restaurant[0].id;

      const isValidSavedRestaurant = savedRestaurantId &&
        user.restaurant.some((r: Restaurant) => r.id === savedRestaurantId);

      const newRestaurantId = isValidSavedRestaurant ? savedRestaurantId : defaultRestaurantId;

      setSelectedRestaurantId(newRestaurantId);

      if (!isValidSavedRestaurant || savedRestaurantId !== newRestaurantId) {
        localStorage.setItem(RESTAURANT_STORAGE_KEY, newRestaurantId);
      }
    }
  }, [user])



  useEffect(() => {
    setPage(1)
  }, [selectedOrderType, showArchive, dateRange, isReordered, hasDiscount, discountCanceled, isRefund])

  const currentData = showArchive ? archiveData?.data || [] : activeOrders
  const isLoading = showArchive ? archiveLoading : activeLoading
  const error = showArchive ? archiveError : activeError
  const totalPages = archiveData?.meta?.totalPages || 1

  const filteredActiveOrders = selectedOrderType === 'ALL'
    ? activeOrders
    : activeOrders.filter((order: OrderResponse) => 
        (order.type || 'UNKNOWN') === selectedOrderType
      )

  const sortedOrders = [...(showArchive ? currentData : filteredActiveOrders)]
    .filter(order => order?.id) // Фильтруем заказы без id
    .map(order => createSafeOrder(order)) // Создаем безопасные копии
    .sort((a, b) => {
      const isACompletedOrCancelled = a.status === 'COMPLETED' || a.status === 'CANCELLED'
      const isBCompletedOrCancelled = b.status === 'COMPLETED' || b.status === 'CANCELLED'

      if (isACompletedOrCancelled === isBCompletedOrCancelled) {
        const dateA = new Date(a.createdAt).getTime()
        const dateB = new Date(b.createdAt).getTime()
        return dateB - dateA
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
        const mutator = showArchive ? mutateArchive : mutateActive
        mutator()
        toast.success(t('statusUpdated'))
      },
      onError: (error) => {
        toast.error(t('statusUpdateError'))
        console.error('Ошибка при обновлении статуса заказа:', error)
      }
    }
  )

  const handleStatusChange = (updatedOrder: OrderResponse) => {
    const mutator = showArchive ? mutateArchive : mutateActive
    mutator()
  }

  const clearFilters = () => {
    setDateRange(undefined)
    setIsReordered(undefined)
    setHasDiscount(undefined)
    setDiscountCanceled(undefined)
    setIsRefund(undefined)
  }

  const hasActiveFilters = () => {
    return dateRange?.from || dateRange?.to ||
      isReordered !== undefined ||
      hasDiscount !== undefined ||
      discountCanceled !== undefined ||
      isRefund !== undefined
  }

  // Рендер пагинации
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

  if (isLoading || !selectedRestaurantId) {
    return (
      <div className="space-y-4">
        <Loading />
      </div>
    )
  }

  if (error) {
    return (
      <Card className="p-6 text-center">
        <p className="text-destructive">
          {t('orderError')}: {error.message}
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-6">{/* Большая желтая плашка когда ресторан закрыт */}
      {selectedRestaurantId && restaurantStatus && !restaurantStatus.isOpen && (
        <div className="w-full bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-amber-800 font-semibold text-lg mb-1">
                {language === 'ru' ? 'Ресторан закрыт' : 'რესტორანი დახურულია'}
              </h3>
              <p className="text-amber-700 text-sm">
                {restaurantStatus.message}
              </p>
            </div>
            <div className="flex-shrink-0">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
          </div>
        </div>
      )}
      <div className="flex flex-col gap-4">
        {/* Заголовок и основные кнопки */}
        <div className="flex flex-col gap-4">
          {/* Первая строка: заголовок и кнопки архив/новый заказ */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-bold">
                {showArchive ? t('ordersList') : t('recentOrders')}
              </h2>
              
              {/* Индикатор подключения WebSocket (только для активных заказов) */}
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

            <div className="flex flex-wrap gap-2 w-full sm:w-auto items-center justify-center">
              <div className="flex gap-2 flex-1 sm:flex-none">
                {user.restaurant.length > 1 && (
                  <Select
                    value={selectedRestaurantId}
                    onValueChange={setSelectedRestaurantId}
                  >
                    <SelectTrigger className="w-full sm:w-[200px]">
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
                  className="flex-1 sm:flex-none"
                >
                  <Archive className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">{t('showArchive')}</span>
                </Button>

                <Button
                  onClick={handleNewOrder}
                  className="flex-[2] sm:flex-none min-w-[140px] sm:min-w-[160px] lg:min-w-[180px] xl:min-w-[200px]"
                  size="lg"
                  disabled={!restaurantStatus?.isOpen}
                >
                  <span className="font-semibold">{t('newOrder')}</span>
                </Button>
                
              </div>
            </div>
          </div>

          {/* Вторая строка: фильтры по типам заказов */}
          <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
            {/* Десктопная версия фильтров */}
            <div className="hidden md:flex flex-wrap gap-2">
              {ORDER_TYPES.map((type) => {
                const Icon = type.icon
                return (
                  <Button
                    key={type.value}
                    variant={selectedOrderType === type.value ? 'default' : 'outline'}
                    onClick={() => setSelectedOrderType(type.value)}
                    className="flex items-center gap-2"
                  >
                    {Icon && <Icon className="h-4 w-4" />}
                    <span className="font-medium">{type.label[language]}</span>
                  </Button>
                )
              })}
            </div>

            {/* Мобильная версия фильтров */}
            <div className="flex md:hidden gap-1 w-full justify-center">
              {ORDER_TYPES.map((type) => {
                const Icon = type.icon
                return (
                  <Button
                    key={type.value}
                    variant={selectedOrderType === type.value ? 'default' : 'outline'}
                    onClick={() => setSelectedOrderType(type.value)}
                    size="sm"
                    className="flex-1 min-w-[60px] max-w-[80px] px-2"
                  >
                    {Icon && <Icon className="h-4 w-4" />}
                    <span className="sr-only">{type.label[language]}</span>
                  </Button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Фильтры архива */}
        {showArchive && (
          <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3 p-4 bg-muted/50 rounded-lg">
            <DateRangePicker
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
              className="w-full sm:w-[280px]"
            />

            <div className="flex flex-wrap gap-4 sm:gap-6">
              <div className="flex items-center space-x-2">
                <Switch
                  id="reordered-filter"
                  checked={isReordered || false}
                  onCheckedChange={(checked) => setIsReordered(checked ? true : undefined)}
                />
                <Label htmlFor="reordered-filter" className="text-sm whitespace-nowrap">
                  {t('reordered')}
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="discount-filter"
                  checked={hasDiscount || false}
                  onCheckedChange={(checked) => setHasDiscount(checked ? true : undefined)}
                />
                <Label htmlFor="discount-filter" className="text-sm whitespace-nowrap">
                  {t('discount')}
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="discount-canceled-filter"
                  checked={discountCanceled || false}
                  onCheckedChange={(checked) => setDiscountCanceled(checked ? true : undefined)}
                />
                <Label htmlFor="discount-canceled-filter" className="text-sm whitespace-nowrap">
                  {t('discountCanceled')}
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="refund-filter"
                  checked={isRefund || false}
                  onCheckedChange={(checked) => setIsRefund(checked ? true : undefined)}
                />
                <Label htmlFor="refund-filter" className="text-sm whitespace-nowrap">
                  {t('refund')}
                </Label>
              </div>

              {hasActiveFilters() && (
                <Button
                  variant="ghost"
                  onClick={clearFilters}
                  className="text-destructive h-8 px-2 sm:px-3"
                  size="sm"
                >
                  <X className="h-3 w-3 sm:mr-2" />
                  <span className="hidden sm:inline">{t('clearFilters')}</span>
                  <span className="sm:hidden">×</span>
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {sortedOrders.length === 0 ? (
        <Card className="p-6 text-center">
          <p className="text-muted-foreground">
            {showArchive ? t('noOrders') : t('noRecentOrders')}
          </p>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {sortedOrders.map(order => (
              <div
                key={order.id}
                className="cursor-pointer transition-transform hover:scale-[1.02]"
              >
                <OrderCard
                  variant='default'
                  order={order as any}
                  onStatusChange={handleStatusChange}
                />
              </div>
            ))}
          </div>
          {renderPagination()}
        </>
      )}
    </div>
  )
}