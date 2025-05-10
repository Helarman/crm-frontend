'use client'

import { Clock, Utensils, MapPin } from 'lucide-react'
import { format } from 'date-fns'
import { OrderResponse } from '@/lib/api/order.service'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useLanguageStore } from '@/lib/stores/language-store'

const statusTranslations = {
  CREATED: {
    ru: 'Создан',
    ka: 'შექმნილი'
  },
  CONFIRMED: {
    ru: 'Подтвержден',
    ka: 'დადასტურებული'
  },
  PREPARING: {
    ru: 'Готовится',
    ka: 'მზადდება'
  },
  READY: {
    ru: 'Готов',
    ka: 'მზადაა'
  },
  DELIVERING: {
    ru: 'Доставляется',
    ka: 'იტანება'
  },
  COMPLETED: {
    ru: 'Завершен',
    ka: 'დასრულებული'
  },
  CANCELLED: {
    ru: 'Отменен',
    ka: 'გაუქმებული'
  }
}

const deliveryTypeTranslations = {
  DELIVERY: {
    ru: 'Доставка',
    ka: 'მიტანა'
  },
  PICKUP: {
    ru: 'Самовывоз',
    ka: 'თვითშეკვეთა'
  }
}

export function OrderHeader({ order, compact = false }: { order: OrderResponse, compact?: boolean }) {
  const { language } = useLanguageStore()
  const statusColors = {
    CREATED: 'border-amber-500 bg-amber-50 text-amber-800',
    CONFIRMED: 'border-blue-500 bg-blue-50 text-blue-800',
    PREPARING: 'border-purple-500 bg-purple-50 text-purple-800',
    READY: 'border-green-500 bg-green-50 text-green-800',
    DELIVERING: 'border-cyan-500 bg-cyan-50 text-cyan-800',
    COMPLETED: 'border-gray-500 bg-gray-100 text-gray-800',
    CANCELLED: 'border-red-500 bg-red-50 text-red-800'
  }

  return (
    <div className={cn("p-3 pb-0", compact ? "space-y-1" : "space-y-2")}>
      <div className="flex justify-between items-start gap-2">
        <div className="flex items-center gap-2">
          <Utensils className={cn(
            "text-primary",
            compact ? "h-4 w-4" : "h-5 w-5"
          )} />
          <span className={cn(
            "font-semibold",
            compact ? "text-sm" : "text-lg"
          )}>
            {language === 'ru' ? 'Заказ' : 'შეკვეთა'} {order.number}
          </span>
        </div>
        
        <div className="flex items-center gap-1 text-muted-foreground">
          <Clock className={compact ? "h-3 w-3" : "h-4 w-4"} />
          <span className={compact ? "text-xs" : "text-sm"}>
            {format(new Date(order.createdAt), 'HH:mm')}
          </span>
        </div>
      </div>

      <Badge 
        className={cn(
          "flex items-center gap-1 px-2 py-1 rounded-md border",
          statusColors[order.status],
          compact ? "text-xs" : "text-sm",
          "font-medium"
        )}
      >
        {statusTranslations[order.status][language]}
      </Badge>

      {order.type === 'DELIVERY' && (
        <Badge variant="outline" className={cn("gap-1", compact ? "px-2 py-0.5 text-xs" : "text-sm")}>
          <MapPin className={compact ? "h-3 w-3" : "h-4 w-4"} />
          {deliveryTypeTranslations[order.type][language]}
        </Badge>
      )}
    </div>
  )
}