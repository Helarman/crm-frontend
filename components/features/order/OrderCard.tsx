'use client'

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

const statusColors = {
  CREATED: 'border-l-amber-500 bg-amber-50',
  CONFIRMED: 'border-l-blue-500 bg-blue-50',
  PREPARING: 'border-l-purple-500 bg-purple-50',
  READY: 'border-l-green-500 bg-green-50',
  DELIVERING: 'border-l-cyan-500 bg-cyan-50',
  COMPLETED: 'border-l-gray-500 bg-gray-100',
  CANCELLED: 'border-l-red-500 bg-red-50'
}

export function OrderCard({ order, variant = 'default', onStatusChange, className }: {
  order: OrderResponse
  variant?: 'default' | 'kitchen'
  onStatusChange?: (updatedOrder: OrderResponse) => void
  className?: string
}) {
  const { language } = useLanguageStore()
  const totalAmount = order.totalAmount

  return (
    
    <Card className={cn(
      "flex flex-col h-full relative overflow-hidden",
      "border-l-4",
      statusColors[order.status],
      className
    )}>
      <div className="absolute top-0 left-0 w-full h-1" />
      
      <div className="flex flex-col flex-grow pt-1">
        <OrderHeader order={order} compact={variant === 'kitchen'} />
        
        <div className="p-3 space-y-3">
          <OrderItemsList 
            items={order.items} 
            variant={variant} 
            compact={variant === 'kitchen'}
          />
          
          {variant === 'default' && ( order.scheduledAt || order.customer ) ? (<div className=' border-t pt-2'>
          {order.customer && variant === 'default' && (
            <OrderCustomerInfo customer={order.customer} compact />
          )}
            {order.scheduledAt &&
              <Badge 
              variant="outline"
              className="flex items-center gap-1 px-2 py-1 rounded-md border text-sm font-medium"
            >
                  Отложено до
                  <span className="text-sm">
                    {format(new Date(order.scheduledAt), 'HH:mm')}
                  </span>
              </Badge>
          }
          </div>)
          :
          ''
        }
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

      <OrderActions 
        order={order} 
        variant={variant}
        onStatusChange={onStatusChange}
        compact={variant === 'kitchen'}
      />
    </Card>
  )
}