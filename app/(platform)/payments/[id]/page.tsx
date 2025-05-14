'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { PaymentService } from '@/lib/api/payment.service'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Loader2, ArrowLeft } from 'lucide-react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale/ru'
import { ka } from 'date-fns/locale/ka'
import { useLanguageStore } from '@/lib/stores/language-store'

export interface Payment {
  id: string
  orderId: string
  amount: number
  method: 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'OTHER'
  status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED'
  transactionId?: string
  createdAt: Date
  updatedAt: Date
}

export default function PaymentPage() {
  const router = useRouter()
  const params = useParams()
  const { language } = useLanguageStore()
  const [payment, setPayment] = useState<Payment | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [receivedAmount, setReceivedAmount] = useState(0)
  const [changeAmount, setChangeAmount] = useState(0)

  // Получение информации о платеже
  useEffect(() => {
    const fetchPayment = async () => {
      try {
        const paymentData = await PaymentService.findOne(params.id as string)
        setPayment(paymentData)
        setLoading(false)
      } catch (error) {
        console.error('Failed to fetch payment:', error)
        toast.error(language === 'ka' ? 'გადახდის მონაცემების ჩატვირთვა ვერ მოხერხდა' : 'Не удалось загрузить данные платежа')
        setLoading(false)
      }
    }

    fetchPayment()
  }, [params.id, language])

  // Обновление статуса платежа
  const handleStatusUpdate = async (newStatus: 'PAID' | 'FAILED') => {
    if (!payment) return

    setUpdating(true)
    try {
      const updatedPayment = await PaymentService.update(payment.id, { status: newStatus })
      setPayment(updatedPayment)
      toast.success(language === 'ka' ? 'სტატუსი წარმატებით განახლდა' : 'Статус успешно обновлен')
    } catch (error) {
      console.error('Failed to update payment:', error)
      toast.error(language === 'ka' ? 'სტატუსის განახლება ვერ მოხერხდა' : 'Не удалось обновить статус')
    } finally {
      setUpdating(false)
    }
  }

  // Расчет сдачи
  const calculateChange = () => {
    if (!payment) return
    const change = receivedAmount - payment.amount
    setChangeAmount(change > 0 ? change : 0)
  }

  useEffect(() => {
    calculateChange()
  }, [receivedAmount, payment?.amount])

  // Форматирование даты
  const formatDate = (date: Date) => {
    return format(new Date(date), 'PPpp', {
      locale: language === 'ka' ? ka : ru
    })
  }

  // Получение цвета для статуса
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID': return 'bg-green-500 hover:bg-green-600'
      case 'FAILED': return 'bg-red-500 hover:bg-red-600'
      case 'REFUNDED': return 'bg-purple-500 hover:bg-purple-600'
      default: return 'bg-yellow-500 hover:bg-yellow-600'
    }
  }

  // Перевод статусов
 type TranslationKey = 
  | 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED'
  | 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'OTHER'
  | 'received' | 'change' | 'confirm_paid' | 'mark_failed';

const t = (key: TranslationKey) => {
    const translations = {
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
      mark_failed: { ru: 'Отметить ошибку', ka: 'შეცდომის მონიშვნა' }
    };
    return translations[key][language] || key;
};
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!payment) {
    return (
      <div className="flex flex-col items-center justify-center h-screen space-y-4">
        <p className="text-lg">{language === 'ka' ? 'გადახდა ვერ მოიძებნა' : 'Платеж не найден'}</p>
        <Button onClick={() => router.back()}>
          {language === 'ka' ? 'უკან დაბრუნება' : 'Назад'}
        </Button>
      </div>
    )
  }

  return (
    <div className="container py-8 space-y-6">
      <Button 
        variant="outline" 
        onClick={() => router.back()}
        className="flex items-center gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        {language === 'ka' ? 'უკან დაბრუნება' : 'Назад'}
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{language === 'ka' ? 'გადახდის დეტალები' : 'Детали платежа'}</span>
            <Badge className={getStatusColor(payment.status)}>
              {t(payment.status)}
            </Badge>
          </CardTitle>
        </CardHeader>

        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{language === 'ka' ? 'გადახდის ID' : 'ID платежа'}</Label>
              <Input value={payment.id} readOnly />
            </div>

            <div className="space-y-2">
              <Label>{language === 'ka' ? 'შეკვეთის ID' : 'ID заказа'}</Label>
              <Input value={payment.orderId} readOnly />
            </div>

            <div className="space-y-2">
              <Label>{language === 'ka' ? 'თანხა' : 'Сумма'}</Label>
              <Input value={payment.amount} readOnly />
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{language === 'ka' ? 'მეთოდი' : 'Метод'}</Label>
              <Input value={t(payment.method)} readOnly />
            </div>

            <div className="space-y-2">
              <Label>{language === 'ka' ? 'ტრანზაქციის ID' : 'ID транзакции'}</Label>
              <Input value={payment.transactionId || '-'} readOnly />
            </div>

            <div className="space-y-2">
              <Label>{language === 'ka' ? 'შექმნის თარიღი' : 'Дата создания'}</Label>
              <Input value={formatDate(payment.createdAt)} readOnly />
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col items-start gap-4">
          {payment.method === 'CASH' && payment.status === 'PENDING' && (
            <div className="w-full space-y-4">
              <div className="space-y-2">
                <Label>{t('received')}</Label>
                <Input 
                  type="number" 
                  value={receivedAmount || ''}
                  onChange={(e) => setReceivedAmount(Number(e.target.value))}
                  placeholder={language === 'ka' ? 'მიღებული თანხა' : 'Полученная сумма'}
                />
              </div>

              {receivedAmount > 0 && (
                <div className="space-y-2">
                  <Label>{t('change')}</Label>
                  <Input 
                    value={changeAmount} 
                    readOnly 
                    className={changeAmount > 0 ? 'text-green-600 font-bold' : ''}
                  />
                </div>
              )}

              <div className="flex gap-2">
                <Button 
                  onClick={() => handleStatusUpdate('PAID')}
                  disabled={updating || receivedAmount < payment.amount}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {updating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    t('confirm_paid')
                  )}
                </Button>

                <Button 
                  variant="destructive"
                  onClick={() => handleStatusUpdate('FAILED')}
                  disabled={updating}
                >
                  {t('mark_failed')}
                </Button>
              </div>
            </div>
          )}

          {payment.method !== 'CASH' && payment.status === 'PENDING' && (
            <div className="w-full space-y-2">
              <Label>{language === 'ka' ? 'სტატუსის განახლება' : 'Обновить статус'}</Label>
              <div className="flex gap-2">
                <Button 
                  onClick={() => handleStatusUpdate('PAID')}
                  disabled={updating}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {updating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    t('confirm_paid')
                  )}
                </Button>
              </div>
            </div>
          )}

          {payment.updatedAt && (
            <p className="text-sm text-muted-foreground">
              {language === 'ka' ? 'ბოლო განახლება:' : 'Последнее обновление:'} {formatDate(payment.updatedAt)}
            </p>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}