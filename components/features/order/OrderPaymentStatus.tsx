'use client'

import { CreditCard } from 'lucide-react'
import { useLanguageStore } from '@/lib/stores/language-store'
import { cn } from '@/lib/utils'
import { PaymentDto } from '@/lib/api/order.service'
import { format } from 'date-fns'
import { ru, ka } from 'date-fns/locale'

const paymentMethodTranslations = {
  CARD: {
    ru: 'Карта',
    ka: 'ბარათი'
  },
  CASH: {
    ru: 'Наличные',
    ka: 'ნაღდი'
  },
  ONLINE: {
    ru: 'Онлайн',
    ka: 'ონლაინ'
  }
}

export function OrderPaymentStatus({ payment, order }: {
  payment: PaymentDto
  order: any
}) {
  const { language } = useLanguageStore()

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return format(date, 'd MMMM yyyy, HH:mm', {
      locale: language === 'ru' ? ru : ka
    })
  }

  return (
    <div className="flex items-center gap-2 text-md justify-between mt-auto pt-2">
      <p className="font-medium flex items-center gap-2 text-muted-foreground">
        {formatDate(order.createdAt)}
      </p>
      <p className="ml-2 font-medium">
        {payment.amount.toFixed(2)}{language === 'ru' ? '₽' : '₽'}
      </p>
    </div>
  )
}