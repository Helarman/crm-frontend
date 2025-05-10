'use client'

import { Button } from '@/components/ui/button'
import { Check, X, CookingPot, Truck, CheckCircle } from 'lucide-react'
import { OrderResponse } from '@/lib/api/order.service'
import useSWRMutation from 'swr/mutation'
import { OrderService } from '@/lib/api/order.service'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useLanguageStore } from '@/lib/stores/language-store'
import { useRouter } from 'next/navigation'


const notificationTranslations = {
  success: {
    ru: 'Статус обновлен',
    ka: 'სტატუსი განახლდა'
  },
  error: {
    ru: 'Ошибка обновления',
    ka: 'განახლების შეცდომა'
  }
}

export function OrderActions({
  order,
  variant = 'default',
  onStatusChange,
  compact = false
}: {
  order: OrderResponse
  variant?: 'default' | 'kitchen'
  onStatusChange?: (updatedOrder: OrderResponse) => void
  compact?: boolean
}) {
  const router = useRouter()
  const { language } = useLanguageStore()

  const { trigger: updateStatus, isMutating } = useSWRMutation(
    ['update-order-status', order.id],
    async (_, { arg }: { arg: string }) => {
      const response = await OrderService.updateStatus(order.id, { status: arg })
      return response
    },
    {
      onSuccess: (updatedOrder) => {
        toast.success(notificationTranslations.success[language])
        onStatusChange?.(updatedOrder)
        router.refresh()
      },
      onError: (error) => {
        console.error('Status update failed:', error)
        toast.error(notificationTranslations.error[language])
      }
    }
  )

  const actionButtons = {
    confirm: (
      <Button
        size={"sm"}
        variant="default"
        disabled={isMutating}
        onClick={() => updateStatus('CONFIRMED')}
        className={compact ? "h-6 px-2 text-xs" : "gap-1"}
      >
        <Check className={compact ? "h-3 w-3" : "h-4 w-4"} />
        {language === 'ru' ? 'Подтвердить' : 'დადასტურება'}
      </Button>
    ),
    startPreparing: (
      <Button
        size={"sm"}
        variant="secondary"
        disabled={isMutating}
        onClick={() => updateStatus('PREPARING')}
        className={compact ? "h-6 px-2 text-xs" : "gap-1"}
      >
        <CookingPot className={compact ? "h-3 w-3" : "h-4 w-4"} />
        {language === 'ru' ? 'Начать готовить' : 'მომზადების დაწყება'}
      </Button>
    ),
    markReady: (
      <Button
        size={"sm"}
        variant="default" 
        disabled={isMutating}
        onClick={() => updateStatus('READY')}
        className={compact ? "h-6 px-2 text-xs" : "gap-1"}
      >
        <Check className={compact ? "h-3 w-3" : "h-4 w-4"} />
        {language === 'ru' ? 'Готово' : 'მზადაა'}
      </Button>
    ),
    startDelivery: (
      <Button
        size={"sm"}
        variant="outline"
        disabled={isMutating}
        onClick={() => updateStatus('DELIVERING')}
        className={compact ? "h-6 px-2 text-xs" : "gap-1"}
      >
        <Truck className={compact ? "h-3 w-3" : "h-4 w-4"} />
        {language === 'ru' ? 'Начать доставку' : 'მიტანის დაწყება'}
      </Button>
    ),
    complete: (
      <Button
        size={"sm"}
        variant="default"
        disabled={isMutating}
        onClick={() => updateStatus('COMPLETED')}
        className={compact ? "h-6 px-2 text-xs" : "gap-1"}
      >
        <CheckCircle className={compact ? "h-3 w-3" : "h-4 w-4"} />
        {language === 'ru' ? 'Завершить' : 'დასრულება'}
      </Button>
    ),
    cancel: (
      <Button
        size={"sm"}
        variant="destructive"
        disabled={isMutating}
        onClick={() => updateStatus('CANCELLED')}
        className={compact ? "h-6 px-2 text-xs" : "gap-1"}
      >
        <X className={compact ? "h-3 w-3" : "h-4 w-4"} />
        {language === 'ru' ? 'Отменить' : 'გაუქმება'}
      </Button>
    )
  }

  const getAvailableActions = () => {
    switch (order.status) {
      case 'CREATED':
        return ['confirm', 'cancel'] as const
      case 'CONFIRMED':
        return variant === 'kitchen' ? ['startPreparing', 'cancel'] : ['cancel'] as const
      case 'PREPARING':
        return variant === 'kitchen' ? ['markReady', 'cancel'] : ['cancel'] as const
      case 'READY':
        return variant === 'kitchen' ? [] : ['startDelivery'] as const
      case 'DELIVERING':
        return ['complete'] as const
      default:
        return [] as const
    }
  }
  const availableActions = getAvailableActions()

  return (
    <div className={cn("pt-0 flex flex-wrap gap-1", compact ? "p-2" : "p-3")}>
      {availableActions.map((action) => (
        <div key={action}>
          {actionButtons[action as keyof typeof actionButtons]}
        </div>
      ))}
    </div>
  )
}