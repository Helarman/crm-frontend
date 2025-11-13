'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { OrderService } from '@/lib/api/order.service'
import { CustomerService } from '@/lib/api/customer.service'
import { DeliveryZoneService } from '@/lib/api/delivery-zone.service'
import { useAuth } from "@/lib/hooks/useAuth"
import { Language, useLanguageStore } from '@/lib/stores/language-store'
import { AccessCheck } from '@/components/AccessCheck'
import { toast } from 'sonner'
import { format, isValid, parseISO } from 'date-fns'
import { OrderInfoStep } from '@/components/features/order/OrderInfoStep'
import { OrderState } from '@/lib/types/order'
import { Restaurant } from '@/lib/types/restaurant'
import { useRestaurantSchedule } from '@/lib/hooks/useRestaurantSchedule'
import { useRestaurantById } from '@/lib/hooks/useRestaurantById'
import { AlertTriangle, Clock } from 'lucide-react'

const RESTAURANT_STORAGE_KEY = 'selectedRestaurantId'

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
    phone: '',
    numberOfPeople: 1,
    tableNumber: 0,
    deliveryAddress: '',
    deliveryTime: '',
    deliveryNotes: '',
    customerId: null,
    customerPhone: '',
    deliveryZone: null,
    surcharges: [],
    discounts: [],
    isScheduled: false, 
    scheduledAt: undefined
  })
  const [loading, setLoading] = useState(false)

  // Добавляем хуки для проверки расписания
  const { isRestaurantOpen } = useRestaurantSchedule();
  const { restaurant: currentRestaurant, isLoading: restaurantLoading } = useRestaurantById(selectedRestaurant?.id || null);
  
  // Состояние для статуса ресторана с автообновлением
  const [restaurantStatus, setRestaurantStatus] = useState<{ 
    isOpen: boolean; 
    message: string;
    nextOpenTime?: string;
  } | null>(null);

  // Автоматическое обновление статуса ресторана
  useEffect(() => {
    if (!currentRestaurant) {
      setRestaurantStatus(null);
      return;
    }

    const checkRestaurantStatus = () => {
      try {
        const newStatus = isRestaurantOpen(currentRestaurant, language);
        setRestaurantStatus(newStatus);
      } catch (error) {
        console.error('Error checking restaurant status:', error);
        setRestaurantStatus({
          isOpen: false,
          message: language === 'ru' ? 'Ошибка проверки расписания' : 'განრიგის შემოწმების შეცდომა'
        });
      }
    };

    // Проверяем сразу
    checkRestaurantStatus();

    // Устанавливаем интервал для проверки каждые 30 секунд
    const interval = setInterval(checkRestaurantStatus, 30000);

    return () => clearInterval(interval);
  }, [currentRestaurant, isRestaurantOpen, language]);

  // Инициализация ресторана
  useEffect(() => {
    if (!user) return

    if (!user.restaurant || user.restaurant.length === 0) {
      toast.error(language === 'ka' ? 'რესტორანი არ მოიძებნა' : 'Ресторан не найден')
      return
    }

    // Получаем сохраненный ресторан из localStorage или используем первый доступный
    const savedRestaurantId = localStorage.getItem(RESTAURANT_STORAGE_KEY)
    const defaultRestaurant = user.restaurant[0]
    
    const isValidSavedRestaurant = savedRestaurantId && 
      user.restaurant.some((r: Restaurant) => r.id === savedRestaurantId)

    const initialRestaurant = isValidSavedRestaurant 
      ? user.restaurant.find((r: Restaurant) => r.id === savedRestaurantId)!
      : defaultRestaurant

    setSelectedRestaurant(initialRestaurant)
    setOrder(prev => ({ ...prev, restaurantId: initialRestaurant.id }))
  }, [user, language])

  // Обработчик изменения ресторана
  const handleRestaurantChange = async (restaurantId: string) => {
    if (!user) return

    const restaurant = user.restaurant.find((r: Restaurant) => r.id === restaurantId)
    if (!restaurant) return

    // Сохраняем выбор в localStorage
    localStorage.setItem(RESTAURANT_STORAGE_KEY, restaurantId)
    
    // Обновляем состояние
    setSelectedRestaurant(restaurant)
    setOrder(prev => ({ 
      ...prev, 
      restaurantId: restaurant.id,
      items: [],
      deliveryZone: null,
      surcharges: []
    }))
  }

  // Функция для проверки зоны доставки
  const checkDeliveryZone = async (address: string, restaurantId: string) => {
    if (!address) {
      return { success: false, error: language === 'ka' 
        ? 'შეიყვანეთ მისამართი' 
        : 'Введите адрес доставки' }
    }

    try {
      const token = 'e7a8d3897b07bb4631312ee1e8b376424c6667ea'
      const url = 'https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/address'
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify({ 
          query: address, 
          count: 1,
          locations: [{ country: "*" }]
        })
      })

      if (!response.ok) {
        return { success: false, error: language === 'ka' 
          ? 'მისამართის გეოკოდირების შეცდომა' 
          : 'Ошибка геокодирования адреса' }
      }

      const data = await response.json()
      const firstSuggestion = data.suggestions?.[0]
      if (!firstSuggestion) {
        return { success: false, error: language === 'ka' 
          ? 'მისამართი არ მოიძებნა' 
          : 'Адрес не найден' }
      }

      const { geo_lat: lat, geo_lon: lng } = firstSuggestion.data
      if (!lat || !lng) {
        return { success: false, error: language === 'ka' 
          ? 'მისამართის კოორდინატები არ მოიძებნა' 
          : 'Координаты адреса не найдены' }
      }

      const deliveryZone = await DeliveryZoneService.findZoneForPoint(
        restaurantId,
        parseFloat(lat),
        parseFloat(lng)
      )

      if (!deliveryZone) {
        return { 
          success: false, 
          error: language === 'ka' 
            ? 'მისამართი არ არის მიტანის ზონაში' 
            : 'Адрес не входит в зону доставки',
          zone: null
        }
      }

      return {
        success: true,
        zone: {
          id: deliveryZone.id,
          title: deliveryZone.title,
          price: deliveryZone.price,
          minOrder: deliveryZone.minOrder
        }
      }
    } catch (error) {
      console.error('Delivery zone check error:', error)
      return { 
        success: false, 
        error: language === 'ka' 
          ? 'მიტანის ზონის განსაზღვრის შეცდომა' 
          : 'Ошибка определения зоны доставки' 
      }
    }
  }

  const handleCreateOrder = async () => {
    // Проверяем, открыт ли ресторан (кроме запланированных заказов)
    if (!order.isScheduled && restaurantStatus && !restaurantStatus.isOpen) {
      toast.error(language === 'ka' 
        ? `შეუძლებელია შეკვეთის შექმნა: ${restaurantStatus.message}` 
        : `Невозможно создать заказ: ${restaurantStatus.message}`)
      return;
    }

    // Проверяем зону доставки для заказов типа DELIVERY
    if (order.type === 'DELIVERY' && order.deliveryAddress && !order.deliveryZone) {
      setLoading(true)
      const zoneCheck = await checkDeliveryZone(order.deliveryAddress, order.restaurantId)
      
      if (!zoneCheck.success) {
        toast.error(zoneCheck.error)
        setLoading(false)
        return
      }

      // Обновляем заказ с найденной зоной
      setOrder(prev => ({
        ...prev,
        deliveryZone: zoneCheck.zone
      }))

      // Показываем информацию о зоне доставки
      if (zoneCheck.zone) {
        toast.success(language === 'ka' 
          ? `მიტანის ღირებულება: ${zoneCheck.zone.price} ₽` 
          : `Стоимость доставки: ${zoneCheck.zone.price} ₽`)
      }
    }

    // Продолжаем создание заказа
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
        items: [],
        scheduledAt: order.scheduledAt,
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
      
      console.log('Sending order data:', orderData)
      const createdOrder = await OrderService.create(orderData)
      await OrderService.createLog({
        orderId: createdOrder.id as string, 
        action: language === 'ka' ? 'შეკვეთა შეიქმნა' : 'Заказ создан', 
        userId: user.id
      })
      
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
        {/* Большая желтая плашка когда ресторан закрыт (только для незапланированных заказов) */}
        {!order.isScheduled && selectedRestaurant && restaurantStatus && !restaurantStatus.isOpen && (
          <div className="w-full bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
              <div>
                <h3 className="text-amber-800 font-semibold text-lg">
                  {language === 'ru' ? 'Ресторан закрыт' : 'რესტორანი დახურულია'}
                </h3>
                <p className="text-amber-700 text-sm">
                  {restaurantStatus.message}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Плашка для запланированных заказов */}
        {order.isScheduled && selectedRestaurant && restaurantStatus && !restaurantStatus.isOpen && (
          <div className="w-full bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <Clock className="w-6 h-6 text-blue-600" />
              <div>
                <h3 className="text-blue-800 font-semibold text-lg">
                  {language === 'ru' ? 'Заказ запланирован' : 'შეკვეთა დაგეგმილია'}
                </h3>
                <p className="text-blue-700 text-sm">
                  {language === 'ru' 
                    ? 'Заказ будет создан в рабочее время ресторана' 
                    : 'შეკვეთა შეიქმნება რესტორანის სამუშაო საათებში'}
                </p>
              </div>
            </div>
          </div>
        )}

        <OrderInfoStep
          order={order}
          setOrder={setOrder}
          user={user}
          language={language}
          onSubmit={handleCreateOrder}
          loading={loading}
          onRestaurantChange={handleRestaurantChange}
          restaurantStatus={restaurantStatus}
        />
      </div>
    </AccessCheck>
  )
}