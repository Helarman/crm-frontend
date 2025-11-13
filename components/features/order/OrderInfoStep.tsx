'use client'

import { useState, useEffect } from 'react'
import { OrderState, Surcharge } from '@/lib/types/order'
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
  Clock,
  PlusCircle,
  MessageCircle
} from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { format } from 'date-fns'
import { CustomerService } from '@/lib/api/customer.service'
import { DeliveryZoneService } from '@/lib/api/delivery-zone.service'
import { useSurcharges } from '@/lib/hooks/useSurcharges'

interface OrderInfoStepProps {
  order: OrderState
  setOrder: (order: OrderState) => void
  user: any
  language: string
  onSubmit: () => void
  loading: boolean
  onRestaurantChange: (restaurantId: string) => void
  restaurantStatus?: { 
    isOpen: boolean; 
    message: string;
    nextOpenTime?: string;
  } | null
}

export const OrderInfoStep = ({
  order,
  setOrder,
  user,
  language,
  onSubmit,
  loading,
  onRestaurantChange,
  restaurantStatus
}: OrderInfoStepProps) => {
  const [isScheduled, setIsScheduled] = useState(false)
  const [scheduledTime, setScheduledTime] = useState(format(new Date(), "yyyy-MM-dd'T'HH:mm"))

  const { surcharges: availableSurcharges } = useSurcharges(order.type, order.restaurantId)

  const t = (text: string | undefined, textGe: string | undefined) => {
    return language === 'ka' && textGe ? textGe : text || ''
  }

  useEffect(() => {
    if (availableSurcharges.length > 0) {
      const autoAppliedSurcharges = availableSurcharges.filter(s =>
        !order.surcharges.some(os => os.id === s.id))

      if (autoAppliedSurcharges.length > 0) {
        setOrder({
          ...order,
          surcharges: [...order.surcharges, ...autoAppliedSurcharges]
        })
      }
    }
  }, [availableSurcharges, order.type, order.restaurantId])

  const handleRestaurantChange = (value: string) => {
    const restaurant = user?.restaurant?.find((r: any) => r.id === value)
    if (!restaurant) return

    // Вызываем функцию из родительского компонента для обновления ресторана и смены
    onRestaurantChange(value)
    
    // Локально обновляем состояние заказа
    setOrder({
      ...order,
      restaurantId: restaurant.id,
      items: [],
      deliveryZone: null,
      surcharges: []
    })
  }

  const handleScheduledChange = (checked: boolean) => {
    setIsScheduled(checked)
    setOrder({
      ...order,
      isScheduled: checked,
      scheduledAt: checked ? format(new Date(), "yyyy-MM-dd'T'HH:mm") : undefined
    })
  }

  const handleScheduledTimeChange = (time: string) => {
    setScheduledTime(time)
    setOrder({
      ...order,
      scheduledAt: time
    })
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{language === 'ka' ? 'ახალი შეკვეთა' : 'Новый заказ'}</h1>
      
      {/* Информация о активной смене
      {activeShiftId ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-green-700 text-sm flex items-center gap-2">
            <Clock className="h-4 w-4" />
            {language === 'ka' 
              ? `აქტიური ცვლა: ${activeShiftId}` 
              : `Активная смена: ${activeShiftId}`}
          </p>
        </div>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-yellow-700 text-sm flex items-center gap-2">
            <Clock className="h-4 w-4" />
            {language === 'ka' 
              ? 'ცვლა არ არის აქტიური' 
              : 'Смена не активна'}
          </p>
        </div>
      )} */}

      {/* Селектор ресторана */}
      {user?.restaurant && user.restaurant.length > 1 && (
        <div className="space-y-2">
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

      {order.type === 'DELIVERY' &&
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
      }

      {order.type !== 'DINE_IN' &&
        <div className="space-y-3">
          <Label className="text-sm flex items-center gap-2">
            <Phone className="h-4 w-4" />
            {language === 'ka' ? 'ტელეფონის ნომერი' : 'Номер телефона'}
          </Label>
          <Input
            type="tel"
            placeholder={language === 'ka' ? '+995 555 123 456' : '+7 999 123-45-67'}
            value={order.phone || ''}
            onChange={(e) => setOrder({
              ...order,
              phone: e.target.value
            })}
          />
        </div>
      }

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <Label className="text-sm flex items-center gap-2">
            <Users className="h-4 w-4" />
            {language === 'ka' ? 'მომხმარებლების რაოდენობა' : 'Количество посетителей'}
          </Label>
          <div className="flex items-center gap-2">
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
            <AddressInput
              value={order.deliveryAddress}
              onChange={(e: any) => setOrder({
                ...order,
                deliveryAddress: e.target.value,
                deliveryZone: null // Сбрасываем зону при изменении адреса
              })}
              language={language as any}
              restaurantId={order.restaurantId}
              onZoneFound={(zone) => {
                setOrder({
                  ...order,
                  deliveryZone: zone
                })
              }}
            />
            {order.deliveryZone && order.deliveryZone.price ? (
              <p className="text-sm text-green-600">
                {language === 'ka'
                  ? `მიტანის ზონა: ${order.deliveryZone.title}, ღირებულება: ${order.deliveryZone.price} ₽`
                  : `Зона доставки: ${order.deliveryZone.title}, стоимость: ${order.deliveryZone.price} ₽`}
              </p>
            ) : order.deliveryAddress && (
              <p className="text-sm text-yellow-600">
                {language === 'ka'
                  ? 'მიტანის ზონა არ მოიძებნა'
                  : 'Зона доставки не найдена'}
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
        </div>
      )}

      {/* Comment Field */}
      <div className="space-y-1">
        <Label className="text-sm flex items-center gap-2">
          <MessageCircle className="h-4 w-4" />
          {language === 'ka' ? 'კომენტარი' : 'Комментарий'}
        </Label>
        <Textarea
          value={order.comment || ''}
          onChange={(e) => setOrder({
            ...order,
            comment: e.target.value
          })}
        />
      </div>

      <div className="mb-6 p-4 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="scheduled-order"
              checked={order.isScheduled || false}
              onCheckedChange={handleScheduledChange}
            />
            <Label htmlFor="scheduled-order" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {language === 'ka' ? 'დაგეგმილი შეკვეთა' : 'Отложенный заказ'}
            </Label>
          </div>
          <div className="w-64">
            <Input
              type="datetime-local"
              disabled={!order.isScheduled}
              value={order.scheduledAt || format(new Date(), "yyyy-MM-dd'T'HH:mm")}
              onChange={(e) => handleScheduledTimeChange(e.target.value)}
              min={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={() =>  onSubmit()}
          size="lg"
          className="text-lg"
          disabled={loading || (!order!.isScheduled && restaurantStatus! && !restaurantStatus!.isOpen)}
        >
          {loading
            ? language === 'ka' ? 'შექმნა...' : 'Создание...'
            : language === 'ka' ? 'შეკვეთის შექმნა' : 'Создать заказ'}
        </Button>
      </div>
    </div>
  )
}