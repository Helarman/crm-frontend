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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useState } from 'react'
import { SwipeButton } from '@/components/ui/swipe-button'

const notificationTranslations = {
  success: {
    ru: 'Статус обновлен',
    ka: 'სტატუსი განახლდა'
  },
  error: {
    ru: 'Ошибка обновления',
    ka: 'განახლების შეცდომა'
  },
  completeConfirm: {
    ru: 'Вы уверены что хотите завершить заказ?',
    ka: 'დარწმუნებული ხართ, რომ გსურთ შეკვეთის დასრულება?'
  },
  cancelConfirm: {
    ru: 'Вы уверены что хотите отменить заказ?',
    ka: 'დარწმუნებული ხართ, რომ გსურთ შეკვეთის გაუქმება?'
  }
}

const buttonVariants = {
  confirm: {
    variant: 'secondary' as const,
    className: 'bg-green-50 text-green-700 hover:bg-green-100'
  },
  startPreparing: {
    variant: 'secondary' as const,
    className: 'bg-orange-50 text-orange-700 hover:bg-orange-100'
  },
  markReady: {
    variant: 'secondary' as const,
    className: 'bg-blue-50 text-blue-700 hover:bg-blue-100'
  },
  startDelivery: {
    variant: 'secondary' as const,
    className: 'bg-purple-50 text-purple-700 hover:bg-purple-100'
  },
  complete: {
    variant: 'secondary' as const,
    className: 'bg-teal-50 text-teal-700 hover:bg-teal-100'
  },
  cancel: {
    variant: 'secondary' as const,
    className: 'bg-red-50 text-red-700 hover:bg-red-100'
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
  const [showCompleteDialog, setShowCompleteDialog] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)

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
        setShowCompleteDialog(false)
        setShowCancelDialog(false)
      },
      onError: (error) => {
        console.error('Status update failed:', error)
        toast.error(notificationTranslations.error[language])
      }
    }
  )

  const handleComplete = () => {
    updateStatus('COMPLETED')
  }

  const handleCancel = () => {
    updateStatus('CANCELLED')
  }

  const actionButtons = {
    confirm: (
      <Button
        size={compact ? "sm" : "default"}
        disabled={isMutating}
        onClick={() => updateStatus('CONFIRMED')}
        variant={buttonVariants.confirm.variant}
        className={cn(
          "transition-colors shadow-sm",
          compact ? "h-8 px-3 text-xs" : "gap-2",
          buttonVariants.confirm.className
        )}
      >
        <Check className={compact ? "h-3 w-3" : "h-4 w-4"} />
        {language === 'ru' ? 'Подтвердить' : 'დადასტურება'}
      </Button>
    ),
    startPreparing: (
      <Button
        size={compact ? "sm" : "default"}
        disabled={isMutating}
        onClick={() => updateStatus('PREPARING')}
        variant={buttonVariants.startPreparing.variant}
        className={cn(
          "transition-colors shadow-sm",
          compact ? "h-8 px-3 text-xs" : "gap-2",
          buttonVariants.startPreparing.className
        )}
      >
        <CookingPot className={compact ? "h-3 w-3" : "h-4 w-4"} />
        {language === 'ru' ? 'Готовить' : 'მომზადება'}
      </Button>
    ),
    markReady: (
      <Button
        size={compact ? "sm" : "default"}
        disabled={isMutating}
        onClick={() => updateStatus('READY')}
        variant={buttonVariants.markReady.variant}
        className={cn(
          "transition-colors shadow-sm",
          compact ? "h-8 px-3 text-xs" : "gap-2",
          buttonVariants.markReady.className
        )}
      >
        <Check className={compact ? "h-3 w-3" : "h-4 w-4"} />
        {language === 'ru' ? 'Готово' : 'მზადაა'}
      </Button>
    ),
    startDelivery: (
      <Button
        size={compact ? "sm" : "default"}
        disabled={isMutating}
        onClick={() => updateStatus('DELIVERING')}
        variant={buttonVariants.startDelivery.variant}
        className={cn(
          "transition-colors shadow-sm",
          compact ? "h-8 px-3 text-xs" : "gap-2",
          buttonVariants.startDelivery.className
        )}
      >
        <Truck className={compact ? "h-3 w-3" : "h-4 w-4"} />
        {language === 'ru' ? 'Доставить' : 'მიტანა'}
      </Button>
    ),
    complete: (
      <Button
        size={compact ? "sm" : "default"}
        disabled={isMutating}
        onClick={() => setShowCompleteDialog(true)}
        variant={buttonVariants.complete.variant}
        className={cn(
          "transition-colors shadow-sm",
          compact ? "h-8 px-3 text-xs" : "gap-2",
          buttonVariants.complete.className
        )}
      >
        <CheckCircle className={compact ? "h-3 w-3" : "h-4 w-4"} />
        {language === 'ru' ? 'Завершить' : 'დასრულება'}
      </Button>
    ),
    cancel: (
      <Button
        size={compact ? "sm" : "default"}
        disabled={isMutating}
        onClick={() => setShowCancelDialog(true)}
        variant={buttonVariants.cancel.variant}
        className={cn(
          "transition-colors shadow-sm",
          compact ? "h-8 px-3 text-xs" : "gap-2",
          buttonVariants.cancel.className
        )}
      >
        <X className={compact ? "h-3 w-3" : "h-4 w-4"} />
        {language === 'ru' ? 'Отменить' : 'გაუქმება'}
      </Button>
    )
  }

  const getAvailableActions = () => {
    if (variant === 'kitchen') {
      switch (order.status) {
        case 'CONFIRMED':
          return ['startPreparing'] as const
        case 'PREPARING':
          return ['markReady'] as const
        default:
          return [] as const
      }
    }

    switch (order.status) {
      case 'CREATED':
        return ['confirm', 'cancel'] as const
      case 'CONFIRMED':
        return ['cancel'] as const
      case 'PREPARING':
        return ['cancel'] as const
      case 'READY':
        return order.type === 'DELIVERY' ? ['startDelivery'] : ['complete'] as const
      case 'DELIVERING':
        return ['complete'] as const
      default:
        return [] as const
    }
  }

  const availableActions = getAvailableActions()

  return (
    <>
      <div className={cn(
        "flex flex-wrap gap-2",
        compact ? "p-1" : "p-2",
        "w-full",
        variant === 'kitchen' ? "justify-start" : compact ? "justify-center" : "justify-start"
      )}>
        {availableActions.map((action) => (
          <div key={action}>
            {actionButtons[action as keyof typeof actionButtons]}
          </div>
        ))}
      </div>
      {/* Complete Order Dialog */}
      <AlertDialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === 'ru' ? 'Подтверждение' : 'დადასტურება'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {notificationTranslations.completeConfirm[language]}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {language === 'ru' ? 'Отмена' : 'გაუქმება'}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleComplete}>
              {language === 'ru' ? 'Завершить' : 'დასრულება'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Order Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === 'ru' ? 'Подтверждение' : 'დადასტურება'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {notificationTranslations.cancelConfirm[language]}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {language === 'ru' ? 'Отмена' : 'გაუქმება'}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleCancel}>
              {language === 'ru' ? 'Отменить' : 'გაუქმება'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}