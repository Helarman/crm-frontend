'use client'

import { useState, useRef, useEffect, MouseEvent } from 'react'
import { OrderHeader } from './OrderHeader'
import { OrderItemsList } from './OrderItemsList'
import { OrderCustomerInfo } from './OrderCustomerInfo'
import { OrderActions } from './OrderActions'
import { OrderPaymentStatus } from './OrderPaymentStatus'
import { Card } from '@/components/ui/card'
import { OrderResponse } from '@/lib/api/order.service'
import { cn } from '@/lib/utils'
import { useLanguageStore } from '@/lib/stores/language-store'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useRouter } from 'next/navigation'

const statusColors = {
  CREATED: 'border-l-amber-500 bg-amber-50',
  CONFIRMED: 'border-l-blue-500 bg-blue-50',
  PREPARING: 'border-l-purple-500 bg-purple-50',
  READY: 'border-l-green-500 bg-green-50',
  DELIVERING: 'border-l-cyan-500 bg-cyan-50',
  COMPLETED: 'border-l-gray-500 bg-gray-100',
  CANCELLED: 'border-l-red-500 bg-red-50'
}

const MAX_VISIBLE_ITEMS = 7

export function OrderCard({ order, variant = 'default', onStatusChange, className }: {
  order: OrderResponse
  variant?: 'default' | 'kitchen'
  onStatusChange?: (updatedOrder: OrderResponse) => void
  className?: string
}) {
  const router = useRouter()
  const { language } = useLanguageStore()
  const totalAmount = order.totalAmount
  const [showAllItems, setShowAllItems] = useState(false)
  const [contentHeight, setContentHeight] = useState(0)
  const contentRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(showAllItems 
        ? contentRef.current.scrollHeight 
        : Math.min(contentRef.current.scrollHeight, MAX_VISIBLE_ITEMS * 40)
      )
    }
  }, [showAllItems, order.items])

  const hasHiddenItems = order.items.length > MAX_VISIBLE_ITEMS

  const handleCardClick = () => {
    const routePath = variant === 'kitchen' 
      ? `/kitchen/${order.id}`
      : `/orders/${order.id}`
    router.push(routePath)
  }

  const handleButtonClick = (e: MouseEvent) => {
    e.stopPropagation()
  }

  return (
    <Card 
      className={cn(
        "flex flex-col h-full relative overflow-hidden text dark:text-gray-900",
        "border-l-4 cursor-pointer",
        statusColors[order.status],
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
            <OrderItemsList 
              items={order.items} 
              variant={variant} 
              compact={variant === 'kitchen'}
            />
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
                    ? `Показать ещё ` 
                    : `ნაჩვენებია კიდევ`}
                </>
              )}
            </Button>
          )}
          {order.surcharges && order.surcharges.length > 0 && (
            <div className="space-y-1 border-t pt-2">
              <div className="text-sm font-medium text-muted-foreground">
                {language === 'ru' ? 'Надбавки:' : 'დამატებითი გადასახადები:'}
              </div>
              {order.surcharges.map((surcharge) => (
                <div key={surcharge.id} className="flex justify-between text-sm">
                  <span>{surcharge.title}</span>
                  <span className="font-medium">
                    {surcharge.type === 'FIXED'
                      ? `+${surcharge.amount.toFixed(2)} ₽`
                      : `+${surcharge.amount}%`}
                  </span>
                </div>
              ))}
            </div>
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