'use client'

import { Button } from '@/components/ui/button'
import { useLanguageStore } from '@/lib/stores/language-store'

// Типы
type PaymentMethod = 'CASH' | 'CARD' | 'ONLINE'
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
    { id: 'ONLINE' as const, label: language === 'ru' ? 'Онлайн' : 'ონლაინ' },
  ]

  return (
    <div className="p-4 border rounded-lg space-y-2">
      <h2 className="text-lg font-semibold">
        {language === 'ru' ? 'Способ оплаты' : 'გადახდის მეთოდი'}
      </h2>
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
    </div>
  )
}