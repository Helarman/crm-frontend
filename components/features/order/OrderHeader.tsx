'use client'

import { Clock, Utensils, MapPin, Truck, GlassWater, User, Tablet, Globe, Smartphone, ShoppingBag } from 'lucide-react'
import { format } from 'date-fns'
import { OrderResponse } from '@/lib/api/order.service'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useLanguageStore } from '@/lib/stores/language-store'
import { JSX } from 'react'

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

type OrderItem = {

  status: 'IN_PROGRESS' | 'COMPLETED';

  quantity: number;

};

function getOrderItemCounts(items: OrderItem[]) {

  const counts = {

    total: 0,

    inProgress: 0,

    completed: 0,

  };


  items.forEach(item => {

    counts.total += item.quantity;

    if (item.status === 'IN_PROGRESS') {

      counts.inProgress += item.quantity;

    } else if (item.status === 'COMPLETED') {

      counts.completed += item.quantity;

    }

  });


  return counts;

}

export function OrderHeader({ order, compact = false, variant }: { order: OrderResponse, compact?: boolean, variant?: 'default' | 'kitchen' | 'delivery' }) {
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

  const typeIcons ={
    DELIVERY: <Truck className={cn(
            "text-gray-900  dark:text-white",
            compact ? "h-4 w-4" : "w-7 h-7"
          )} />,
    DINE_IN: <Utensils className={cn(
            "text-gray-900 dark:text-white",
            compact ? "h-4 w-4" : "w-7 h-7"
          )} />,
          
    TAKEAWAY: <ShoppingBag className={cn(
            "text-gray-900  dark:text-white",
            compact ? "h-4 w-4" : "w-7 h-7"
          )} />,

    BANQUET: <GlassWater className={cn(
            "text-gray-900  dark:text-white",
            compact ? "h-4 w-4" : "w-7 h-7"
          )} />,
  }

  type SourceKeys = 'MOBILE' | 'SITE' | 'PANEL';

  const sourceIcons: Record<SourceKeys, JSX.Element | string> = {
    MOBILE: <Smartphone className={cn( 
    "text-gray-900",
    compact ? "h-4 w-4" : "w-7 h-7"
    )} />,
    SITE: <Globe className={cn( 
      "text-gray-900",
      compact ? "h-4 w-4" : "w-7 h-7"
    )} />,
    PANEL: ''
  }

  return (
    <div className={cn("p-3 pb-0", compact ? "space-y-1" : "space-y-2")}>
      <div className="flex justify-between items-start gap-2">
        <div className="flex items-center gap-2">
          <span className={cn(
            "font-semibold",
            compact ? "text-sm" : "text-lg"
          )}>
            {order.type == 'DINE_IN' ? `№${order.tableNumber}(${order.number})` : order.number}
          </span>
         
        </div>
        <span className={cn(
            "font-semibold",
            compact ? "text-sm" : "text-lg"
          )}>
              {`${getOrderItemCounts(order.items).total}/${getOrderItemCounts(order.items).inProgress}/${getOrderItemCounts(order.items).completed}`}
        </span>
        
       {order.numberOfPeople && <span className={cn(
            "font-semibold", "flex",
            compact ? "text-sm" : "text-2xl"
          )}>
              {order.numberOfPeople}  
               <User className={cn(
                    "text-gray-900 dark:text-white", "ml-1", 
                    compact ? "h-4 w-4" : "w-7 h-7")}
                />
        </span>}
        
        {sourceIcons[order.source as SourceKeys]}

        {typeIcons[order.type]}
        
      </div>
      <div className="flex justify-between items-start gap-2">
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
        <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className={compact ? "h-3 w-3" : "h-4 w-4"} />
            <span className={compact ? "text-xs" : "text-sm"}>
              {format(new Date(order.createdAt), 'HH:mm')}
            </span>
        </div>
      </div>

      {order.type === 'DELIVERY' && (
        <button 
        disabled={variant != 'delivery'}
          className='cursor-pointer'
          onClick={(e) => {
                e.stopPropagation();
                const address = encodeURIComponent(order.delivery?.address as string);
                window.open(`https://yandex.ru/maps/?text=${address}`, '_blank');
              }}
        >
          <Badge  variant="outline" className={cn("gap-1", compact ? "px-2 py-0.5 text-sm" : "text-sm")}>
            <MapPin className={compact ? "h-3 w-3" : "h-4 w-4"} />
            {order.delivery?.address}
          </Badge>
        </button>
      )}
    </div>
  )
}