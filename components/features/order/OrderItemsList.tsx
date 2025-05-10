'use client'

import { ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { OrderItemDto } from '@/lib/api/order.service'
import { cn } from '@/lib/utils'
import { useLanguageStore } from '@/lib/stores/language-store'

const statusTranslations = {
  CREATED: {
    ru: 'Новая',
    ka: 'ახალი'
  },
  PREPARING: {
    ru: 'Готовится',
    ka: 'მზადდება'
  },
  READY: {
    ru: 'Готово',
    ka: 'მზადაა'
  }
}

export function OrderItemsList({ items, variant = 'default', compact = false }: {
  items: OrderItemDto[]
  variant?: 'default' | 'kitchen'
  compact?: boolean
}) {
  const { language } = useLanguageStore()

  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      <h4 className={cn("font-medium flex items-center", compact ? "text-xs gap-1" : "text-sm gap-2")}>
        <ChevronRight className={compact ? "h-3 w-3" : "h-4 w-4"} />
        {language === 'ru' ? 'Позиции' : 'პოზიციები'} ({items.length})
      </h4>
      
      <ul className={compact ? "space-y-1.5 text-xs" : "space-y-2 text-sm"}>
        {items.map((item) => (
          <li key={item.id}>
            <div className="flex justify-between">
              <span className="truncate max-w-[180px]">
                <span className="font-medium">{item.quantity}×</span> {item.product.title}
              </span>
              <span>{(item.product.price * item.quantity).toFixed(2)}{language === 'ru' ? '₽' : '₽'}</span>
            </div>
            
            {variant === 'kitchen' && (
              <div className="flex gap-1 mt-1">
                <Button 
                  variant={item.status === 'CREATED' ? 'default' : 'outline'} 
                  size={"sm"}
                  className="h-6 text-xs"
                >
                  {statusTranslations.CREATED[language]}
                </Button>
                <Button 
                  variant={item.status === 'PREPARING' ? 'default' : 'outline'} 
                  size={"sm"}
                  className="h-6 text-xs"
                >
                  {statusTranslations.PREPARING[language]}
                </Button>
                <Button 
                  variant={item.status === 'READY' ? 'default' : 'outline'} 
                  size={"sm"}
                  className="h-6 text-xs"
                >
                  {statusTranslations.READY[language]}
                </Button>
              </div>
            )}

            {item.additives.length > 0 && (
              <ul className={cn("text-muted-foreground", compact ? "pl-2 text-[11px]" : "pl-3 text-xs")}>
                {item.additives.map(additive => (
                  <li key={additive.id} className="truncate">
                    + {additive.title} ({additive.price.toFixed(2)}{language === 'ru' ? '₽' : '₽'})
                  </li>
                ))}
              </ul>
            )}

            {item.comment && (
              <div className={cn(
                "text-muted-foreground italic",
                compact ? "pl-2 text-[11px]" : "pl-3 text-xs"
              )}>
                {language === 'ru' ? 'Комментарий:' : 'კომენტარი:'} "{item.comment}"
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}