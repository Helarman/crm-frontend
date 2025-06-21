'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { OrderService } from '@/lib/api/order.service'
import { ShiftService } from '@/lib/api/shift.service'
import { CustomerService } from '@/lib/api/customer.service'
import { DeliveryZoneService } from '@/lib/api/delivery-zone.service'
import { useAuth } from "@/lib/hooks/useAuth"
import { Language, useLanguageStore } from '@/lib/stores/language-store'
import { AccessCheck } from '@/components/AccessCheck'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { OrderInfoStep } from '@/components/features/order/OrderInfoStep'
import { OrderState } from '@/lib/types/order'
import { Restaurant } from '@/lib/types/restaurant'

export default function NewOrderPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { language } = useLanguageStore()
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null)
  const [order, setOrder] = useState<OrderState>({
    restaurantId: '',
    items: [],
    payment: { method: 'CASH', status: 'PENDING' },
    type: 'DINE_IN',
    source: 'PANEL',
    comment: '',
    numberOfPeople: 1,
    tableNumber: 0,
    deliveryAddress: '',
    deliveryTime: '',
    deliveryNotes: '',
    customerId: null,
    customerPhone: '',
    deliveryZone: null,
    surcharges: [],
    discounts: []
  })
  const [loading, setLoading] = useState(false)
  const [activeShiftId, setActiveShiftId] = useState('')

  useEffect(() => {
    if (!user) return

    if (!user.restaurant || user.restaurant.length === 0) {
      toast.error(language === 'ka' ? 'რესტორანი არ მოიძებნა' : 'Ресторан не найден')
      return
    }

    const firstRestaurant = user.restaurant[0]
    setSelectedRestaurant(firstRestaurant)
    setOrder(prev => ({ ...prev, restaurantId: firstRestaurant.id }))
    
    const checkActiveShift = async () => {
      try {
        const activeShift = await ShiftService.getActiveShiftsByRestaurant(firstRestaurant.id)
        if (!activeShift) {
          const newShift = await ShiftService.createShift({
            restaurantId: firstRestaurant.id,
            status: 'STARTED',
            startTime: new Date(),
          })
          setActiveShiftId(newShift.id)
        } else {
          setActiveShiftId(activeShift.id)
        }
      } catch (error) {
        console.error('Shift check error:', error)
      }
    }
    
    checkActiveShift()
  }, [user, language])

  const handleCreateOrder = async () => {
    if (!activeShiftId) {
      toast.error(language === 'ka' ? 'არ არის აქტიური ცვლა' : 'Нет активной смены')
      return
    }

    setLoading(true)
    try {
      let customerId = order.customerId
      if (!customerId && order.customerPhone) {
        const phoneNumber = order.customerPhone.replace(/\D/g, '')
        const newCustomer = await CustomerService.createCustomer({
          phone: phoneNumber,
        })
        customerId = newCustomer.id
      }

      const orderData = {
        ...order,
        customerId,
        shiftId: activeShiftId,
        items: [],
        deliveryNotes: order.type === 'DELIVERY' 
          ? `${order.comment || ''}\n${order.deliveryNotes || ''}`.trim()
          : undefined,
        surcharges: order.surcharges.map(s => ({
          surchargeId: s.id,
          amount: s.amount,
          description: s.title
        })),
        discounts: order.discounts?.map(d => ({
          discountId: d.id,
          amount: d.amount,
          description: d.title
        })) || []
      }
      const createdOrder = await OrderService.create(orderData)
      const createLog = await OrderService.createLog({orderId: createdOrder.id as string, action: (language === 'ka' ? 'შეკვეთა  შეიქმნა' : 'Заказ создан'), userId: user.id,});
      toast.success(language === 'ka' ? 'შეკვეთა წარმატებით შეიქმნა!' : 'Заказ успешно создан!')
      router.push(`/orders/${createdOrder.id}`)
    } catch (error) { 
      console.error('Order creation error:', error)
      toast.error(language === 'ka' ? 'შეკვეთის შექმნის შეცდომა' : 'Ошибка при создании заказа')
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="container py-6 flex justify-center items-center h-64">
        <p>{language === 'ka' ? 'ავტორიზაცია ხდება...' : 'Авторизация...'}</p>
      </div>
    )
  }

  return (
    <AccessCheck allowedRoles={['WAITER', 'CASHIER', 'MANAGER', 'SUPERVISOR']}>
      <div className="py-6">
        <OrderInfoStep
          order={order}
          setOrder={setOrder}
          user={user}
          language={language}
          onSubmit={handleCreateOrder}
          loading={loading}
        />
      </div>
    </AccessCheck>
  )
}