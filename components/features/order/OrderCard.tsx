'use client'

import { useState, useRef, useEffect, MouseEvent } from 'react'
import { OrderHeader } from './OrderHeader'
import { OrderItemsList } from './OrderItemsList'
import { OrderCustomerInfo } from './OrderCustomerInfo'
import { OrderActions } from './OrderActions'
import { OrderPaymentStatus } from './OrderPaymentStatus'
import { Card } from '@/components/ui/card'
import { OrderResponse, OrderItemStatus, OrderService } from '@/lib/api/order.service'
import { cn } from '@/lib/utils'
import { useLanguageStore } from '@/lib/stores/language-store'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronUp, Check, Play, Pause, Clock, Utensils } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useAuth } from '@/lib/hooks/useAuth'

const statusColors = {
  CREATED: {
    border: 'border-l-amber-500',
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    itemBorder: 'border-amber-200 dark:border-amber-800'
  },
  CONFIRMED: {
    border: 'border-l-blue-500',
    bg: 'bg-blue-50 dark:bg-blue-900/60',
    itemBorder: 'border-blue-200 dark:border-blue-800'
  },
  PREPARING: {
    border: 'border-l-purple-500',
    bg: 'bg-purple-50 dark:bg-purple-900/60',
    itemBorder: 'border-purple-200 dark:border-purple-800'
  },
  READY: {
    border: 'border-l-green-500',
    bg: 'bg-green-50 dark:bg-green-900/60',
    itemBorder: 'border-green-200 dark:border-green-800'
  },
  DELIVERING: {
    border: 'border-l-cyan-500',
    bg: 'bg-cyan-50 dark:bg-cyan-900/60',
    itemBorder: 'border-cyan-200 dark:border-cyan-800'
  },
  COMPLETED: {
    border: 'border-l-gray-500',
    bg: 'bg-gray-100 dark:bg-gray-900/60',
    itemBorder: 'border-gray-200 dark:border-gray-800'
  },
  CANCELLED: {
    border: 'border-l-red-500',
    bg: 'bg-red-50 dark:bg-red-900/60',
    itemBorder: 'border-red-200 dark:border-red-800'
  }
}

const MAX_VISIBLE_ITEMS = 3

const getStatusText = (status: OrderItemStatus, language: string): string => {
  const translations = {
    ru: {
      [OrderItemStatus.CREATED]: 'Создан',
      [OrderItemStatus.IN_PROGRESS]: 'В процессе',
      [OrderItemStatus.PARTIALLY_DONE]: 'Частично готов',
      [OrderItemStatus.PAUSED]: 'На паузе',
      [OrderItemStatus.COMPLETED]: 'Готов',
      [OrderItemStatus.CANCELLED]: 'Отменен',
      [OrderItemStatus.REFUNDED]: 'Возвращен'
    },
    ka: {
      [OrderItemStatus.CREATED]: 'შექმნილი',
      [OrderItemStatus.IN_PROGRESS]: 'მუშავდება',
      [OrderItemStatus.PARTIALLY_DONE]: 'ნაწილობრივ მზადაა',
      [OrderItemStatus.PAUSED]: 'პაუზაზეა',
      [OrderItemStatus.COMPLETED]: 'მზადაა',
      [OrderItemStatus.CANCELLED]: 'გაუქმებული',
      [OrderItemStatus.REFUNDED]: 'დაბრუნებული'
    }
  }
  return translations[language as 'ru' | 'ka'][status] || status
}

