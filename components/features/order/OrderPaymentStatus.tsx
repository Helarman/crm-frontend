'use client'

import { CreditCard, Check, Clock, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { PaymentDto } from '@/lib/api/order.service'
import { cn } from '@/lib/utils'
import { useLanguageStore } from '@/lib/stores/language-store'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

const paymentStatusTranslations = {
  PENDING: {
    ru: 'Ожидает оплаты',
    ka: 'ელოდება გადახდას'
  },
  PAID: {
    ru: 'Оплачено',
    ka: 'გადახდილია'
  },
  FAILED: {
    ru: 'Ошибка оплаты',
    ka: 'გადახდის შეცდომა'
  }
}

const paymentMethodTranslations = {
  CARD: {
    ru: 'Картой',
    ka: 'ბარათით'
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

export function OrderPaymentStatus({ payment, compact = false, order }: {
  payment: PaymentDto
  compact?: boolean
  order: any
}) {
  const { language } = useLanguageStore()

  const paymentStatus = {
    PENDING: {
      icon: <Clock className={compact ? "h-3 w-3" : "h-4 w-4"} />,
      text: paymentStatusTranslations.PENDING[language],
      variant: 'secondary' as const,
    },
    PAID: {
      icon: <Check className={compact ? "h-3 w-3" : "h-4 w-4"} />,
      text: paymentStatusTranslations.PAID[language],
      variant: 'default' as const,
    },
    FAILED: {
      icon: <X className={compact ? "h-3 w-3" : "h-4 w-4"} />,
      text: paymentStatusTranslations.FAILED[language],
      variant: 'destructive' as const,
    },
  }[payment.status]

  return (
    <div className="space-y-1 flex justify-between">
      <div className='space-y-1'>
        <h4 className={cn("font-medium flex items-center", compact ? "text-xs gap-1" : "text-sm gap-2")}>
          <CreditCard className={compact ? "h-3 w-3" : "h-4 w-4"} />
          {language === 'ru' ? 'Оплата' : 'გადახდა'}
        </h4>
        
        <div className="flex items-center gap-2">
          <Badge variant={paymentStatus?.variant} className={cn("gap-1", compact ? "px-2 py-0.5 text-xs" : "text-sm")}>
            {paymentStatus?.icon}
            {paymentStatus?.text}
          </Badge>
          
          <div className={compact ? "text-xs" : "text-sm"}>
            {paymentMethodTranslations[payment.method][language]}
            {payment.amount && ` • ${payment.amount.toFixed(2)}${language === 'ru' ? '₽' : '₽'}`}
          </div>
        </div>
      </div>
      
    </div>
  )
}