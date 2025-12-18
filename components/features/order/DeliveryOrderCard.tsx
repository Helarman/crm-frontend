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
import { MapPin, Clock, CheckCircle, User, CreditCard, Package, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DeliveryOrderCardProps {
  order: OrderResponse
  variant: 'available' | 'active' | 'completed'
  onStatusChange?: (updatedOrder: OrderResponse) => void
  className?: string
}

type StatusColors = Record<EnumOrderStatus, {
  border: string
  bg: string
}>

const statusColors: StatusColors = {
  [EnumOrderStatus.CREATED]: {
    border: 'border-l-gray-400',
    bg: 'bg-gray-50 dark:bg-gray-900/20',
  },
  [EnumOrderStatus.CONFIRMED]: {
    border: 'border-l-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
  },
  [EnumOrderStatus.PREPARING]: {
    border: 'border-l-orange-500',
    bg: 'bg-orange-50 dark:bg-orange-900/20',
  },
  [EnumOrderStatus.READY]: {
    border: 'border-l-green-500',
    bg: 'bg-green-50 dark:bg-green-900/20',
  },
  [EnumOrderStatus.DELIVERING]: {
    border: 'border-l-blue-500',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
  },
  [EnumOrderStatus.COMPLETED]: {
    border: 'border-l-gray-500',
    bg: 'bg-gray-50 dark:bg-gray-900/20',
  },
  [EnumOrderStatus.CANCELLED]: {
    border: 'border-l-red-500',
    bg: 'bg-red-50 dark:bg-red-900/20',
  }
}


export function DeliveryOrderCard({ order, variant, onStatusChange, className }: DeliveryOrderCardProps) {
  const { user } = useAuth()
  const { language } = useLanguageStore()
  const [isUpdating, setIsUpdating] = useState(false)
  const [showCompleteDialog, setShowCompleteDialog] = useState(false)
  const [showItems, setShowItems] = useState(false)

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
      responsibleWorkshop: 'Ответственный цех'
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
      responsibleWorkshop: 'პასუხისმგებელი სახელოსნო'
    }
  } as const

  const t = translations[language as Language]

  const currentStatusStyle = statusColors[order.status] || statusColors.READY

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

  const getPaymentMethodText = () => {
    if (!order.payment) return t.cash // По умолчанию наличные
    
    const methods = {
      CASH: t.cash,
      CARD: t.card,
      ONLINE: t.online,
      CASH_TO_COURIER: t.cashToCourier
    }
    return methods[order.payment.method as keyof typeof methods] || order.payment.method
  }

  const isCurrentCourier = order.delivery?.courier?.id === user?.id
  const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0)

  const formatTime = (dateString: string | Date) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <>
      <Card className={cn(
        "p-4 relative overflow-hidden border-l-4",
        currentStatusStyle.border,
        currentStatusStyle.bg,
        className
      )}>
        <div className="flex justify-between items-start mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold">#{order.number}</span>
              <Badge variant="secondary">
                {totalItems} {t.items}
              </Badge>
              {order.isScheduled && (
                <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                  <Clock className="h-3 w-3 mr-1" />
                  {t.scheduled}
                </Badge>
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              {new Date(order.createdAt).toLocaleTimeString()}
            </div>
          </div>
          
          {order.delivery?.courier && (
            <Badge variant="outline" className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {isCurrentCourier ? t.you : order.delivery.courier.name}
            </Badge>
          )}
        </div>

        {/* Customer Info */}
        {order.customer && (
          <div className="mb-3 p-2 bg-white dark:bg-gray-800 rounded border">
            <div className="text-sm font-medium">{t.customer}: {order.customer.name}</div>
            {order.customer.phone && (
              <div className="text-sm text-muted-foreground">
                {t.phone}: {order.customer.phone}
              </div>
            )}
          </div>
        )}

        {/* Delivery Address */}
        {order.deliveryAddress && (
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2 text-sm font-medium">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                {t.deliveryAddress}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={openInMaps}
                className="h-6 px-2 text-xs"
              >
                {t.openInMap}
              </Button>
            </div>
            <div className="text-sm text-muted-foreground pl-6">
              {order.deliveryAddress}
            </div>
          </div>
        )}

        {/* Delivery Notes */}
        {order.deliveryNotes && (
          <div className="mb-3">
            <div className="text-sm font-medium mb-1">{t.deliveryNotes}</div>
            <div className="text-sm text-muted-foreground bg-white dark:bg-gray-800 p-2 rounded border">
              {order.deliveryNotes}
            </div>
          </div>
        )}

        {/* Delivery Time */}
        {order.deliveryTime && (
          <div className="mb-3 flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{t.deliveryTime}:</span>
            <span>{formatTime(order.deliveryTime)}</span>
          </div>
        )}

        {/* Payment Method & Total */}
        <div className="mb-3 flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-muted-foreground" />
            <span>{getPaymentMethodText()}</span>
          </div>
          <div className="font-semibold">
            {t.totalAmount}: {order.totalAmount} ₽
          </div>
        </div>

        {/* Order Items */}
        <div className="mb-4">
          <details className="group" open={showItems} onToggle={(e) => setShowItems((e.target as HTMLDetailsElement).open)}>
            <summary className="flex items-center justify-between cursor-pointer list-none text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                {t.orderComposition} ({order.items.length})
              </span>
              <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
            </summary>
            <div className="mt-2 space-y-2">
              {order.items.map((item) => (
                <div 
                  key={item.id} 
                  className={cn(
                    "p-2 rounded-lg border border-dashed border-gray-300 py-4",
                    item.status === 'COMPLETED' ? "opacity-50" : "opacity-70"
                  )}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium flex items-center gap-1">
                        {item.product.title} × {item.quantity}
                      </div>
                      {item.additives.length > 0 && (
                        <div className="text-xs text-muted-foreground">
                          {language === 'ru' ? 'Модификаторы:' : 'მოდიფიკატორები:'} {item.additives.map(a => a.title).join(', ')}
                        </div>
                      )}
                      {item.comment && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {item.comment}
                        </div>
                      )}
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {(item.product.price * item.quantity).toFixed(2)} ₽
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {t.responsibleWorkshop}: {item.product.workshops?.[0]?.workshop.name || (language === 'ru' ? 'Не указан' : 'არ არის მითითებული')}
                  </div>
                </div>
              ))}
            </div>
          </details>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {variant === 'available' && !order.delivery?.courier && (
            <Button
              onClick={handleAcceptDelivery}
              disabled={isUpdating}
              className="flex-1"
            >
              {isUpdating ? (
                <Clock className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {t.acceptDelivery}
            </Button>
          )}

          {variant === 'active' && isCurrentCourier && (
            <>
              {order.status === 'READY' && (
                <Button
                  onClick={handleStartDelivery}
                  disabled={isUpdating}
                  className="flex-1"
                >
                  {isUpdating ? (
                    <Clock className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  {t.startDelivery}
                </Button>
              )}
              
              {order.status === 'DELIVERING' && (
                <Button
                  onClick={() => setShowCompleteDialog(true)}
                  disabled={isUpdating}
                  className="flex-1"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {t.completeDelivery}
                </Button>
              )}
            </>
          )}
        </div>
      </Card>

      {/* Complete Delivery Dialog */}
      <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.completeDeliveryConfirm}</DialogTitle>
            <DialogDescription>
              {t.completeDeliveryText}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
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