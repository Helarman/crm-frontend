'use client'

import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination'
import { useState, useEffect } from 'react'
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
import { Utensils, ShoppingBag, Truck, GlassWater, Archive, Calendar, Filter, X } from 'lucide-react'
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
  }
}

const RESTAURANT_STORAGE_KEY = 'selectedRestaurantId';

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

  // Фильтры архива
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [isReordered, setIsReordered] = useState<boolean | undefined>()
  const [hasDiscount, setHasDiscount] = useState<boolean | undefined>()
  const [discountCanceled, setDiscountCanceled] = useState<boolean | undefined>()
  const [isRefund, setIsRefund] = useState<boolean | undefined>()

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

  // Хуки для данных
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

  useEffect(() => {
    if (user?.restaurant?.length > 0) {
      const savedRestaurantId = localStorage.getItem(RESTAURANT_STORAGE_KEY);
      const defaultRestaurantId = user.restaurant[0].id;
      
      const isValidSavedRestaurant = savedRestaurantId && 
        user.restaurant.some((r : Restaurant) => r.id === savedRestaurantId);
      
      const newRestaurantId = isValidSavedRestaurant ? savedRestaurantId : defaultRestaurantId;
      
      setSelectedRestaurantId(newRestaurantId);
      
      if (!isValidSavedRestaurant || savedRestaurantId !== newRestaurantId) {
        localStorage.setItem(RESTAURANT_STORAGE_KEY, newRestaurantId);
      }
    }
  }, [user])

  useEffect(() => {
    if (selectedRestaurantId) {
      localStorage.setItem(RESTAURANT_STORAGE_KEY, selectedRestaurantId);
    }
  }, [selectedRestaurantId])

  useEffect(() => {
    setPage(1)
  }, [selectedOrderType, showArchive, dateRange, isReordered, hasDiscount, discountCanceled, isRefund])

  const currentData = showArchive ? archiveData?.data || [] : activeOrders
  const isLoading = showArchive ? archiveLoading : activeLoading
  const error = showArchive ? archiveError : activeError
  const totalPages = archiveData?.meta?.totalPages || 1

  const filteredActiveOrders = selectedOrderType === 'ALL' 
    ? activeOrders 
    : activeOrders.filter((order: OrderResponse) => order.type === selectedOrderType)

  const sortedOrders = [...(showArchive ? currentData : filteredActiveOrders)].sort((a, b) => {
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
        <Loading/>
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

        {showArchive && (
          <div className="flex flex-wrap items-center gap-4 p-4 bg-muted/50 rounded-lg">
            <DateRangePicker
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
              className="w-[280px]"
            />

            <div className="flex items-center space-x-2 ml-3">
              <Switch 
                id="reordered-filter" 
                checked={isReordered || false}
                onCheckedChange={(checked) => setIsReordered(checked ? true : undefined)}
              />
              <Label htmlFor="reordered-filter">{t('reordered')}</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch 
                id="discount-filter" 
                checked={hasDiscount || false}
                onCheckedChange={(checked) => setHasDiscount(checked ? true : undefined)}
              />
              <Label htmlFor="discount-filter">{t('discount')}</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch 
                id="discount-canceled-filter" 
                checked={discountCanceled || false}
                onCheckedChange={(checked) => setDiscountCanceled(checked ? true : undefined)}
              />
              <Label htmlFor="discount-canceled-filter">{t('discountCanceled')}</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch 
                id="refund-filter" 
                checked={isRefund || false}
                onCheckedChange={(checked) => setIsRefund(checked ? true : undefined)}
              />
              <Label htmlFor="refund-filter">{t('refund')}</Label>
            </div>

            {hasActiveFilters() && (
              <Button 
                variant="ghost" 
                onClick={clearFilters}
                className="text-destructive"
              >
                <X className="h-4 w-4 mr-2" />
                {t('clearFilters')}
              </Button>
            )}
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
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
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
          {renderPagination()}
        </>
      )}
    </div>
  )
}