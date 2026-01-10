'use client'

import { useState, useEffect, JSX } from 'react'
import { OrderState } from '@/lib/types/order'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { AddressInput } from './AddressInput'
import {
  Utensils,
  Home,
  Truck,
  Calendar,
  Banknote,
  Store,
  Phone,
  Users,
  Table,
  MessageCircle,
  MapPin,
  Clock,
  ShoppingBag,
  ChevronRight,
  User,
  CreditCard,
  Wallet,
  Smartphone,
  Package,
  Pointer,
  Grid2x2Check,
  Plus,
  Minus,
  Building,
  MapPin as MapPinIcon,
  Star,
  Check
} from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { format } from 'date-fns'
import { useSurcharges } from '@/lib/hooks/useSurcharges'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogContentExtraWide,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import DateTimePicker from '@/components/ui/data-picker-with-time'

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
  const [scheduledTime, setScheduledTime] = useState<Date>(order.scheduledAt ? new Date(order.scheduledAt) : new Date())
  const [isRestaurantDialogOpen, setIsRestaurantDialogOpen] = useState(false)
  const [selectedRestaurant, setSelectedRestaurant] = useState<any>(null)

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

  useEffect(() => {
    if (user?.restaurant) {
      const currentRestaurant = user.restaurant.find((r: any) => r.id === order.restaurantId)
      setSelectedRestaurant(currentRestaurant || user.restaurant[0])
    }
  }, [order.restaurantId, user?.restaurant])

  const handleRestaurantChange = (value: string) => {
    const restaurant = user?.restaurant?.find((r: any) => r.id === value)
    if (!restaurant) return

    setSelectedRestaurant(restaurant)
    onRestaurantChange(value)
    
    setOrder({
      ...order,
      restaurantId: restaurant.id,
      items: [],
      deliveryZone: null,
      surcharges: []
    })
  }

  const handleSelectRestaurant = (restaurant: any) => {
    setSelectedRestaurant(restaurant)
    handleRestaurantChange(restaurant.id)
    setIsRestaurantDialogOpen(false)
  }

  const handleScheduledChange = (checked: boolean) => {
    setOrder({
      ...order,
      isScheduled: checked,
      scheduledAt: checked ? scheduledTime.toISOString() : undefined
    })
  }

  const handleScheduledTimeChange = (date: Date | null) => {
    if (date) {
      const now = new Date()
      // Убедимся, что выбранная дата не в прошлом
      if (date < now) {
        toast.error(language === 'ka' ? 'შეარჩიეთ მომავალი დრო' : 'Выберите будущее время')
        return
      }
      
      setScheduledTime(date)
      setOrder({
        ...order,
        scheduledAt: date.toISOString()
      })
    }
  }

  const orderTypes = [
    {
      value: 'DINE_IN',
      icon: <Utensils className="h-8 w-8" />,
      label: language === 'ka' ? 'რესტორანში' : 'В ресторане',
      desc: language === 'ka' ? 'მაგიდაზე' : 'За столом'
    },
    {
      value: 'TAKEAWAY',
      icon: <ShoppingBag className="h-8 w-8" />,
      label: language === 'ka' ? 'თვითწოდება' : 'Самовывоз',
      desc: language === 'ka' ? 'რესტორანიდან' : 'Из ресторана'
    },
    {
      value: 'DELIVERY',
      icon: <Truck className="h-8 w-8" />,
      label: language === 'ka' ? 'მიტანა' : 'Доставка',
      desc: language === 'ka' ? 'მისამართზე' : 'На адрес'
    },
    {
      value: 'BANQUET',
      icon: <Calendar className="h-8 w-8" />,
      label: language === 'ka' ? 'ბანკეტი' : 'Банкет',
      desc: language === 'ka' ? 'დაჯავშნული' : 'Предзаказ'
    }
  ]
  type PaymentMethodType = "CASH" | "CARD" | "CASH_TO_COURIER" | "CARD_TO_COURIER";
  const paymentMethods: Array<{
  value: PaymentMethodType;
  label: string;
  icon: JSX.Element;
  desc: string;
}> = [
    { 
      value: 'CASH', 
      label: language === 'ka' ? 'ნაღდი' : 'Наличные',  
      icon: <Wallet className="h-6 w-6" /> ,
      desc: language === 'ka' ? 'რესტორანში' : 'В ресторане'
    },
    { 
      value: 'CARD', 
      label: language === 'ka' ? 'ბარათით' : 'Картой', 
      icon: <CreditCard className="h-6 w-6" />,
      desc: language === 'ka' ? 'რესტორანში' : 'В ресторане'
    },
    { 
      value: 'CASH_TO_COURIER', 
      label: language === 'ka' ? 'კურიერს' : 'Наличными', 
      icon: <Wallet className="h-6 w-6" /> ,
      desc: language === 'ka' ? 'კურიერს' : 'Курьеру'
    },
    { 
      value: 'CARD_TO_COURIER', 
      label: language === 'ka' ? 'კურიერს' : 'Картой', 
      icon: <CreditCard className="h-6 w-6" /> ,
      desc: language === 'ka' ? 'კურიერს' : 'Курьеру'
    },
  ]

  // Диалог выбора ресторана
  const RestaurantDialog = () => (
    <Dialog open={isRestaurantDialogOpen} onOpenChange={setIsRestaurantDialogOpen}>
      <DialogContentExtraWide className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {language === 'ka' ? 'აირჩიეთ რესტორანი' : 'Выберите ресторан'}
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
          {user?.restaurant?.map((restaurant: any) => (
            <div
              key={restaurant.id}
              className={`relative cursor-pointer rounded-xl border-2 p-5 transition-all hover:shadow-lg ${
                selectedRestaurant?.id === restaurant.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
              onClick={() => handleSelectRestaurant(restaurant)}
            > 
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Store className="h-5 w-5 text-gray-600" />
                    <h3 className="text-lg font-bold text-gray-900">
                      {restaurant.title}
                    </h3>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </DialogContentExtraWide>
    </Dialog>
  )

  return (
    <div>
        {/* Шапка */}
          <div className='flex flex-col md:flex-row md:items-center justify-between gap-4 '>
            <div className='flex flex-row items-center'>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                {language === 'ka' ? 'ახალი შეკვეთა' : 'Новый заказ в ресторане '}
              </h1>
              
              {selectedRestaurant && (
                <Dialog open={isRestaurantDialogOpen} onOpenChange={setIsRestaurantDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="ghost"
                      className="text-3xl md:text-4xl font-bold text-blue-600 hover:text-blue-700 hover:bg-white px-3 py-6 h-auto"
                    >
                      {selectedRestaurant.title}
                    </Button>
                  </DialogTrigger>
                </Dialog>
              )}
            </div>

            {false && user?.restaurant && user.restaurant.length > 1 && (
              <div className="hidden md:flex items-center gap-4">
                <Store className="h-6 w-6 text-gray-600" />
                <Select
                  value={order.restaurantId}
                  onValueChange={handleRestaurantChange}
                >
                  <SelectTrigger className="w-64 h-12 text-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {user.restaurant.map((restaurant: any) => (
                      <SelectItem key={restaurant.id} value={restaurant.id} className="text-lg py-3">
                        {restaurant.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>


          {/* Статус ресторана */}
          {restaurantStatus && !restaurantStatus.isOpen && (
            <div className="bg-amber-100 border-2 border-amber-300 rounded-xl p-4 mb-4">
              <div className="flex items-center gap-3">
                <Clock className="h-8 w-8 text-amber-600" />
                <div>
                  <p className="text-amber-800 font-semibold text-xl">
                    {restaurantStatus.message}
                  </p>
                </div>
              </div>
            </div>
          )
          }

           {order.isScheduled && selectedRestaurant && restaurantStatus && !restaurantStatus.isOpen && (
            <div className="bg-blue-100 border-2 border-blue-300 rounded-xl p-4 mb-4">
              <div className="flex items-center gap-3">
                <Clock className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-blue-800 font-semibold text-xl">
                    {language === 'ka' ? 'შეკვეთა დაგეგმილია' : 'Отложенный заказ'}. 
                  {language === 'ka' 
                    ? ' შეკვეთა შეიქმნება რესტორანის სამუშაო საათებში'
                    : ' Заказ будет создан в рабочее время ресторана'}
                  </p>
                </div>
              </div>
            </div>
          )
          }
       

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Левая колонка - Основная информация */}
          <div className="lg:col-span-2 space-y-8">
            <div className="space-y-8">
              {/* Тип заказа */}
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                  <Utensils className="h-8 w-8 text-blue-600" />
                  {language === 'ka' ? 'შეკვეთის ტიპი' : 'Тип заказа'}
                </h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {orderTypes.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => setOrder({
                        ...order,
                        type: type.value as any,
                        deliveryZone: null,
                        surcharges: [],
                        payment: type.value === 'DELIVERY'
                          ? { method: 'CASH_TO_COURIER', status: 'PENDING' }
                          : { method: 'CASH', status: 'PENDING' }
                      })}
                      className={`flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all hover:scale-[1.02] ${
                        order.type === type.value
                          ? 'border-blue-600 bg-blue-50 text-blue-700'
                          : 'border-gray-200 bg-white hover:border-blue-400 hover:bg-blue-50'
                      }`}
                    >
                      <div className={`p-3 rounded-full mb-3 ${
                        order.type === type.value
                          ? 'bg-blue-100 text-blue-600'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {type.icon}
                      </div>
                      <span className="text-xl font-semibold mb-1">{type.label}</span>
                      <span className="text-gray-600">{type.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Способ оплаты (для доставки) */}
              {order.type === 'DELIVERY' && (
                <div className="bg-white rounded-2xl p-6 shadow-lg">
                  <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                    <Banknote className="h-8 w-8 text-green-600" />
                    {language === 'ka' ? 'გადახდის მეთოდი' : 'Способ оплаты'}
                  </h2>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {paymentMethods.map((method) => (
                      <button
                        key={method.value}
                        onClick={() => setOrder({
                          ...order,
                          payment: { ...order.payment, method: method.value }
                        })}
                        className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all hover:scale-[1.02] ${
                          order.payment.method === method.value
                            ? 'border-green-600 bg-green-50 text-green-700'
                            : 'border-gray-200 bg-white hover:border-green-400 hover:bg-green-50'
                        }`}
                      >
                        <div className={`p-2 rounded-full mb-2 ${
                          order.payment.method === method.value
                            ? 'bg-green-100 text-green-600'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {method.icon}
                        </div>
                        <span className="text-lg font-semibold mb-1">{method.label}</span>
                        <span className="text-gray-600">{method.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Детали заказа */}
              <div className="bg-white rounded-2xl p-6 shadow-lg w-full flex flex-col">
                <h2 className="text-2xl font-bold mb-6">
                  {language === 'ka' ? 'დეტალები' : 'Детали заказа'}
                </h2>
                
                <div className="flex flex-col md:flex-row gap-6 mb-6 w-full">
                  {/* Телефон */}
                  {order.type !== 'DINE_IN' && (
                    <div className="space-y-3 w-full">
                      <Label className="text-xl font-semibold flex items-center gap-3">
                        <Phone className="h-6 w-6 text-gray-600" />
                        {language === 'ka' ? 'ტელეფონი' : 'Телефон'}
                      </Label>
                      <Input
                        type="tel"
                        placeholder={language === 'ka' ? '+995 555 123 456' : '+7 999 123-45-67'}
                        value={order.phone || ''}
                        onChange={(e) => setOrder({
                          ...order,
                          phone: e.target.value
                        })}
                        className="h-14 text-lg"
                      />
                    </div>
                  )}

                  {/* Количество людей и номер стола */}
                  <div className="flex flex-col md:flex-row gap-4 w-full">
                    {/* Количество людей */}
                    <div className="flex-1 min-w-0">
                      <div className="space-y-3 w-full">
                        <Label className="text-xl font-semibold flex items-center gap-3">
                          <Users className="h-6 w-6 text-gray-600" />
                          {language === 'ka' ? 'ადამიანები' : 'Люди'}
                        </Label>
                        <div className="flex items-center w-full">
                          <Button
                            variant="outline"
                            size="lg"
                            className="h-14 w-14 flex-shrink-0 text-2xl"
                            onClick={() => setOrder({
                              ...order,
                              numberOfPeople: Math.max(1, order.numberOfPeople - 1)
                            })}
                          >
                            <Minus className='h-8 w-8'/>
                          </Button>
                          <div className="flex-1 mx-2">
                            <Input
                              type="number"
                              min="1"
                              value={order.numberOfPeople}
                              onChange={(e) => setOrder({
                                ...order,
                                numberOfPeople: parseInt(e.target.value) || 1
                              })}
                              className="h-14 text-2xl text-center font-bold w-full"
                            />
                          </div>
                          <Button
                            variant="outline"
                            size="lg"
                            className="h-14 w-14 flex-shrink-0 text-2xl"
                            onClick={() => setOrder({
                              ...order,
                              numberOfPeople: order.numberOfPeople + 1
                            })}
                          >
                            <Plus className='h-8 w-8'/>
                          </Button>
                        </div>
                      </div>
                    </div>
                    {/* Номер стола (только для DINE_IN) */}
                    {order.type === 'DINE_IN' && (
                      <div className="flex-1 min-w-0">
                        <div className="space-y-3 w-full">
                          <Label className="text-xl font-semibold flex items-center gap-3">
                            <Table className="h-6 w-6 text-gray-600" />
                            {language === 'ka' ? 'სტოლი' : 'Стол'}
                          </Label>
                          <div className="flex items-center w-full">
                            <Button
                              variant="outline"
                              size="lg"
                              className="h-14 w-14 flex-shrink-0 text-2xl"
                              onClick={() => setOrder({
                                ...order,
                                tableNumber: Math.max(0, order.tableNumber - 1)
                              })}
                            >
                              <Minus className='h-8 w-8'/>
                            </Button>
                            <div className="flex-1 mx-2">
                              <Input
                                type="number"
                                min="0"
                                value={order.tableNumber}
                                onChange={(e) => setOrder({
                                  ...order,
                                  tableNumber: parseInt(e.target.value) || 0
                                })}
                                className="h-14 text-2xl text-center font-bold w-full"
                              />
                            </div>
                            <Button
                              variant="outline"
                              size="lg"
                              className="h-14 w-14 flex-shrink-0 text-2xl"
                              onClick={() => setOrder({
                                ...order,
                                tableNumber: order.tableNumber + 1
                              })}
                            >
                              <Plus className='h-8 w-8'/>
                            </Button>
                            <Button
                              variant="outline"
                              size="lg"
                              title='Выбрать стол'
                              disabled
                              className="h-14 w-14 flex-shrink-0 text-3xl ml-2"
                              onClick={() => {}}
                            >
                              <Grid2x2Check className='h-8 w-8'/>
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Комментарий */}
                <div className="space-y-3">
                  <Label className="text-xl font-semibold flex items-center gap-3">
                    <MessageCircle className="h-6 w-6 text-gray-600" />
                    {language === 'ka' ? 'კომენტარი' : 'Комментарий'}
                  </Label>
                  <Textarea
                    value={order.comment || ''}
                    onChange={(e) => setOrder({
                      ...order,
                      comment: e.target.value
                    })}
                    className="min-h-[100px] text-lg"
                    placeholder={language === 'ka' ? 'დამატებითი ინფორმაცია...' : 'Дополнительная информация...'}
                  />
                </div>
              </div>

              {/* Доставка */}
              {order.type === 'DELIVERY' && (
                <div className="bg-white rounded-2xl p-6 shadow-lg">
                  <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                    <Truck className="h-8 w-8 text-orange-600" />
                    {language === 'ka' ? 'მიტანის ინფორმაცია' : 'Информация о доставке'}
                  </h2>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label className="text-xl font-semibold flex items-center gap-3">
                        <MapPin className="h-6 w-6 text-orange-600" />
                        {language === 'ka' ? 'მისამართი' : 'Адрес доставки'}
                      </Label>
                      <AddressInput
                        value={order.deliveryAddress}
                        onChange={(e: any) => setOrder({
                          ...order,
                          deliveryAddress: e.target.value,
                          deliveryZone: null
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
                      {order.deliveryZone && (
                        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center justify-between">
                            <span className="text-lg font-semibold text-green-700">
                              {order.deliveryZone.title}
                            </span>
                            <Badge variant="secondary" className="text-lg py-1 px-3">
                              {order.deliveryZone.price} ₽
                            </Badge>
                          </div>
                          {order.deliveryZone.minOrder && order.deliveryZone.minOrder > 0 && (
                            <p className="text-sm text-green-600 mt-1">
                              {language === 'ka' ? 'მინიმალური შეკვეთა: ' : 'Минимальный заказ: '}
                              {order.deliveryZone.minOrder} ₽
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      <Label className="text-xl font-semibold flex items-center gap-3">
                        <Clock className="h-6 w-6 text-orange-600" />
                        {language === 'ka' ? 'მიტანის დრო' : 'Время доставки'}
                      </Label>
                      <Input
                        type="time"
                        value={order.deliveryTime}
                        onChange={(e) => setOrder({
                          ...order,
                          deliveryTime: e.target.value
                        })}
                        className="h-14 text-lg"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Правая колонка - Действия и информация */}
          <div className="space-y-8">
            {/* Отложенный заказ */}
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <div 
                className="flex justify-between items-center gap-3 cursor-pointer"
                onClick={() => !(order.type === 'BANQUET') && handleScheduledChange(!order.isScheduled )}
              >
                <div className='flex items-center gap-2 mb-2'>
                  <Clock className="h-6 w-6 text-blue-600" />
                  
                  <h3 className="text-xl font-bold">
                    {language === 'ka' ? 'დაგეგმილი შეკვეთა' : 'Отложенный заказ'}
                  </h3>
                </div>
            
                <Checkbox
                  id="scheduled-order"
                  checked={order.type === 'BANQUET' ? true : (order.isScheduled || false)}
                  onCheckedChange={handleScheduledChange}
                  disabled={order.type === 'BANQUET'}
                  className="h-6 w-6"
                />
              </div>
              
              {order.isScheduled && (
                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label className="text-lg font-semibold flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-gray-600" />
                      {language === 'ka' ? 'დაგეგმვის დრო' : 'Время отложенного заказа'}
                    </Label>
                    <DateTimePicker
                      date={scheduledTime}
                      setDate={handleScheduledTimeChange}
                      placeholder={language === 'ka' ? 'აირჩიეთ თარიღი და დრო' : 'Выберите дату и время'}
                      className="w-full"
                      dateFormat="dd.MM.yyyy"
                      timeFormat="24h"
                      showSeconds={false}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Сводка заказа */}
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h3 className="text-2xl font-bold mb-6">
                {language === 'ka' ? 'შეკვეთის შეჯამება' : 'Сводка заказа'}
              </h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg text-gray-600">{language === 'ka' ? 'ტიპი' : 'Тип'}</span>
                  <span className="text-xl font-semibold">
                    {orderTypes.find(t => t.value === order.type)?.label}
                  </span>
                </div>
                
                {order.type === 'DELIVERY' && order.deliveryZone && (
                  <div className="flex justify-between items-center">
                    <span className="text-lg text-gray-600">{language === 'ka' ? 'მიტანა' : 'Доставка'}</span>
                    <span className="text-xl font-semibold text-green-600">
                      {order.deliveryZone.price} ₽
                    </span>
                  </div>
                )}
                
                {order.type === 'DELIVERY' && (
                  <div className="flex justify-between items-center">
                    <span className="text-lg text-gray-600">{language === 'ka' ? 'გადახდა' : 'Оплата'}</span>
                    <span className="text-xl font-semibold">
                      {paymentMethods.find(p => p.value === order.payment.method)?.label} ({paymentMethods.find(p => p.value === order.payment.method)?.desc})
                    </span>
                  </div>
                )}
                
                <div className="flex justify-between items-center">
                  <span className="text-lg text-gray-600">{language === 'ka' ? 'ადამიანები' : 'Люди'}</span>
                   <span className="text-xl font-semibold">{order.numberOfPeople}</span>
                </div>
                
                {order.type === 'DINE_IN' && order.tableNumber > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-lg text-gray-600">{language === 'ka' ? 'სტოლი' : 'Стол'}</span>
                     <span className="text-xl font-semibold">{order.tableNumber}</span>
                  </div>
                )}

                 {order.isScheduled && (
                  <div className="flex justify-between items-center">
                    <span className="text-lg text-gray-600">{language === 'ka' ? 'დაგეგმილი დრო' : 'Время заказа'}</span>
                    <span className="text-xl font-semibold">
                      {scheduledTime ? format(scheduledTime, 'dd.MM.yyyy HH:mm') : '-'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Кнопка создания */}
            <Button
              onClick={onSubmit}
              className="w-full h-16 text-2xl font-bold shadow-lg hover:shadow-xl transition-shadow"
              disabled={(loading || (!order.isScheduled && restaurantStatus && !restaurantStatus.isOpen)) as boolean}
            >
              {loading ? (
                <span className="flex items-center gap-3">
                  {language === 'ka' ? 'შექმნა...' : 'Создание...'}
                </span>
              ) : (
                <span className="flex items-center gap-3">
                  {language === 'ka' ? 'შეკვეთის შექმნა' : 'Создать заказ'}
                </span>
              )}
            </Button>
          </div>
        </div>
    

      <RestaurantDialog />
    </div>
  )
}