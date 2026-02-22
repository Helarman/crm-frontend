'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EnumOrderStatus, OrderResponse, OrderService } from '@/lib/api/order.service'
import { useAuth } from '@/lib/hooks/useAuth'
import { toast } from 'sonner'
import { Language, useLanguageStore } from '@/lib/stores/language-store'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog'
import { 
  MapPin, 
  Clock, 
  CheckCircle, 
  User, 
  CreditCard, 
  Package, 
  ChevronDown, 
  Home, 
  DoorOpen, 
  Hash, 
  Phone,
  Calendar,
  Bike,
  ChefHat,
  Store,
  AlertCircle,
  Copy,
  PhoneCall
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface DeliveryOrderCardProps {
  order: OrderResponse
  variant: 'available' | 'active' | 'completed'
  onStatusChange?: (updatedOrder: OrderResponse) => void
  className?: string
}

type StatusConfig = Record<EnumOrderStatus, {
  border: string
  bg: string
  badge: string
  icon: React.ElementType
  label: { ru: string; ka: string }
}>

const statusConfig: StatusConfig = {
  [EnumOrderStatus.CREATED]: {
    border: 'border-l-gray-400',
    bg: 'bg-gradient-to-r from-gray-50 to-transparent dark:from-gray-900/20',
    badge: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    icon: Clock,
    label: { ru: 'Создан', ka: 'შექმნილია' }
  },
  [EnumOrderStatus.CONFIRMED]: {
    border: 'border-l-blue-400',
    bg: 'bg-gradient-to-r from-blue-50 to-transparent dark:from-blue-900/20',
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    icon: CheckCircle,
    label: { ru: 'Подтвержден', ka: 'დადასტურებულია' }
  },
  [EnumOrderStatus.PREPARING]: {
    border: 'border-l-orange-500',
    bg: 'bg-gradient-to-r from-orange-50 to-transparent dark:from-orange-900/20',
    badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
    icon: ChefHat,
    label: { ru: 'Готовится', ka: 'მზადდება' }
  },
  [EnumOrderStatus.READY]: {
    border: 'border-l-green-500',
    bg: 'bg-gradient-to-r from-green-50 to-transparent dark:from-green-900/20',
    badge: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    icon: Store,
    label: { ru: 'Готов к выдаче', ka: 'მზადაა გასაცემად' }
  },
  [EnumOrderStatus.DELIVERING]: {
    border: 'border-l-blue-500',
    bg: 'bg-gradient-to-r from-blue-50 to-transparent dark:from-blue-900/20',
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    icon: Bike,
    label: { ru: 'Доставляется', ka: 'მიტანა' }
  },
  [EnumOrderStatus.COMPLETED]: {
    border: 'border-l-gray-500',
    bg: 'bg-gradient-to-r from-gray-50 to-transparent dark:from-gray-900/20',
    badge: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    icon: CheckCircle,
    label: { ru: 'Завершен', ka: 'დასრულებულია' }
  },
  [EnumOrderStatus.CANCELLED]: {
    border: 'border-l-red-500',
    bg: 'bg-gradient-to-r from-red-50 to-transparent dark:from-red-900/20',
    badge: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    icon: AlertCircle,
    label: { ru: 'Отменен', ka: 'გაუქმებულია' }
  }
}

export function DeliveryOrderCard({ order, variant, onStatusChange, className }: DeliveryOrderCardProps) {
  const { user } = useAuth()
  const { language } = useLanguageStore()
  const [isUpdating, setIsUpdating] = useState(false)
  const [showCompleteDialog, setShowCompleteDialog] = useState(false)
  const [showItems, setShowItems] = useState(false)
  const [copied, setCopied] = useState(false)

  const translations = {
    ru: {
      acceptDelivery: 'Принять доставку',
      startDelivery: 'Начать доставку',
      completeDelivery: 'Завершить доставку',
      deliveryAddress: 'Адрес доставки',
      deliveryNotes: 'Примечания к доставке',
      deliveryTime: 'Время доставки',
      openInMap: 'Открыть в картах',
      orderComposition: 'Состав заказа',
      paymentMethod: 'Способ оплаты',
      cash: 'Наличные',
      card: 'Карта',
      online: 'Онлайн',
      completeDeliveryConfirm: 'Подтверждение завершения доставки',
      completeDeliveryText: 'Вы уверены, что хотите завершить доставку этого заказа?',
      cancel: 'Отмена',
      confirm: 'Подтвердить',
      completing: 'Завершение...',
      deliveryCompleted: 'Доставка завершена',
      error: 'Ошибка',
      assignedTo: 'Курьер',
      you: 'Вы',
      items: 'позиций',
      orderNumber: 'Заказ',
      totalAmount: 'Сумма',
      customer: 'Клиент',
      phone: 'Телефон',
      scheduled: 'Отложенный',
      cashToCourier: 'Наличными курьеру',
      otherDishes: 'Другие блюда',
      responsibleWorkshop: 'Ответственный цех',
      entrance: 'Подъезд',
      floor: 'Этаж',
      apartment: 'Квартира/офис',
      intercom: 'Домофон',
      courierComment: 'Комментарий для курьера',
      addressDetails: 'Детали адреса',
      call: 'Позвонить',
      contactPhone: 'Контактный телефон',
      copyAddress: 'Копировать адрес',
      copied: 'Скопировано!',
      orderTime: 'Время заказа',
      estimatedTime: 'Ожидаемое время',
      showMore: 'Показать ещё',
      showLess: 'Свернуть'
    },
    ka: {
      acceptDelivery: 'მიტანის მიღება',
      startDelivery: 'მიტანის დაწყება',
      completeDelivery: 'მიტანის დასრულება',
      deliveryAddress: 'მიტანის მისამართი',
      deliveryNotes: 'მიტანის შენიშვნები',
      deliveryTime: 'მიტანის დრო',
      openInMap: 'გახსნა რუკაზე',
      orderComposition: 'შეკვეთის შემადგენლობა',
      paymentMethod: 'გადახდის მეთოდი',
      cash: 'ნაღდი',
      card: 'ბარათი',
      online: 'ონლაინი',
      completeDeliveryConfirm: 'მიტანის დასრულების დადასტურება',
      completeDeliveryText: 'დარწმუნებული ხართ, რომ გსურთ ამ შეკვეთის მიტანის დასრულება?',
      cancel: 'გაუქმება',
      confirm: 'დადასტურება',
      completing: 'მიმდინარეობს...',
      deliveryCompleted: 'მიტანა დასრულდა',
      error: 'შეცდომა',
      assignedTo: 'კურიერი',
      you: 'თქვენ',
      items: 'პოზიცია',
      orderNumber: 'შეკვეთა',
      totalAmount: 'ჯამი',
      customer: 'კლიენტი',
      phone: 'ტელეფონი',
      scheduled: 'გადადებული',
      cashToCourier: 'ნაღდი ფული კურიერთან',
      otherDishes: 'სხვა კერძები',
      responsibleWorkshop: 'პასუხისმგებელი სახელოსნო',
      entrance: 'შესასვლელი',
      floor: 'სართული',
      apartment: 'ბინა/ოფისი',
      intercom: 'დომოფონი',
      courierComment: 'კომენტარი კურიერისთვის',
      addressDetails: 'მისამართის დეტალები',
      call: 'დარეკვა',
      contactPhone: 'საკონტაქტო ტელეფონი',
      copyAddress: 'მისამართის კოპირება',
      copied: 'კოპირებულია!',
      orderTime: 'შეკვეთის დრო',
      estimatedTime: 'მოსალოდნელი დრო',
      showMore: 'მეტის ჩვენება',
      showLess: 'ნაკლების ჩვენება'
    }
  } as const

  const t = translations[language as Language]

  const currentStatus = statusConfig[order.status] || statusConfig.READY
  const StatusIcon = currentStatus.icon

  const isCurrentCourier = order.delivery?.courier?.id === user?.id
  const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0)

  const formatTime = (dateString: string | Date) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString)
    return date.toLocaleDateString([], { day: 'numeric', month: 'short' })
  }

  const formatAddress = () => {
    const parts = []
    if (order.deliveryAddress) parts.push(order.deliveryAddress)
    if (order.deliveryEntrance) parts.push(`${t.entrance}: ${order.deliveryEntrance}`)
    if (order.deliveryFloor) parts.push(`${t.floor}: ${order.deliveryFloor}`)
    if (order.deliveryApartment) parts.push(`${t.apartment}: ${order.deliveryApartment}`)
    return parts.join(', ')
  }

  const handleAcceptDelivery = async () => {
    if (!user?.id || isUpdating) return

    setIsUpdating(true)
    try {
      const updatedOrder = await OrderService.assignCourierToDelivery(order.id, user.id)
      if (onStatusChange) onStatusChange(updatedOrder)
      toast.success(language === 'ru' ? 'Доставка принята' : 'მიტანა მიღებულია')
    } catch (error) {
      console.error('Failed to accept delivery:', error)
      toast.error(t.error)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleStartDelivery = async () => {
    if (isUpdating) return

    setIsUpdating(true)
    try {
      const updatedOrder = await OrderService.startDelivery(order.id)
      if (onStatusChange) onStatusChange(updatedOrder)
      toast.success(language === 'ru' ? 'Доставка начата' : 'მიტანა დაიწყო')
    } catch (error) {
      console.error('Failed to start delivery:', error)
      toast.error(t.error)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleCompleteDelivery = async () => {
    if (isUpdating) return

    setIsUpdating(true)
    try {
      const updatedOrder = await OrderService.completeDelivery(order.id)
      if (onStatusChange) onStatusChange(updatedOrder)
      toast.success(t.deliveryCompleted)
      setShowCompleteDialog(false)
    } catch (error) {
      console.error('Failed to complete delivery:', error)
      toast.error(t.error)
    } finally {
      setIsUpdating(false)
    }
  }

  const openInMaps = () => {
    if (order.deliveryAddress) {
      const address = encodeURIComponent(order.deliveryAddress)
      window.open(`https://yandex.ru/maps/?text=${address}`, '_blank')
    }
  }

  const handleCall = (phoneNumber: string) => {
    window.location.href = `tel:${phoneNumber}`
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success(t.copied)
  }

  const getPaymentMethodText = () => {
    if (!order.payment) return t.cash
    
    const methods = {
      CASH: t.cash,
      CARD: t.card,
      ONLINE: t.online,
      CASH_TO_COURIER: t.cashToCourier
    }
    return methods[order.payment.method as keyof typeof methods] || order.payment.method
  }

  return (
    <>
      <Card className={cn(
        "group relative overflow-hidden border-l-4 transition-all duration-200 hover:shadow-lg",
        currentStatus.border,
        currentStatus.bg,
        className
      )}>
        {/* Декоративный элемент */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/5 to-transparent rounded-bl-full pointer-events-none" />
        
        <div className="p-4 space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold">#{order.number}</span>
                <Badge className={cn("flex items-center gap-1", currentStatus.badge)}>
                  <StatusIcon className="h-3 w-3" />
                  {currentStatus.label[language as Language]}
                </Badge>
              </div>
              
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{formatDate(order.createdAt)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{formatTime(order.createdAt)}</span>
                </div>
                {order.isScheduled && (
                  <Badge variant="outline" className="bg-yellow-100/50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400">
                    <Clock className="h-3 w-3 mr-1" />
                    {t.scheduled}
                  </Badge>
                )}
              </div>
            </div>

            {/* Courier badge */}
            {order.delivery?.courier && (
              <Badge variant="outline" className={cn(
                "flex items-center gap-1.5 px-3 py-1",
                isCurrentCourier ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400" : ""
              )}>
                <User className="h-3.5 w-3.5" />
                <span className="font-medium">
                  {isCurrentCourier ? t.you : order.delivery.courier.name}
                </span>
              </Badge>
            )}
          </div>

          {/* Customer & Contact Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Customer Info */}
            {order.customer && (
              <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3 border border-gray-100 dark:border-gray-700">
                <div className="text-xs text-muted-foreground mb-1">{t.customer}</div>
                <div className="font-medium">{order.customer.name}</div>
                {order.customer.phone && (
                  <div className="flex items-center gap-2 mt-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCall(order.customer!.phone!)}
                      className="h-7 px-2 text-xs gap-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    >
                      <PhoneCall className="h-3.5 w-3.5" />
                      {order.customer.phone}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Order Phone */}
            {order.phone && !order.customer?.phone && (
              <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3 border border-gray-100 dark:border-gray-700">
                <div className="text-xs text-muted-foreground mb-1">{t.contactPhone}</div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCall(order.phone!)}
                  className="h-7 px-2 text-xs gap-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                >
                  <PhoneCall className="h-3.5 w-3.5" />
                  {order.phone}
                </Button>
              </div>
            )}
          </div>

          {/* Delivery Address */}
          {order.deliveryAddress && (
            <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3 border border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  {t.deliveryAddress}
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(formatAddress())}
                    className="h-7 px-2 text-xs"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={openInMaps}
                    className="h-7 px-2 text-xs"
                  >
                    {t.openInMap}
                  </Button>
                </div>
              </div>
              
              {/* Main Address */}
              <div 
                className="text-sm font-medium cursor-pointer hover:text-primary transition-colors mb-2"
                onClick={openInMaps}
              >
                {order.deliveryAddress}
              </div>

              {/* Address Details Grid */}
              {(order.deliveryEntrance || order.deliveryFloor || order.deliveryApartment || order.deliveryIntercom) && (
                <div className="mt-2 pt-2 border-t border-dashed border-gray-200 dark:border-gray-700">
                  <div className="text-xs font-medium text-muted-foreground mb-2">
                    {t.addressDetails}:
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {order.deliveryEntrance && (
                      <div className="flex items-center gap-1.5">
                        <DoorOpen className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs">{t.entrance}: {order.deliveryEntrance}</span>
                      </div>
                    )}
                    {order.deliveryFloor && (
                      <div className="flex items-center gap-1.5">
                        <Home className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs">{t.floor}: {order.deliveryFloor}</span>
                      </div>
                    )}
                    {order.deliveryApartment && (
                      <div className="flex items-center gap-1.5">
                        <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs">{t.apartment}: {order.deliveryApartment}</span>
                      </div>
                    )}
                    {order.deliveryIntercom && (
                      <div className="flex items-center gap-1.5">
                        <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs">{t.intercom}: {order.deliveryIntercom}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Courier Comment */}
          {order.deliveryCourierComment && (
            <div className="bg-yellow-50/50 dark:bg-yellow-900/10 rounded-lg p-3 border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-center gap-2 text-sm font-medium text-yellow-800 dark:text-yellow-400 mb-1">
                <AlertCircle className="h-4 w-4" />
                {t.courierComment}
              </div>
              <div className="text-sm text-yellow-700 dark:text-yellow-300">
                {order.deliveryCourierComment}
              </div>
            </div>
          )}

          {/* Delivery Notes */}
          {order.deliveryNotes && (
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
              <div className="text-sm font-medium mb-1">{t.deliveryNotes}</div>
              <div className="text-sm text-muted-foreground">
                {order.deliveryNotes}
              </div>
            </div>
          )}

          {/* Delivery Time & Payment */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            {order.deliveryTime && (
              <div className="flex items-center gap-2 text-sm bg-white/50 dark:bg-gray-800/50 rounded-lg px-3 py-1.5 border border-gray-100 dark:border-gray-700">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{t.deliveryTime}:</span>
                <span>{formatTime(order.deliveryTime)}</span>
              </div>
            )}

            <div className="flex items-center gap-2 text-sm bg-white/50 dark:bg-gray-800/50 rounded-lg px-3 py-1.5 border border-gray-100 dark:border-gray-700">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <span>{getPaymentMethodText()}</span>
            </div>

            <div className="flex items-center gap-1 text-sm font-semibold bg-primary/5 rounded-lg px-3 py-1.5">
              <span>{t.totalAmount}:</span>
              <span className="text-primary">{order.totalAmount} ₽</span>
            </div>
          </div>

          {/* Order Items */}
          <details className="group" open={showItems} onToggle={(e) => setShowItems((e.target as HTMLDetailsElement).open)}>
            <summary className="flex items-center justify-between cursor-pointer list-none p-2 bg-white/50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-white/80 transition-colors">
              <span className="flex items-center gap-2 text-sm font-medium">
                <Package className="h-4 w-4 text-muted-foreground" />
                {t.orderComposition} ({order.items.length} {t.items})
              </span>
              <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
            </summary>
            
            <div className="mt-3 space-y-2">
              {order.items.map((item) => (
                <div 
                  key={item.id} 
                  className={cn(
                    "p-3 rounded-lg border transition-all",
                    item.status === 'COMPLETED' 
                      ? "bg-gray-50/50 border-gray-200 dark:bg-gray-800/30 dark:border-gray-700" 
                      : "bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700 hover:shadow-sm"
                  )}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{item.product.title}</span>
                        <Badge variant="outline" className="text-xs">
                          ×{item.quantity}
                        </Badge>
                      </div>
                      
                      {item.additives.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {item.additives.map(additive => (
                            <Badge key={additive.id} variant="secondary" className="text-xs">
                              +{additive.title}
                            </Badge>
                          ))}
                        </div>
                      )}
                      
                      {item.comment && (
                        <div className="mt-1 text-xs text-muted-foreground bg-gray-50 dark:bg-gray-900/30 p-1.5 rounded">
                          💬 {item.comment}
                        </div>
                      )}
                      
                      <div className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
                        <ChefHat className="h-3 w-3" />
                        {item.product.workshops?.[0]?.workshop.name || (language === 'ru' ? 'Не указан' : 'არ არის მითითებული')}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="font-semibold whitespace-nowrap">
                        {(item.product.price * item.quantity).toFixed(2)} ₽
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {item.product.price} ₽ × {item.quantity}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </details>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            {variant === 'available' && !order.delivery?.courier && (
              <Button
                onClick={handleAcceptDelivery}
                disabled={isUpdating}
                className="flex-1 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary"
              >
                {isUpdating ? (
                  <Clock className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Bike className="h-4 w-4 mr-2" />
                )}
                {t.acceptDelivery}
              </Button>
            )}

            {variant === 'active' && isCurrentCourier && (
              <>
                {order.status === 'READY' && (
                  <Button
                    onClick={handleStartDelivery}
                    disabled={isUpdating}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-600"
                  >
                    {isUpdating ? (
                      <Clock className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Bike className="h-4 w-4 mr-2" />
                    )}
                    {t.startDelivery}
                  </Button>
                )}
                
                {order.status === 'DELIVERING' && (
                  <Button
                    onClick={() => setShowCompleteDialog(true)}
                    disabled={isUpdating}
                    className="flex-1 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-600"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {t.completeDelivery}
                  </Button>
                )}
              </>
            )}

            {variant === 'completed' && (
              <div className="w-full text-center text-sm text-muted-foreground py-2">
                ✓ {t.deliveryCompleted}
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Complete Delivery Dialog */}
      <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              {t.completeDeliveryConfirm}
            </DialogTitle>
            <DialogDescription>
              {t.completeDeliveryText}
            </DialogDescription>
          </DialogHeader>
          
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800 my-2">
            <p className="text-sm text-yellow-800 dark:text-yellow-300">
              #{order.number} • {order.totalAmount} ₽ • {formatAddress()}
            </p>
          </div>
          
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowCompleteDialog(false)}
              disabled={isUpdating}
            >
              {t.cancel}
            </Button>
            <Button
              onClick={handleCompleteDelivery}
              disabled={isUpdating}
              className="bg-gradient-to-r from-green-600 to-green-500"
            >
              {isUpdating ? (
                <Clock className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              {isUpdating ? t.completing : t.confirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}