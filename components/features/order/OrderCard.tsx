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
  const totalAmount = order.items.reduce(
    (sum, item) => sum + (item.product.price * item.quantity) + 
      item.additives.reduce((addSum, additive) => addSum + additive.price, 0),
    0
  )

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
          
          {order.customer && variant === 'default' && (
            <OrderCustomerInfo customer={order.customer} compact />
          )}

          <div className="flex justify-between items-center border-t pt-2">
            <div className="font-medium text-sm">
              {language === 'ru' ? 'Итого:' : 'სულ:'}
            </div>
            <div className="font-bold">
              {totalAmount.toFixed(2)}{language === 'ru' ? '₽' : '₽'}
            </div>
          </div>

          {variant === 'default' && order.payment && (
            <OrderPaymentStatus payment={order.payment} compact />
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