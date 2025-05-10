'use client'

import { OrdersList } from '@/components/features/order/OrdersList'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { useLanguageStore } from '@/lib/stores/language-store'
import { AccessCheck } from '@/components/AccessCheck'

const translations = {
  title: {
    ru: 'Заказы ресторана',
    ka: 'რესტორნის შეკვეთები'
  },
  newOrder: {
    ru: 'Новый заказ',
    ka: 'ახალი შეკვეთა'
  }
}

export default function OrdersPage() {
  const router = useRouter()
  const { language } = useLanguageStore()
  const t = translations

  return (
    <AccessCheck allowedRoles={['WAITER', 'CASHIER', 'MANAGER', 'SUPERVISOR']}>
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">{t.title[language]}</h1>
          <Button onClick={() => router.push('/orders/new')}>
            {t.newOrder[language]}
          </Button>
        </div>
        <OrdersList />
      </div>
    </AccessCheck>
  )
}