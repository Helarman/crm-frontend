'use client'

import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { AccessCheck } from '@/components/AccessCheck'
import PreOrdersList from '@/components/features/order/PreOrdersList'


export default function PreOrdersPage() {
  return (
    <AccessCheck allowedRoles={['WAITER', 'CASHIER', 'COOK', 'SHEF', 'MANAGER', 'SUPERVISOR']}>
        <PreOrdersList />
    </AccessCheck>
  )
}