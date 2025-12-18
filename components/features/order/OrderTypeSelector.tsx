'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Language } from '@/lib/stores/language-store'

const ORDER_TYPES = [
  {
    value: 'DINE_IN',
    titleRu: 'В зале',
    titleGe: 'დარბაზში',
  },
  {
    value: 'TAKEAWAY',
    titleRu: 'С собой',
    titleGe: 'თვითმიტანი',
  },
  {
    value: 'DELIVERY',
    titleRu: 'Доставка',
    titleGe: 'მიტანა',
  },
  {
    value: 'BANQUET',
    titleRu: 'Банкет',
    titleGe: 'ბანკეტი',
  }
]
export type OrderType = 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY' | 'BANQUET';

interface OrderTypeSelectorProps {
  value: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY' | 'BANQUET'
  onChange: (value: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY' | 'BANQUET') => void
  language: Language
  disabled?: boolean
}

export const OrderTypeSelector = ({
  value,
  onChange,
  language,
  disabled
}: OrderTypeSelectorProps) => {
  const t = (text: string | undefined, textGe: string | undefined) => {
    return language === 'ka' && textGe ? textGe : text || ''
  }

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="w-full" disabled={disabled}>
        <SelectValue placeholder={language === 'ka' ? 'აირჩიეთ ტიპი' : 'Выберите тип'} />
      </SelectTrigger>
      <SelectContent>
        {ORDER_TYPES.map(type => (
          <SelectItem key={type.value} value={type.value}>
            {t(type.titleRu, type.titleGe)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}