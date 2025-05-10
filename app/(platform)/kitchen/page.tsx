'use client'

import { KitchenOrdersList } from '@/components/features/order/KitchenOrderList'
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
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">{t.title[language]}</h1>
        </div>
        <KitchenOrdersList />
      </div>
    </AccessCheck>
  )
}