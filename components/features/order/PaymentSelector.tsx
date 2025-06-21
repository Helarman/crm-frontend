'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Language } from '@/lib/stores/language-store'

const PAYMENT_METHODS = [
  {
    value: 'CASH',
    titleRu: 'Наличные',
    titleGe: 'ნაღდი',
  },
  {
    value: 'CARD',
    titleRu: 'Карта',
    titleGe: 'ბარათი',
  },
  {
    value: 'CASH_TO_COURIER',
    titleRu: 'Наличные курьеру',
    titleGe: 'ნაღდი კურიერს',
  },
  {
    value: 'CARD_TO_COURIER',
    titleRu: 'Карта курьеру',
    titleGe: 'ბარათი კურიერს',
  }
]

interface PaymentSelectorProps {
  method: 'CASH' | 'CARD' | 'CASH_TO_COURIER' | 'CARD_TO_COURIER'
  onChange: (method: 'CASH' | 'CARD' | 'CASH_TO_COURIER' | 'CARD_TO_COURIER') => void
  orderType: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY' | 'BANQUET'
  language: Language
}

export const PaymentSelector = ({
  method,
  onChange,
  orderType,
  language
}: PaymentSelectorProps) => {
  const t = (text: string | undefined, textGe: string | undefined) => {
    return language === 'ka' && textGe ? textGe : text || ''
  }

  const availableMethods = PAYMENT_METHODS.filter(method => {
    if (orderType === 'DELIVERY') {
      return true
    }
    return method.value === 'CASH' || method.value === 'CARD'
  })

  return (
    <Select value={method} onValueChange={onChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={language === 'ka' ? 'აირჩიეთ გადახდა' : 'Выберите оплату'} />
      </SelectTrigger>
      <SelectContent>
        {availableMethods.map(method => (
          <SelectItem key={method.value} value={method.value}>
            {t(method.titleRu, method.titleGe)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}