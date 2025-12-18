'use client'

import KitchenOrdersList  from '@/components/features/order/KitchenOrderList'
import { useLanguageStore } from '@/lib/stores/language-store'
import { AccessCheck } from '@/components/AccessCheck'

const translations = {
  title: {
    ru: 'Кухня ресторана',
    ka: 'რესტორნის შეკვეთები'
  },
}

export default function KitchenPage() {
  const { language } = useLanguageStore()
  const t = translations

  return (
    <AccessCheck allowedRoles={['COOK', 'CHEF', 'MANAGER', 'SUPERVISOR']}>
        <KitchenOrdersList />
    </AccessCheck>
  )
}