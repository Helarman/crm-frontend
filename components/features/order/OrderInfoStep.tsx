'use client'

import { useState } from 'react'
import { OrderState } from '@/lib/types/order'
import { OrderTypeSelector } from './OrderTypeSelector'
import { PaymentSelector } from './PaymentSelector'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { AddressInput } from './AddressInput'
import { 
  Utensils,
  Banknote,
  Store,
  Phone,
  Users,
  Table,
  MessageSquare,
  MapPin,
  Clock
} from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { format } from 'date-fns'
import { CustomerService } from '@/lib/api/customer.service'
import { DeliveryZoneService } from '@/lib/api/delivery-zone.service'

interface OrderInfoStepProps {
  order: OrderState
  setOrder: (order: OrderState) => void
  user: any
  language: string
  onSubmit: () => void
  loading: boolean
}

export const OrderInfoStep = ({
  order,
  setOrder,
  user,
  language,
  onSubmit,
  loading
}: OrderInfoStepProps) => {
  const [isCheckingDeliveryZone, setIsCheckingDeliveryZone] = useState(false)
  const [isScheduled, setIsScheduled] = useState(false)
  const [scheduledTime, setScheduledTime] = useState(format(new Date(), "yyyy-MM-dd'T'HH:mm"))

  const t = (text: string | undefined, textGe: string | undefined) => {
    return language === 'ka' && textGe ? textGe : text || ''
  }

  const handleRestaurantChange = (value: string) => {
    const restaurant = user?.restaurant?.find((r: any) => r.id === value)
    if (!restaurant) return

    setOrder({
      ...order,
      restaurantId: restaurant.id,
      items: [],
      deliveryZone: null,
      surcharges: []
    })
  }

  const checkDeliveryZone = async () => {
    if (!order.deliveryAddress) {
      toast.error(language === 'ka' 
        ? 'შეიყვანეთ მისამართი' 
        : 'Введите адрес доставки')
      return
    }
    setIsCheckingDeliveryZone(true)
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
          query: order.deliveryAddress, 
          count: 1,
          locations: [{ country: "*" }]
        })
      })

      if (!response.ok) throw new Error('Failed to geocode address')

      const data = await response.json()
      const firstSuggestion = data.suggestions?.[0]
      if (!firstSuggestion) throw new Error('Address not found')

      const { geo_lat: lat, geo_lon: lng } = firstSuggestion.data
      if (!lat || !lng) throw new Error('Coordinates not found')

      const deliveryZone = await DeliveryZoneService.findZoneForPoint(
        order.restaurantId,
        parseFloat(lat),
        parseFloat(lng)
      )

      if (!deliveryZone) {
        toast.error(language === 'ka' 
          ? 'მისამართი არ არის მიტანის ზონაში' 
          : 'Адрес не входит в зону доставки')
        setOrder({ ...order, deliveryZone: null })
        return
      }

      setOrder({
        ...order,
        deliveryZone: {
          id: deliveryZone.id,
          title: deliveryZone.title,
          price: deliveryZone.price,
          minOrder: deliveryZone.minOrder
        }
      })

      toast.success(language === 'ka' 
        ? `მიტანის ღირებულება: ${deliveryZone.price} ₽` 
        : `Стоимость доставки: ${deliveryZone.price} ₽`)
    } catch (error) {
      console.error('Delivery zone check error:', error)
      toast.error(language === 'ka' 
        ? 'მიტანის ზონის განსაზღვრის შეცდომა' 
        : 'Ошибка определения зоны доставки')
    } finally {
      setIsCheckingDeliveryZone(false)
    }
  }

  const validateStep = () => {
    if ((order.type === 'DINE_IN' || order.type === 'BANQUET') && !order.tableNumber) {
      toast.error(language === 'ka' ? 'შეიყვანეთ სტოლის ნომერი' : 'Введите номер стола')
      return false
    }

    if (order.type === 'DELIVERY') {
      if (!order.deliveryAddress) {
        toast.error(language === 'ka' ? 'შეიყვანეთ მისამართი' : 'Введите адрес доставки')
        return false
      }
      if (!order.deliveryZone) {
        toast.error(language === 'ka' 
          ? 'გთხოვთ დაადასტუროთ მიტანის მისამართი' 
          : 'Пожалуйста, подтвердите адрес доставки')
        return false
      }
    }

    if (isScheduled && !scheduledTime) {
      toast.error(language === 'ka' 
        ? 'შეიყვანეთ დაგეგმილი დრო' 
        : 'Введите запланированное время')
      return false
    }

    return true
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{language === 'ka' ? 'ახალი შეკვეთა' : 'Новый заказ'}</h1>
      
      <div className="space-y-3">
        <Label className="flex items-center gap-2">
          <Utensils className="h-4 w-4" />
          {language === 'ka' ? 'შეკვეთის ტიპი' : 'Тип заказа'}
        </Label>
        <OrderTypeSelector
          value={order.type}
          onChange={(type) => setOrder({ 
            ...order, 
            type, 
            deliveryZone: null, 
            surcharges: [],
            payment: type === 'DELIVERY' 
              ? { method: 'CASH_TO_COURIER', status: 'PENDING' }
              : { method: 'CASH', status: 'PENDING' }
          })}
          language={language as any}
        />
      </div>

      <div className="space-y-3">
        <Label className="flex items-center gap-2">
          <Banknote className="h-4 w-4" />
          {language === 'ka' ? 'გადახდის მეთოდი' : 'Способ оплаты'}
        </Label>
        <PaymentSelector
          method={order.payment.method}
          onChange={(method) => setOrder({
            ...order,
            payment: { ...order.payment, method }
          })}
          orderType={order.type}
          language={language as any}
        />
      </div>

      {user?.restaurant && user.restaurant.length > 1 && (
        <div className="mb-6 space-y-2">
          <Label className="flex items-center gap-2">
            <Store className="h-4 w-4" />
            {language === 'ka' ? 'რესტორანი' : 'Ресторан'}
          </Label>
          <Select
            value={order.restaurantId}
            onValueChange={handleRestaurantChange}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={language === 'ka' ? 'აირჩიეთ რესტორანი' : 'Выберите ресторан'} />
            </SelectTrigger>
            <SelectContent>
              {user.restaurant.map((restaurant: any) => (
                <SelectItem key={restaurant.id} value={restaurant.id}>
                  {restaurant.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Phone className="h-5 w-5" />
          {language === 'ka' ? 'ტელეფონის ნომერი' : 'Номер телефона'}
        </Label>
        <div className="flex gap-2">
          <Input
            placeholder="+7 (___) ___-__-__"
            value={order.customerPhone}
            onChange={(e) => setOrder({ 
              ...order, 
              customerPhone: e.target.value, 
              customerId: null 
            })}
            maxLength={18}
          />
          <Button 
            onClick={async () => {
              if (!order.customerPhone) {
                toast.error(language === 'ka' 
                  ? 'შეიყვანეთ ტელეფონის ნომერი' 
                  : 'Введите номер телефона')
                return
              }
              try {
                const phoneNumber = order.customerPhone.replace(/\D/g, '')
                const customer = await CustomerService.getCustomerByPhone(phoneNumber)
                setOrder({
                  ...order,
                  customerId: customer.id,
                })
                toast.success(language === 'ka' 
                  ? 'კლიენტი წარმატებით მოიძებნა' 
                  : 'Клиент успешно найден')
              } catch (error) {
                console.error('Customer search error:', error)
                setOrder({ ...order, customerId: null })
                toast.error(language === 'ka' 
                  ? 'კლიენტი არ მოიძებნა' 
                  : 'Клиент не найден')
              }
            }}
            variant="secondary"
          >
            {language === 'ka' ? 'ძებნა' : 'Найти'}
          </Button>
        </div>
        {order.customerId ? (
          <p className="text-sm text-green-600">
            {language === 'ka' ? 'კლიენტი ნაპოვნია' : 'Клиент найден'}
          </p>
        ) : order.customerPhone ? (
          <p className="text-sm text-yellow-600">
            {language === 'ka' ? 'კლიენტი არ არის ნაპოვნი' : 'Клиент не найден'}
          </p>
        ) : null}
      </div>

     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  <div className="space-y-3">
    <Label className="text-sm flex items-center gap-2">
      <Users className="h-4 w-4" />
      {language === 'ka' ? 'მომხმარებლების რაოდენობა' : 'Количество посетителей'}
    </Label>
    <div className="flex items-center gap-2" >
      <Button
        variant="outline"
        size="icon"
        onClick={() => setOrder({
          ...order,
          numberOfPeople: Math.max(1, order.numberOfPeople - 1)
        })}
      >
        -
      </Button>
      <Input
        type="number"
        min="1"
        value={order.numberOfPeople}
        onChange={(e) => setOrder({
          ...order,
          numberOfPeople: parseInt(e.target.value) || 1
        })}
        className="text-center"
      />
      <Button
        variant="outline"
        size="icon"
        onClick={() => setOrder({
          ...order,
          numberOfPeople: order.numberOfPeople + 1
        })}
      >
        +
      </Button>
    </div>
  </div>
  <div className="space-y-3">
    <Label className="text-sm flex items-center gap-2">
      <Table className="h-4 w-4" />
      {language === 'ka' ? 'სტოლის ნომერი' : 'Номер стола'}
    </Label>
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        disabled={order.type === 'TAKEAWAY' || order.type === 'DELIVERY'}
        onClick={() => setOrder({
          ...order,
          tableNumber: Math.max(0, order.tableNumber - 1)
        })}
      >
        -
      </Button>
      <Input
        disabled={order.type === 'TAKEAWAY' || order.type === 'DELIVERY'}
        type="number"
        min="0"
        value={order.tableNumber}
        onChange={(e) => setOrder({
          ...order,
          tableNumber: parseInt(e.target.value) || 0
        })}
        className="text-center"
      />
      <Button
        variant="outline"
        size="icon"
        disabled={order.type === 'TAKEAWAY' || order.type === 'DELIVERY'}
        onClick={() => setOrder({
          ...order,
          tableNumber: order.tableNumber + 1
        })}
      >
        +
      </Button>
    </div>
  </div>
</div>

      {order.type === 'DELIVERY' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="space-y-1">
            <Label className="text-sm flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              {language === 'ka' ? 'მისამართი' : 'Адрес доставки'}
            </Label>
            <div className="flex w-full">
              <div className='w-full mr-4'>
                <AddressInput
                  value={order.deliveryAddress}
                  onChange={(e: any) => setOrder({
                    ...order,
                    deliveryAddress: e.target.value,
                    deliveryZone: null
                  })}
                  language={language as any}
                />
              </div>
              <Button
                onClick={checkDeliveryZone}
                disabled={!order.deliveryAddress || isCheckingDeliveryZone}
                variant="secondary"
                className="whitespace-nowrap"
              >
                {isCheckingDeliveryZone 
                  ? language === 'ka' ? 'იტვირთება...' : 'Загрузка...'
                  : language === 'ka' ? 'ღირებულების შემოწმება' : 'Проверить стоимость'}
              </Button>
            </div>
            {order.deliveryZone && (
              <p className="text-sm text-green-600">
                {language === 'ka' 
                  ? `მიტანის ზონა: ${order.deliveryZone.title}, ღირებულება: ${order.deliveryZone.price} ₽`
                  : `Зона доставки: ${order.deliveryZone.title}, стоимость: ${order.deliveryZone.price} ₽`}
              </p>
            )}
          </div>
          <div className="space-y-1">
            <Label className="text-sm flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {language === 'ka' ? 'დრო მიტანისთვის' : 'Время доставки'}
            </Label>
            <Input
              type="time"
              value={order.deliveryTime}
              onChange={(e) => setOrder({
                ...order,
                deliveryTime: e.target.value
              })}
            />
          </div>
          <div className="space-y-1 md:col-span-2">
            <Label className="text-sm flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              {language === 'ka' ? 'დამატებითი ინსტრუქციები' : 'Дополнительные инструкции'}
            </Label>
            <Textarea
              value={order.deliveryNotes}
              onChange={(e) => setOrder({
                ...order,
                deliveryNotes: e.target.value
              })}
              placeholder={language === 'ka' ? 'მაგ. დარეკეთ შესვლამდე' : 'Например: Позвоните перед приездом'}
            />
          </div>
        </div>
      )}

      <div className="mb-6 p-4 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="scheduled-order"
              checked={isScheduled}
              onCheckedChange={(checked) => setIsScheduled(!!checked)}
            />
            <Label htmlFor="scheduled-order" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {language === 'ka' ? 'დაგეგმილი შეკვეთა' : 'Отложенный заказ'}
            </Label>
          </div>
          <div className="w-64">
            <Input
              type="datetime-local"
              disabled={!isScheduled}
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              min={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button 
          onClick={() => {
            if (validateStep()) {
              onSubmit()
            }
          }}
          size="lg"
          className="text-lg"
          disabled={loading}
        >
          {loading 
            ? language === 'ka' ? 'შექმნა...' : 'Создание...'
            : language === 'ka' ? 'შეკვეთის შექმნა' : 'Создать заказ'}
        </Button>
      </div>
    </div>
  )
}