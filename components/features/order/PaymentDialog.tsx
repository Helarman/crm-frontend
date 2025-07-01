'use client'

import { useState, useEffect, useCallback } from 'react'
import { PaymentDto as Payment, EnumPaymentMethod as PaymentMethod } from '@/lib/api/order.service'
import { PaymentService } from '@/lib/api/payment.service'
import { toast } from 'sonner'
import { useLanguageStore } from '@/lib/stores/language-store'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale/ru'
import { ka } from 'date-fns/locale/ka'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';

interface PaymentState {
  loading: boolean
  updating: boolean
  updatingMethod: boolean
  data: Payment | null
  received: number
  change: number
  newMethod: PaymentMethod | null
}

interface PaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  paymentId: string
  orderId: string
  onPaymentComplete: () => void
}

export function PaymentDialog({
  open,
  onOpenChange,
  paymentId,
  orderId,
  onPaymentComplete
}: PaymentDialogProps) {
  const { language } = useLanguageStore()
  const [paymentState, setPaymentState] = useState<PaymentState>({
    loading: false,
    updating: false,
    updatingMethod: false,
    data: null,
    received: 0,
    change: 0,
    newMethod: null
  })

  const loadPayment = useCallback(async () => {
    if (!paymentId) return

    setPaymentState(prev => ({ ...prev, loading: true }))
    try {
      const paymentData = await PaymentService.findOne(paymentId)
      setPaymentState(prev => ({
        ...prev,
        data: paymentData,
        newMethod: paymentData.method,
        received: 0,
        loading: false,
        updating: false,
        updatingMethod: false
      }))
    } catch (error) {
      console.error('Failed to fetch payment:', error)
      toast.error(language === 'ka' ? 'გადახდის მონაცემების ჩატვირთვა ვერ მოხერხდა' : 'Не удалось загрузить данные платежа')
      setPaymentState(prev => ({ ...prev, loading: false }))
    }
  }, [paymentId, language])

  useEffect(() => {
    if (open) {
      loadPayment()
    } else {
      // Reset payment state when dialog closes
      setPaymentState({
        loading: false,
        updating: false,
        updatingMethod: false,
        data: null,
        received: 0,
        change: 0,
        newMethod: null
      })
    }
  }, [open, loadPayment])

  useEffect(() => {
    if (paymentState.data) {
      const change = paymentState.received - paymentState.data.amount
      setPaymentState(prev => ({
        ...prev,
        change: change > 0 ? change : 0
      }))
    }
  }, [paymentState.received, paymentState.data])

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
        onPaymentComplete()
        onOpenChange(false)
      }
    } catch (error) {
      console.error('Failed to update payment:', error)
      toast.error(language === 'ka' ? 'სტატუსის განახლება ვერ მოხერხდა' : 'Не удалось обновить статус')
      setPaymentState(prev => ({ ...prev, updating: false }))
    }
  }

  const handlePaymentMethodUpdate = async () => {
  if (!paymentState.data || !paymentState.newMethod || paymentState.newMethod === paymentState.data.method) return

  try {
    setPaymentState(prev => ({ ...prev, updatingMethod: true }))
    const updatedPayment = await PaymentService.updateMethod(
      paymentState.data.id, 
      paymentState.newMethod
    )
    
    setPaymentState(prev => ({
      ...prev,
      data: updatedPayment,
      newMethod: updatedPayment.method, // Sync the newMethod with the updated value
      updatingMethod: false
    }))

    toast.success(language === 'ka' ? 'გადახდის მეთოდი წარმატებით განახლდა' : 'Метод оплаты успешно обновлен')
  } catch (error) {
    console.error('Failed to update payment method:', error)
    toast.error(language === 'ka' ? 'გადახდის მეთოდის განახლება ვერ მოხერხდა' : 'Не удалось обновить метод оплаты')
    setPaymentState(prev => ({ 
      ...prev, 
      updatingMethod: false,
      newMethod: prev.data?.method || null // Reset to original method on error
    }))
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
      method: { ru: 'Способ оплаты', ka: 'ოპლიკაციის მეთოდი' },
      update_method: { ru: 'Обновить метод', ka: 'მეთოდის განახლება' },
      select_method: { ru: 'Выберите метод оплаты', ka: 'აირჩიეთ გადახდის მეთოდი' }
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
                <div className="flex gap-2">
                  <Select
                    value={paymentState.newMethod || paymentState.data.method}
                    onValueChange={(value: PaymentMethod) => 
                      setPaymentState(prev => ({ ...prev, newMethod: value }))
                    }
                    disabled={paymentState.updatingMethod}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder={t('select_method')} />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(PaymentMethod).map((method) => (
                        <SelectItem key={method} value={method}>
                          {t(method)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={handlePaymentMethodUpdate}
                    disabled={
                      paymentState.updatingMethod || 
                      !paymentState.newMethod || 
                      paymentState.newMethod === paymentState.data.method
                    }
                    className="w-32"
                  >
                    {paymentState.updatingMethod ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      t('update_method')
                    )}
                  </Button>
                </div>
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
  )
}