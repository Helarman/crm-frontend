'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Check, X, CookingPot, Truck, CheckCircle, Loader2 } from 'lucide-react'
import { OrderResponse } from '@/lib/api/order.service'
import useSWRMutation from 'swr/mutation'
import { OrderService } from '@/lib/api/order.service'
import { PaymentService } from '@/lib/api/payment.service'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useLanguageStore } from '@/lib/stores/language-store'
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
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale/ru'
import { ka } from 'date-fns/locale/ka'
import { EnumPaymentMethod } from '@/lib/api/order.service'

type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED'
type PaymentMethod = 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'OTHER'

interface Payment {
  id: string
  orderId: string
  amount: number
  method: PaymentMethod
  status: PaymentStatus
  transactionId?: string
  createdAt: Date
  updatedAt: Date
}

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
  variant?: 'default' | 'kitchen' | 'delivery'
  onStatusChange?: (updatedOrder: OrderResponse) => void
  compact?: boolean
}) {
  const router = useRouter()
  const { language } = useLanguageStore()
  const [showCompleteDialog, setShowCompleteDialog] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  
  const [paymentState, setPaymentState] = useState<{
    loading: boolean
    updating: boolean
    data: Payment | null
    received: number
    change: number
  }>({
    loading: false,
    updating: false,
    data: null,
    received: 0,
    change: 0
  })

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
        window.location.reload()
        setShowCompleteDialog(false)
        setShowCancelDialog(false)
      },
      onError: (error) => {
        console.error('Status update failed:', error)
        toast.error(notificationTranslations.error[language])
      }
    }
    
  )

  const loadPayment = useCallback(async () => {
    if (!order.payment?.id) return

    setPaymentState(prev => ({ ...prev, loading: true }))
    try {
      const paymentData = await PaymentService.findOne(order.payment.id)
      setPaymentState(prev => ({
        ...prev,
        data: paymentData,
        received: paymentData?.amount || 0,
        loading: false
      }))
    } catch (error) {
      console.error('Failed to fetch payment:', error)
      toast.error(language === 'ka' ? 'გადახდის მონაცემების ჩატვირთვა ვერ მოხერხდა' : 'Не удалось загрузить данные платежа')
      setPaymentState(prev => ({ ...prev, loading: false }))
    }
  }, [order.payment?.id, language])

  useEffect(() => {
    if (showPaymentDialog) {
      loadPayment()
    } else {
      // Reset payment state when dialog closes
      setPaymentState({
        loading: false,
        updating: false,
        data: null,
        received: 0,
        change: 0
      })
    }
  }, [showPaymentDialog, loadPayment])

  useEffect(() => {
    if (paymentState.data) {
      const change = paymentState.received - paymentState.data.amount
      setPaymentState(prev => ({
        ...prev,
        change: change > 0 ? change : 0
      }))
    }
  }, [paymentState.received, paymentState.data])

  const handleComplete = async () => {
    if (order.payment && order.payment.status !== 'PAID') {
      setShowCompleteDialog(false);
      await new Promise(resolve => setTimeout(resolve, 100)); 
      setShowPaymentDialog(true); 
    } else {
      setShowCompleteDialog(true)
    }
  }

  const handleConfirmComplete = () => {
    updateStatus('COMPLETED')
  }

  const handleCancel = () => {
    updateStatus('CANCELLED')
    router.refresh()
  }

  const handlePaymentStatusUpdate = async (newStatus: PaymentStatus) => {
    if (!paymentState.data) return

    try {
       setPaymentState(prev => ({ ...prev, updating: true }))
      const updatedPayment = await PaymentService.update(
        paymentState.data.id, 
        { status: newStatus }
      )
      
      setPaymentState(prev => ({
        ...prev,
        data: updatedPayment,
        updating: false
      }))

      toast.success(language === 'ka' ? 'სტატუსი წარმატებით განახლდა' : 'Статус успешно обновлен')
      
      if (newStatus === 'PAID') {
        await updateStatus('COMPLETED')
        setShowPaymentDialog(false)
      }
    } catch (error) {
      console.error('Failed to update payment:', error)
      toast.error(language === 'ka' ? 'სტატუსის განახლება ვერ მოხერხდა' : 'Не удалось обновить статус')
      setPaymentState(prev => ({ ...prev, updating: false }))
    }
  }

  const t = (key: string) => {
    const translations: Record<string, { ru: string; ka: string }> = {
      PENDING: { ru: 'В обработке', ka: 'მუშავდება' },
      PAID: { ru: 'Оплачено', ka: 'დასრულებული' },
      FAILED: { ru: 'Ошибка', ka: 'შეცდომა' },
      REFUNDED: { ru: 'Возврат', ka: 'დაბრუნებული' },
      CASH: { ru: 'Наличные', ka: 'ნაღდი ფული' },
      CARD: { ru: 'Карта', ka: 'ბარათი' },
      BANK_TRANSFER: { ru: 'Банковский перевод', ka: 'ბანკის გადარიცხვა' },
      OTHER: { ru: 'Другое', ka: 'სხვა' },
      received: { ru: 'Получено', ka: 'მიღებული' },
      change: { ru: 'Сдача', ka: 'ხურდა' },
      confirm_paid: { ru: 'Подтвердить оплату', ka: 'გადახდის დადასტურება' },
      mark_failed: { ru: 'Отметить ошибку', ka: 'შეცდომის მონიშვნა' },
      payment_details: { ru: 'Детали платежа', ka: 'გადახდის დეტალები' },
      payment_not_found: { ru: 'Платеж не найден', ka: 'გადახდა ვერ მოიძებნა' },
      method: {ru: 'Способ оплаты' , ka: 'method'}
    }
    return translations[key]?.[language] || key
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID': return 'bg-green-500 hover:bg-green-600'
      case 'FAILED': return 'bg-red-500 hover:bg-red-600'
      case 'REFUNDED': return 'bg-purple-500 hover:bg-purple-600'
      default: return 'bg-yellow-500 hover:bg-yellow-600'
    }
  }

  const formatDate = (date: Date) => {
    return format(new Date(date), 'PPpp', {
      locale: language === 'ka' ? ka : ru
    })
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
        onClick={() => handleComplete()}
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
          return [] as const
        case 'PREPARING':
          return [] as const
        default:
          return [] as const
      }
    }

    if (variant === 'delivery') {
    switch (order.status) {
      case 'READY':
        return ['startDelivery'] as const
      case 'DELIVERING':
        return ['complete'] as const
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
      return order.type === 'DELIVERY' ? [] : ['complete'] as const
    case 'DELIVERING':
      return order.type === 'DELIVERY' ? [] : ['complete'] as const
      default:
        return [] as const
    }
  }

  const availableActions = getAvailableActions()
  
  const handleDialogClose = useCallback(() => {
    setShowPaymentDialog(false);
    // Принудительный сброс состояния
    setPaymentState({
      loading: false,
      updating: false,
      data: null,
      received: 0,
      change: 0
    });
  }, []);

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

    <Dialog 
          open={showPaymentDialog} 
          onOpenChange={(open) => {
            if (!open) {
              handleDialogClose();
            } else {
              setShowPaymentDialog(true);
            }
          }}
        >
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{t('payment_details')}</DialogTitle>
          </DialogHeader>
          
          {paymentState.loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : paymentState.data ? (
            <div>
              <div className="flex items-center justify-between mb-2">
                <Badge className={getStatusColor(paymentState.data.status)}>
                  {t(paymentState.data.status)}
                </Badge>
                <div className="text-sm text-muted-foreground">
                  {formatDate(paymentState.data.createdAt)}
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>{language === 'ka' ? 'თანხა' : 'Сумма'}</Label>
                  <Input 
                    value={paymentState.data.amount} 
                    readOnly 
                    className="text-lg font-semibold"
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t('method')}</Label>
                  <Input value={t(paymentState.data.method)} readOnly />
                </div>

                {paymentState.data.method === 'CASH' && paymentState.data.status === 'PENDING' && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>{t('received')}</Label>
                      <div className="grid grid-cols-3 gap-2">
                        {[100, 200, 500, 1000, 2000, 5000].map((amount) => (
                          <Button
                            key={amount}
                            variant="outline"
                            onClick={() => setPaymentState(prev => ({
                              ...prev,
                              received: prev.received + amount
                            }))}
                            className="h-12"
                          >
                            +{amount}
                          </Button>
                        ))}
                      </div>
                      <Input
                        type="number"
                        value={paymentState.received || ''}
                        onChange={(e) => setPaymentState(prev => ({
                          ...prev,
                          received: Number(e.target.value)
                        }))}
                        placeholder={t('received')}
                        className="text-center text-lg h-14"
                      />
                    </div>

                    {paymentState.received > 0 && (
                      <div className="space-y-2">
                        <Label>{t('change')}</Label>
                        <Input 
                          value={paymentState.change > 0 ? paymentState.change : 0} 
                          readOnly 
                          className={cn(
                            "text-center text-lg h-14",
                            paymentState.change > 0 ? 'text-green-600 font-bold' : ''
                          )}
                        />
                      </div>
                    )}

                    <div className="flex gap-2 pt-4">
                      <Button 
                        onClick={() => handlePaymentStatusUpdate('PAID')}
                        disabled={paymentState.updating || paymentState.received < paymentState.data.amount}
                        className="bg-green-600 hover:bg-green-700 flex-1 h-12"
                      >
                        {paymentState.updating ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          t('confirm_paid')
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                {paymentState.data.method !== 'CASH' && paymentState.data.status === 'PENDING' && (
                  <div className="space-y-2 pt-4">
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => handlePaymentStatusUpdate('PAID')}
                        disabled={paymentState.updating}
                        className="bg-green-600 hover:bg-green-700 flex-1 h-12"
                      >
                        {paymentState.updating ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          t('confirm_paid')
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-32 space-y-4">
              <p className="text-lg">{t('payment_not_found')}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

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
            <AlertDialogAction onClick={handleConfirmComplete}>
              {language === 'ru' ? 'Завершить' : 'დასრულება'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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