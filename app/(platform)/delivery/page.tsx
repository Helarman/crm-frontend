'use client'

import { useLanguageStore } from '@/lib/stores/language-store'
import { AccessCheck } from '@/components/AccessCheck'
import { DeliveryOrdersList } from '@/components/features/order/DeliveryOrderList'

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
    <AccessCheck allowedRoles={['COURIER', 'MANAGER', 'SUPERVISOR']}>
        <DeliveryOrdersList />
    </AccessCheck>
  )
}