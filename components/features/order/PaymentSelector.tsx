'use client'

import { Button } from '@/components/ui/button'
import { useLanguageStore } from '@/lib/stores/language-store'

// Типы
type PaymentMethod = 'CASH' | 'CARD'
type OrderPayment = {
  method: PaymentMethod
  status: 'PAID' | 'PENDING'
}

interface PaymentSelectorProps {
  method: PaymentMethod
  onChange: (method: PaymentMethod) => void
  language?: 'ru' | 'ka'
}

export function PaymentSelector({
  method,
  onChange,
}: PaymentSelectorProps) {
  const { language } = useLanguageStore()
  
  const paymentMethods = [
    { id: 'CASH' as const, label: language === 'ru' ? 'Наличные' : 'ნაღდი' },
    { id: 'CARD' as const, label: language === 'ru' ? 'Карта' : 'ბარათი' },
  ]

  return (

      <div className="flex flex-wrap gap-2">
        {paymentMethods.map(payment => (
          <Button
            key={payment.id}
            variant={method === payment.id ? 'default' : 'outline'}
            onClick={() => onChange(payment.id)}
          >
            {payment.label}
          </Button>
        ))}
      </div>
  )
}