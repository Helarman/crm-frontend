'use client'

import { Clock, MapPin, User, ShoppingBag, Smartphone, Globe } from 'lucide-react'
import { format } from 'date-fns'
import { EnumOrderType, OrderResponse } from '@/lib/api/order.service'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useLanguageStore } from '@/lib/stores/language-store'
import { JSX } from 'react'
import { OrderItem } from '@/lib/types/order'
import Image from 'next/image'

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

function getOrderItemCounts(items: OrderItem[]) {
  const counts = {
    total: 0,
    inProgress: 0,
    completed: 0,
  };

  items?.forEach(item => {
    counts.total += item.quantity;
    if (item.status === 'IN_PROGRESS') {
      counts.inProgress += item.quantity;
    } else if (item.status === 'COMPLETED') {
      counts.completed += item.quantity;
    }
  });

  return counts;
}

export function OrderHeader({ order, compact = false, variant = 'default' }: { order: OrderResponse, compact?: boolean, variant?: 'default' | 'kitchen' | 'delivery' }) {
  const { language } = useLanguageStore()
  
  // Для kitchen и delivery используем такие же размеры как в default
  const isKitchenOrDelivery = variant === 'kitchen' || variant === 'delivery'
  const effectiveCompact = compact && !isKitchenOrDelivery
  
  const statusColors = {
    CREATED: 'border-amber-500 bg-amber-50 text-amber-800',
    CONFIRMED: 'border-blue-500 bg-blue-50 text-blue-800',
    PREPARING: 'border-purple-500 bg-purple-50 text-purple-800',
    READY: 'border-green-500 bg-green-50 text-green-800',
    DELIVERING: 'border-cyan-500 bg-cyan-50 text-cyan-800',
    COMPLETED: 'border-gray-500 bg-gray-100 text-gray-800',
    CANCELLED: 'border-red-500 bg-red-50 text-red-800'
  }

  const typeIcons = {
    DELIVERY: (
      <div className="flex items-center justify-center w-16 h-16">
        <Image 
          src="/icons/delivery.svg" 
          alt="Delivery" 
          width={50} 
          height={50} 
          className="text-gray-900 dark:text-white"
        />
      </div>
    ),
    DINE_IN: (
      <div className="flex items-center justify-center w-16 h-16">
        <Image 
          src="/icons/hall.svg" 
          alt="Dine In" 
          width={50} 
          height={50} 
          className="text-gray-900 dark:text-white"
        />
      </div>
    ),
    TAKEAWAY: (
      <div className="flex items-center justify-center w-16 h-16">
        <Image 
          src="/icons/takeaway.svg" 
          alt="Takeaway" 
          width={50} 
          height={50} 
          className="text-gray-900 dark:text-white"
        />
      </div>
    ),
    BANQUET: (
      <div className="flex items-center justify-center w-16 h-16">
        <Image 
          src="/icons/banquet.svg" 
          alt="Banquet" 
          width={50} 
          height={50} 
          className="text-gray-900 dark:text-white"
        />
      </div>
    ),
  }

  type SourceKeys = 'MOBILE' | 'SITE' | 'PANEL';

  const sourceIcons: Record<SourceKeys, JSX.Element | string> = {
    MOBILE: (
      <div className="flex items-center justify-center w-8 h-8">
        <Smartphone className="w-6 h-16 text-gray-900" />
      </div>
    ),
    SITE: (
      <div className="flex items-center justify-center w-8 h-8">
        <Globe className="w-6 h-16 text-gray-900" />
      </div>
    ),
    PANEL: ''
  }

  // Безопасное получение номера заказа
  const getOrderNumberDisplay = () => {
    if (!order?.number) {
      return (
        <div className="flex items-end">
          <span className="text-3xl opacity-70">—</span>
        </div>
      );
    }

    const numberString = order.number.toString();
    
    if (order.type === 'DINE_IN' || order.type === EnumOrderType.BANQUET) {
      return `№${order.tableNumber || '—'}`;
    } else {
      return (
        <div className='flex items-end'>
          <span className='opacity-50'>{numberString.slice(0, -2)}</span>
          <span className="text-3xl">{numberString.slice(-2)}</span>
        </div>
      );
    }
  };

  // Безопасное получение количества элементов
  const itemCounts = getOrderItemCounts(order?.items || []);

  return (
    <div className={cn("p-3", effectiveCompact ? "space-y-1 pb-1" : "space-y-2")}>
      <div className="flex justify-between items-center gap-2">
        <div className="flex items-center gap-2">
          <span className={cn(
            "font-semibold",
            (order?.type === 'DINE_IN' || order?.type === EnumOrderType.BANQUET) 
              ? "text-3xl" 
              : "text-lg"
          )}>
            {getOrderNumberDisplay()}
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          <span className={cn(
            "font-semibold",
            effectiveCompact ? "text-sm" : "text-base"
          )}>
            {`${itemCounts.total}/${itemCounts.inProgress}/${itemCounts.completed}`}
          </span>
          
          {order?.numberOfPeople && (
            <div className="flex items-center">
              <span className={cn(
                "font-semibold",
                effectiveCompact ? "text-sm" : "text-2xl"
              )}>
                {order.numberOfPeople}
              </span>
              <User className={cn(
                "text-gray-900 dark:text-white ml-1", 
                "w-6 h-16"
              )}/>
            </div>
          )}
          
          {order?.source && sourceIcons[order.source as SourceKeys]}
        </div>
        
        {order?.type && typeIcons[order.type]}
      </div>
      
      <div className="flex justify-between items-center gap-2">
        {order?.status && (
          <Badge 
            className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-md border",
              statusColors[order.status],
              effectiveCompact ? "text-xs" : "text-sm",
              "font-medium"
            )}
          >
            {statusTranslations[order.status]?.[language] || order.status}
          </Badge>
        )}
        
        {order?.createdAt && (
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className={effectiveCompact ? "h-3 w-3" : "h-4 w-4"} />
            <span className={effectiveCompact ? "text-xs" : "text-sm"}>
              {format(new Date(order.createdAt), 'HH:mm')}
            </span>
          </div>
        )}
      </div>

      {order?.type === 'DELIVERY' && order?.delivery?.address && (
        <button 
          disabled={variant !== 'delivery'}
          className='cursor-pointer w-full'
          onClick={(e) => {
            e.stopPropagation();
            const address = encodeURIComponent(order.delivery!.address);
            window.open(`https://yandex.ru/maps/?text=${address}`, '_blank');
          }}
        >
          <Badge variant="outline" className={cn("gap-1 w-full justify-start", effectiveCompact ? "px-2 py-0.5 text-sm" : "text-sm")}>
            <MapPin className={effectiveCompact ? "h-3 w-3" : "h-4 w-4"} />
            <span className="truncate">{order.delivery.address}</span>
          </Badge>
        </button>
      )}
    </div>
  )
}