export function OrderCard({ order, variant = 'default', onStatusChange, className }: {
  order: OrderResponse
  variant?: 'default' | 'kitchen'
  onStatusChange?: (updatedOrder: OrderResponse) => void
  className?: string
}) {
  const router = useRouter()
  const { user } = useAuth()
  const { language } = useLanguageStore()
  const totalAmount = order.totalAmount
  const [showAllItems, setShowAllItems] = useState(false)
  const [contentHeight, setContentHeight] = useState(0)
  const [isUpdating, setIsUpdating] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  
  const currentStatusStyle = statusColors[order.status] || statusColors.CREATED
  
  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(showAllItems 
        ? contentRef.current.scrollHeight 
        : Math.min(contentRef.current.scrollHeight, MAX_VISIBLE_ITEMS * 64)
      )
    }
  }, [showAllItems, order.items])

  const hasHiddenItems = order.items.length > MAX_VISIBLE_ITEMS

  const handleCardClick = () => {
    const routePath = `/orders/${order.id}`
    if(variant === 'default' ){ 
        router.push(routePath)
    } 
  }

  const handleButtonClick = (e: MouseEvent) => {
    e.stopPropagation()
  }

  const handleItemStatusChange = async (itemId: string, newStatus: OrderItemStatus) => {
    if (!user?.id || isUpdating) return
  
    try {
      setIsUpdating(true)
      
      // Оптимистичное обновление
      const updatedItems = order.items.map(item => 
        item.id === itemId 
          ? { 
              ...item, 
              status: newStatus,
              user: newStatus === OrderItemStatus.IN_PROGRESS ? { id: user.id, name: user.name } : item.user
            } 
          : item
      )

      const updatedOrder = { ...order, items: updatedItems }
      
      // Вызов API для обновления статуса
      await OrderService.updateItemStatus(
        order.id,
        itemId,
        { 
          status: newStatus,
          userId: newStatus === OrderItemStatus.IN_PROGRESS ? user.id : undefined
        }
      )
      
      // Вызов callback для обновления родительского состояния
      if (onStatusChange) {
        onStatusChange(updatedOrder)
      }

      toast.success(getStatusText(newStatus, language))
    } catch (err) {
      toast.error(language === 'ru' ? 'Ошибка обновления статуса' : 'სტატუსის განახლების შეცდომა')
      console.error('Error updating item status:', err)
    } finally {
      setIsUpdating(false)
    }
  }

  const renderItemStatusControls = (item: OrderResponse['items'][0]) => {
    if (variant !== 'kitchen') return null

    return (
      <div className="flex flex-wrap gap-1 mt-2">
        {item.status === OrderItemStatus.CREATED && (
          <Button
            
            variant="default"
            onClick={(e) => {
              e.stopPropagation()
              handleItemStatusChange(item.id, OrderItemStatus.IN_PROGRESS)
            }}
            disabled={isUpdating}
            className="h-7"
          >
            <Play className="mr-1 h-3 w-3" />
            {language === 'ru' ? 'Начать' : 'დაწყება'}
          </Button>
        )}
        
        {item.status === OrderItemStatus.IN_PROGRESS && (
          <>
            <Button
              
              variant="secondary"
              onClick={(e) => {
                e.stopPropagation()
                handleItemStatusChange(item.id, OrderItemStatus.PARTIALLY_DONE)
              }}
              disabled={isUpdating}
              className="h-7"
            >
              <Clock className="mr-1 h-3 w-3" />
              {language === 'ru' ? 'Частично' : 'ნაწილობრივ'}
            </Button>
            
            <Button
              
              variant="outline"
              onClick={(e) => {
                e.stopPropagation()
                handleItemStatusChange(item.id, OrderItemStatus.PAUSED)
              }}
              disabled={isUpdating}
              className="h-7"
            >
              <Pause className="mr-1 h-3 w-3" />
              {language === 'ru' ? 'Пауза' : 'პაუზა'}
            </Button>
          </>
        )}
        
        {item.status === OrderItemStatus.PARTIALLY_DONE && (
          <Button
            
            variant="outline"
            onClick={(e) => {
              e.stopPropagation()
              handleItemStatusChange(item.id, OrderItemStatus.PAUSED)
            }}
            disabled={isUpdating}
            className="h-7"
          >
            <Pause className="mr-1 h-3 w-3" />
            {language === 'ru' ? 'Пауза' : 'პაუზა'}
          </Button>
        )}
        
        {item.status === OrderItemStatus.PAUSED && (
          <>
            <Button
              
              variant="default"
              onClick={(e) => {
                e.stopPropagation()
                handleItemStatusChange(item.id, OrderItemStatus.IN_PROGRESS)
              }}
              disabled={isUpdating}
              className="h-7"
            >
              <Play className="mr-1 h-3 w-3" />
              {language === 'ru' ? 'Продолжить' : 'გაგრძელება'}
            </Button>
            
            <Button
              
              variant="secondary"
              onClick={(e) => {
                e.stopPropagation()
                handleItemStatusChange(item.id, OrderItemStatus.PARTIALLY_DONE)
              }}
              disabled={isUpdating}
              className="h-7"
            >
              <Clock className="mr-1 h-3 w-3" />
              {language === 'ru' ? 'Частично' : 'ნაწილობრივ'}
            </Button>
          </>
        )}
        
        {(item.status === OrderItemStatus.IN_PROGRESS || 
          item.status === OrderItemStatus.PARTIALLY_DONE || 
          item.status === OrderItemStatus.PAUSED) && (
          <Button
            
            variant="default"
            onClick={(e) => {
              e.stopPropagation()
              handleItemStatusChange(item.id, OrderItemStatus.COMPLETED)
            }}
            disabled={isUpdating}
            className="h-7"
          >
            <Check className="mr-1 h-3 w-3" />
            {language === 'ru' ? 'Готово' : 'მზადაა'}
          </Button>
        )}
      </div>
    )
  }

  return (
    <Card 
      className={cn(
        "flex flex-col h-full relative overflow-hidden",
        "border-l-4 cursor-pointer transition-all hover:shadow-md",
        currentStatusStyle.border,
        currentStatusStyle.bg,
        className
      )}
      onClick={handleCardClick}
    >
      <div className="absolute top-0 left-0 w-full h-1" />
      
      <div className="flex flex-col flex-grow pt-1">
        <OrderHeader order={order} compact={variant === 'kitchen'} />
        
        <div className="p-3 space-y-3">
          <div
            ref={contentRef}
            className="overflow-hidden transition-all duration-300 ease-in-out"
            style={{ maxHeight: `${contentHeight}px` }}
          >
            {order.items.map(item => (
              <div 
                key={item.id} 
                className={cn(
                  "mb-2 last:mb-0 p-2 rounded-lg border",
                  currentStatusStyle.itemBorder,
                  "transition-colors hover:bg-opacity-90"
                )}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium flex items-center gap-1">
                      {item.product.title} × {item.quantity}
                    </div>
                    {item.additives.length > 0 && (
                      <div className="text-xs text-muted-foreground">
                        {language === 'ru' ? 'Добавки:' : 'დანამატები:'} {item.additives.map(a => a.name).join(', ')}
                      </div>
                    )}
                    {item.comment && (
                      <div className="text-xs text-muted-foreground">
                        {language === 'ru' ? 'Коммент:' : 'კომენტარი:'} {item.comment}
                      </div>
                    )}
                  </div>
                  <Badge 
                    variant="outline" 
                    className="text-xs"
                  >
                    {getStatusText(item.status, language)}
                  </Badge>
                </div>
                
                {renderItemStatusControls(item)}
              </div>
            ))}
          </div>

          {hasHiddenItems && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-sm text-muted-foreground hover:text-primary"
              onClick={(e) => {
                e.stopPropagation()
                setShowAllItems(!showAllItems)
              }}
            >
              {showAllItems ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-1" />
                  {language === 'ru' ? 'Скрыть' : 'დამალვა'}
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-1" />
                  {language === 'ru' 
                    ? `Показать ещё ${order.items.length - MAX_VISIBLE_ITEMS}` 
                    : `ნაჩვენებია კიდევ ${order.items.length - MAX_VISIBLE_ITEMS}`}
                </>
              )}
            </Button>
          )}
          
          {variant === 'default' && (order.scheduledAt || order.customer) ? (
            <div className='border-t pt-2'>
              {order.customer && variant === 'default' && (
                <OrderCustomerInfo customer={order.customer} compact />
              )}
              {order.scheduledAt &&
                <Badge 
                  variant="outline"
                  className="flex items-center gap-1 px-2 py-1 rounded-md border text-sm font-medium"
                >
                  {language === 'ru' ? 'Отложено до' : 'გადაიდო'}
                  <span className="text-sm">
                    {format(new Date(order.scheduledAt), 'HH:mm')}
                  </span>
                </Badge>
              }
            </div>
          ) : null}
          
          <div className="flex justify-between items-center border-t pt-2">
            <div className="font-medium text-sm">
              {language === 'ru' ? 'Итого:' : 'სულ:'}
            </div>
            <div className="font-bold">
              {totalAmount.toFixed(2)}{language === 'ru' ? '₽' : '₽'}
            </div>
          </div>

          {variant === 'default' && order.payment && (
            <OrderPaymentStatus payment={order.payment} order={order} compact />
          )}
        </div>
      </div>

      <div onClick={handleButtonClick}>
        <OrderActions 
          order={order} 
          variant={variant}
          onStatusChange={onStatusChange}
          compact={variant === 'kitchen'}
        />
      </div>
    </Card>
  )
}