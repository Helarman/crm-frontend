'use client'

import { OrdersList } from '@/components/features/order/OrdersList'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { useLanguageStore } from '@/lib/stores/language-store'
import { AccessCheck } from '@/components/AccessCheck'



export default function OrdersPage() {
  const router = useRouter()

  return (
    <AccessCheck allowedRoles={['WAITER', 'CASHIER', 'MANAGER', 'SUPERVISOR']}>
        <OrdersList />
    </AccessCheck>
  )
}