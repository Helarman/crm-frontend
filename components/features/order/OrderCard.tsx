'use client'

import { useState, useRef, useEffect, MouseEvent } from 'react'
import { OrderHeader } from './OrderHeader'
import { OrderItemsList } from './OrderItemsList'
import { OrderCustomerInfo } from './OrderCustomerInfo'
import { OrderActions } from './OrderActions'
import { OrderPaymentStatus } from './OrderPaymentStatus'
import { Card } from '@/components/ui/card'
import { OrderResponse, OrderItemStatus, OrderService } from '@/lib/api/order.service'
import { cn } from '@/lib/utils'
import { Language, useLanguageStore } from '@/lib/stores/language-store'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronUp, Check, Play, Pause, Clock, Utensils, Package, AlertCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useAuth } from '@/lib/hooks/useAuth'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { WarehouseService } from '@/lib/api/warehouse.service'
import { Skeleton } from '@/components/ui/skeleton'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Payment } from '@/lib/api/payment.service'

type OrderItemWithStatus = {
  id: string
  product: {
    title: string
    workshops: {
      workshop: {
        name: string
        id: string
      }
      id: string
    }[]
    ingredients: {
      inventoryItemId: string
      quantity: number
    }[]
  }
  quantity: number
  additives: {
    title: string
  }[]
  comment?: string
  currentStatus: OrderItemStatus
  assignedTo?: {
    id: string
    name: string
  } | null
}

type WriteOffItem = {
  id: string
  name: string
  quantity: number
  unit: string
}

interface Ingredient {
  inventoryItemId: string;
  quantity: number;
  inventoryItem?: {
    name: string;
    unit: string;
  };
}


const statusColors = {
  CREATED: {
    border: 'border-l-amber-500',
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    itemBorder: 'border-amber-200 dark:border-amber-800'
  },
  CONFIRMED: {
    border: 'border-l-blue-500',
    bg: 'bg-blue-50 dark:bg-blue-900/60',
    itemBorder: 'border-blue-200 dark:border-blue-800'
  },
  PREPARING: {
    border: 'border-l-purple-500',
    bg: 'bg-purple-50 dark:bg-purple-900/60',
    itemBorder: 'border-purple-200 dark:border-purple-800'
  },
  READY: {
    border: 'border-l-green-500',
    bg: 'bg-green-50 dark:bg-green-900/60',
    itemBorder: 'border-green-200 dark:border-green-800'
  },
  DELIVERING: {
    border: 'border-l-cyan-500',
    bg: 'bg-cyan-50 dark:bg-cyan-900/60',
    itemBorder: 'border-cyan-200 dark:border-cyan-800'
  },
  COMPLETED: {
    border: 'border-l-gray-500',
    bg: 'bg-gray-100 dark:bg-gray-900/60',
    itemBorder: 'border-gray-200 dark:border-gray-800'
  },
  CANCELLED: {
    border: 'border-l-red-500',
    bg: 'bg-red-50 dark:bg-red-900/60',
    itemBorder: 'border-red-200 dark:border-red-800'
  }
}

const MAX_VISIBLE_ITEMS = 3

const getStatusText = (status: OrderItemStatus, language: string): string => {
  const translations = {
    ru: {
      [OrderItemStatus.CREATED]: 'Создан',
      [OrderItemStatus.IN_PROGRESS]: 'В процессе',
      [OrderItemStatus.PARTIALLY_DONE]: 'Частично готов',
      [OrderItemStatus.PAUSED]: 'На паузе',
      [OrderItemStatus.COMPLETED]: 'Готов',
      [OrderItemStatus.CANCELLED]: 'Отменен',
      [OrderItemStatus.REFUNDED]: 'Возвращен'
    },
    ka: {
      [OrderItemStatus.CREATED]: 'შექმნილი',
      [OrderItemStatus.IN_PROGRESS]: 'მუშავდება',
      [OrderItemStatus.PARTIALLY_DONE]: 'ნაწილობრივ მზადაა',
      [OrderItemStatus.PAUSED]: 'პაუზაზეა',
      [OrderItemStatus.COMPLETED]: 'მზადაა',
      [OrderItemStatus.CANCELLED]: 'გაუქმებული',
      [OrderItemStatus.REFUNDED]: 'დაბრუნებული'
    }
  }
  return translations[language as 'ru' | 'ka'][status] || status
}

export function OrderCard({ order, variant = 'default', onStatusChange, className }: {
  order: OrderResponse
  variant?: 'default' | 'kitchen' | 'delivery'
  onStatusChange?: (updatedOrder: OrderResponse) => void
  className?: string
}) {
  const router = useRouter()
  const { user } = useAuth()
  const { language } = useLanguageStore()
  const totalAmount = order.totalAmount
  const [showAllItems, setShowAllItems] = useState(false)
  const [contentHeight, setContentHeight] = useState(0)
  const [isUpdating, setIsUpdating] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  const [writeOffDialogOpen, setWriteOffDialogOpen] = useState(false)
  const [currentItemId, setCurrentItemId] = useState<string | null>(null)
  const [writeOffItems, setWriteOffItems] = useState<WriteOffItem[]>([])
  const [isWritingOff, setIsWritingOff] = useState(false)
  const [items, setItems] = useState<OrderItemWithStatus[]>([])

   const orderId = order.id;

   const translations = {
      ru: {
        back: "Назад к списку заказов",
        orderComposition: "Состав заказа",
        noDishes: "Нет блюд для приготовления",
        additives: "Добавки",
        comment: "Комментарий",
        orderInfo: "Информация о заказе",
        orderNumber: "Номер заказа",
        date: "Дата",
        orderStatus: "Статус заказа",
        startCooking: "В работу",
        partiallyDone: "Частично готово",
        pause: "Пауза",
        ready: "Готово",
        writeOffTitle: "Списание ингредиентов",
        writeOffText: "Будут списаны следующие ингредиенты:",
        cancel: "Отмена",
        confirmWriteOff: "Подтвердить списание",
        writingOff: "Списание...",
        statusUpdated: "Статус обновлён",
        writeOffSuccess: "Ингредиенты списаны, статус обновлён",
        writeOffError: "Ошибка при списании ингредиентов",
        statusUpdateError: "Ошибка обновления статуса",
        loadError: "Не удалось загрузить заказ",
        unknownError: "Неизвестная ошибка",
        orderNotFound: "Заказ не найден",
        ingredientsError: "Не удалось получить информацию об ингредиентах",
        created: "Создан",
        inProgress: "В процессе",
        partiallyDoneStatus: "Частично готов",
        paused: "На паузе",
        completed: "Готов",
        cancelled: "Отменен",
        refunded: "Возвращен",
        assignedTo: "Ответственный",
        you: "Вы",
        currentStatus: "Текущий статус",
        loading: "Загрузка..",
        deliveryAddress: "Адрес доставки",
        openInMap: "Открыть в картах"
      },
      ka: {
        back: "უკან შეკვეთების სიაში",
        orderComposition: "შეკვეთის შემადგენლობა",
        noDishes: "მომზადებისთვის კერძები არ არის",
        additives: "დანამატები",
        comment: "კომენტარი",
        orderInfo: "შეკვეთის ინფორმაცია",
        orderNumber: "შეკვეთის ნომერი",
        date: "თარიღი",
        orderStatus: "შეკვეთის სტატუსი",
        startCooking: "სამუშაოდ",
        partiallyDone: "ნაწილობრივ მზადაა",
        pause: "პაუზა",
        ready: "მზადაა",
        writeOffTitle: "ინგრედიენტების ჩამოწერა",
        writeOffText: "შემდეგი ინგრედიენტები ჩაიწერება:",
        cancel: "გაუქმება",
        confirmWriteOff: "ჩამოწერის დადასტურება",
        writingOff: "იწერება...",
        statusUpdated: "სტატუსი განახლდა",
        writeOffSuccess: "ინგრედიენტები ჩაიწერა, სტატუსი განახლდა",
        writeOffError: "ინგრედიენტების ჩამოწერის შეცდომა",
        statusUpdateError: "სტატუსის განახლების შეცდომა",
        loadError: "შეკვეთის ჩატვირთვა ვერ მოხერხდა",
        unknownError: "უცნობი შეცდომა",
        orderNotFound: "შეკვეთა ვერ მოიძებნა",
        ingredientsError: "ინგრედიენტების მონაცემების მიღება ვერ მოხერხდა",
        created: "შექმნილი",
        inProgress: "მუშავდება",
        partiallyDoneStatus: "ნაწილობრივ მზადაა",
        paused: "პაუზაზეა",
        completed: "მზადაა",
        cancelled: "გაუქმებული",
        refunded: "დაბრუნებული",
        assignedTo: "პასუხისმგებელი",
        you: "თქვენ",
        currentStatus: "მიმდინარე სტატუსი",
        loading: "იტვირთება..",
        deliveryAddress: "მიტანის მისამართი",
        openInMap: "გახსნა რუკაზე"
      }
    } as const;
  
  const t = translations[language as Language];
  

  const currentStatusStyle = statusColors[order.status] || statusColors.CREATED
  
  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(showAllItems 
        ? contentRef.current.scrollHeight 
        : Math.min(contentRef.current.scrollHeight, MAX_VISIBLE_ITEMS * 64)
      )
    }
    
  }, [showAllItems, order.items])

  useEffect(() => {
    if (order) {
      setItems(order.items.map(item => ({
        id: item.id,
        product: {
          title: item.product.title || 'Без названия',
          workshops: item.product.workshops,
          ingredients: item.product.ingredients || []
        },
        quantity: item.quantity,
        additives: item.additives.map(add => ({
          title: add.name || 'Добавка'
        })),
        comment: item.comment,
        currentStatus: item.status || 'CREATED',
        assignedTo: item.user ? {
          id: item.user.id,
          name: item.user.name || 'Повар'
        } : null
      })))
    }
  }, [order]) 

  const hasHiddenItems = order.items.length > MAX_VISIBLE_ITEMS

  const handleCardClick = () => {
    const routePath = `/orders/${order.id}`
    if(variant === 'default' ){ 
        router.push(routePath)
    } 
  }

  const handleButtonClick = (e: MouseEvent) => {
    e.stopPropagation()
  }

  
  const handleStartCooking = async (itemId: string) => {
    try {
      const item = order.items.find(i => i.id === itemId)
      
      if (!item) return
      const ingredientsToWriteOff = await Promise.all(
        item.product.ingredients.map(async (ingredient: Ingredient) => {
          try {
            return {
              id: ingredient.inventoryItemId,
              name: ingredient.inventoryItem?.name || t.unknownError,
              quantity: ingredient.quantity * item.quantity,
              unit: ingredient.inventoryItem?.unit || 'ც.'
            }
          } catch (error) {
            console.error(`Error processing ingredient ${ingredient.inventoryItemId}:`, error)
            return null
          }
        })
      )

      const validIngredients = ingredientsToWriteOff.filter(Boolean) as WriteOffItem[]
      
      if (validIngredients.length === 0) {
        toast.warning(t.ingredientsError)
        return
      }
      setWriteOffItems(validIngredients)
      setCurrentItemId(itemId)
      setWriteOffDialogOpen(true)
    } catch (error) {
      console.error('Error preparing write-off:', error)
      toast.error(t.writeOffError)
    }
  }

  const handleConfirmWriteOff = async () => {
  if (!currentItemId) return

  setIsWritingOff(true)
    try {
      await Promise.all(
        writeOffItems.map(item => 
          WarehouseService.writeOffInventory(item.id, {
            quantity: item.quantity,
            reason: `Списание при приготовлении заказа #${order?.number}`
          })
        )
      )

      // Получаем обновленный заказ после изменения статуса
      const updatedOrder = await handleStatusChange(currentItemId, OrderItemStatus.IN_PROGRESS)

      toast.success(t.writeOffSuccess)
      setWriteOffDialogOpen(false)
      return updatedOrder
    } catch (error) {
      console.error('Error writing off inventory:', error)
      toast.error(t.writeOffError)
      throw error
    } finally {
      setIsWritingOff(false)
    }
  }

  const handleStatusChange = async (itemId: string, newStatus: OrderItemStatus) => {
  if (!orderId || !user?.id || isUpdating) return

  try {
    setIsUpdating(true)
    
    const updatedItems = items.map(item => 
      item.id === itemId 
        ? { 
            ...item, 
            currentStatus: newStatus,
            assignedTo: newStatus === 'IN_PROGRESS' ? { id: user.id, name: user.name } : item.assignedTo
          } 
        : item
    )
    setItems(updatedItems)

    // Обновляем статус на сервере и получаем обновленный заказ
    const updatedOrder = await OrderService.updateItemStatus(
      orderId as string,
      itemId,
      { 
        status: newStatus,
        userId: newStatus === 'IN_PROGRESS' ? user.id : undefined
      }
    )

    // Вызываем колбэк с обновленным заказом
    if (onStatusChange) {
      onStatusChange(updatedOrder)
    }

    toast.success(`${t.statusUpdated}`)
    return updatedOrder
  } catch (err) {
    // В случае ошибки возвращаем предыдущее состояние
    setItems(items)
    toast.error(t.statusUpdateError)
    console.error('Error:', err)
    throw err
  } finally {
    setIsUpdating(false)
  }
  }
    
  const renderItemStatusControls = (item: OrderResponse['items'][0]) => {
    if (variant !== 'kitchen') return null

    return (
      <div className="flex flex-wrap gap-1 mt-2">
        {item.status === OrderItemStatus.CREATED && (
          <Button
            
            variant="default"
            onClick={() => handleStartCooking(item.id)}
            disabled={isUpdating}
            className="h-7"
          >
            <Play className="mr-1 h-3 w-3" />
            {language === 'ru' ? 'Начать' : 'დაწყება'}
          </Button>
        )}
        
        {item.status === OrderItemStatus.IN_PROGRESS && (
          <>
            <Button
              
              variant="secondary"
              onClick={() => handleStatusChange(item.id, OrderItemStatus.PARTIALLY_DONE)}
              disabled={isUpdating}
              className="h-7"
            >
              <Clock className="mr-1 h-3 w-3" />
              {language === 'ru' ? 'Частично' : 'ნაწილობრივ'}
            </Button>
            
            <Button
              
              variant="outline"
              onClick={() => handleStatusChange(item.id, OrderItemStatus.PAUSED)}
              disabled={isUpdating}
              className="h-7"
            >
              <Pause className="mr-1 h-3 w-3" />
              {language === 'ru' ? 'Пауза' : 'პაუზა'}
            </Button>
          </>
        )}
        
        {item.status === OrderItemStatus.PARTIALLY_DONE && (
          <Button
            
            variant="outline"
            onClick={() => handleStatusChange(item.id, OrderItemStatus.PAUSED)}
            disabled={isUpdating}
            className="h-7"
          >
            <Pause className="mr-1 h-3 w-3" />
            {language === 'ru' ? 'Пауза' : 'პაუზა'}
          </Button>
        )}
        
        {item.status === OrderItemStatus.PAUSED && (
          <>
            <Button
              
              variant="default"
              onClick={() => handleStatusChange(item.id, OrderItemStatus.IN_PROGRESS)}
              disabled={isUpdating}
              className="h-7"
            >
              <Play className="mr-1 h-3 w-3" />
              {language === 'ru' ? 'Продолжить' : 'გაგრძელება'}
            </Button>
            
            <Button
              
              variant="secondary"
              onClick={() => handleStatusChange(item.id, OrderItemStatus.PARTIALLY_DONE)}
              disabled={isUpdating}
              className="h-7"
            >
              <Clock className="mr-1 h-3 w-3" />
              {language === 'ru' ? 'Частично' : 'ნაწილობრივ'}
            </Button>
          </>
        )}
        
        {(item.status === OrderItemStatus.IN_PROGRESS || 
          item.status === OrderItemStatus.PARTIALLY_DONE || 
          item.status === OrderItemStatus.PAUSED) && (
          <Button
            
            variant="default"
            onClick={() => handleStatusChange(item.id, OrderItemStatus.COMPLETED)}
            disabled={isUpdating}
            className="h-7"
          >
            <Check className="mr-1 h-3 w-3" />
            {language === 'ru' ? 'Готово' : 'მზადაა'}
          </Button>
        )}
      </div>
    )
  }

  return (
    <div>
    <Card 
      className={cn(
        "flex flex-col h-full relative overflow-hidden",
        "border-l-4 cursor-pointer transition-all hover:shadow-md",
        currentStatusStyle.border,
        currentStatusStyle.bg,
        className
      )}
      onClick={handleCardClick}
    >
      <div className="absolute top-0 left-0 w-full h-1" />
      
      <div className="flex flex-col flex-grow pt-1">
        <OrderHeader order={order} compact={variant === 'kitchen'}  />
        
        <div className="p-3 space-y-3">
          <div
            ref={contentRef}
            className="overflow-hidden transition-all duration-300 ease-in-out"
            style={{ maxHeight: `${contentHeight}px` }}
          >
            {isUpdating ?
              (
                <div>
                  {t.loading}
                </div>
              ) :
              (
                <div>
                  {order.items.map(item => (
                  <div 
                    key={item.id} 
                    className={cn(
                      "mb-2 last:mb-0 p-2 rounded-lg border",
                      currentStatusStyle.itemBorder,
                      "transition-colors hover:bg-opacity-90"
                    )}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium flex items-center gap-1">
                          {item.product.title} × {item.quantity}
                        </div>
                        {item.additives.length > 0 && (
                          <div className="text-xs text-muted-foreground">
                            {language === 'ru' ? 'Добавки:' : 'დანამატები:'} {item.additives.map(a => a.name).join(', ')}
                          </div>
                        )}
                        {item.comment && (
                          <div className="text-xs text-muted-foreground">
                            {language === 'ru' ? 'Коммент:' : 'კომენტარი:'} {item.comment}
                          </div>
                        )}
                      </div>
                      <Badge 
                        variant="outline" 
                        className="text-xs"
                      >
                        {getStatusText(item.status, language)}
                      </Badge>
                    </div>
                    
                    {renderItemStatusControls(item)}
                  </div>
                ))}
              </div>
              )
            }
          </div>

          {hasHiddenItems && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-sm text-muted-foreground hover:text-primary"
              onClick={(e) => {
                e.stopPropagation()
                setShowAllItems(!showAllItems)
              }}
            >
              {showAllItems ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-1" />
                  {language === 'ru' ? 'Скрыть' : 'დამალვა'}
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-1" />
                  {language === 'ru' 
                    ? `Показать ещё ${order.items.length - MAX_VISIBLE_ITEMS}` 
                    : `ნაჩვენებია კიდევ ${order.items.length - MAX_VISIBLE_ITEMS}`}
                </>
              )}
            </Button>
          )}
          
          {variant === 'default' && (order.scheduledAt || order.customer) ? (
            <div className='border-t pt-2'>
              {order.customer && variant === 'default' && (
                <OrderCustomerInfo customer={order.customer} compact />
              )}
              {order.scheduledAt &&
                <Badge 
                  variant="outline"
                  className="flex items-center gap-1 px-2 py-1 rounded-md border text-sm font-medium"
                >
                  {language === 'ru' ? 'Отложено до' : 'გადაიდო'}
                  <span className="text-sm">
                    {format(new Date(order.scheduledAt), 'HH:mm')}
                  </span>
                </Badge>
              }
            </div>
          ) : null}
          

         {variant === 'default' && ( <div className="flex justify-between items-center border-t pt-2">
            <div className="font-medium text-sm">
              {language === 'ru' ? 'Итого:' : 'სულ:'}
            </div>
            <div className="font-bold">
              {totalAmount.toFixed(2)}{language === 'ru' ? '₽' : '₽'}
            </div>
          </div>)}

          {variant === 'default' && order.payment && (
            <OrderPaymentStatus payment={order.payment} order={order} compact />
          )}
        </div>
      </div>

      <div onClick={handleButtonClick}>
        <OrderActions 
          order={order} 
          variant={variant}
          compact={variant === 'kitchen'}
        />
      </div>
    </Card>
     <Dialog open={writeOffDialogOpen} onOpenChange={setWriteOffDialogOpen}>

        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              {t.writeOffTitle}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              {t.writeOffText}
            </p>
            <ul className="space-y-2">
              {writeOffItems.map((item, index) => (
                <li key={index} className="flex justify-between items-center p-2 bg-muted/50 rounded">
                  <span>{item.name}</span>
                  <span className="font-medium">
                    {item.quantity} {item.unit}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setWriteOffDialogOpen(false)} 
              disabled={isWritingOff}
            >
              {t.cancel}
            </Button>
            <Button 
              onClick={handleConfirmWriteOff} 
              disabled={isWritingOff}
            >
              {isWritingOff ? (
                <>
                  <Clock className="mr-2 h-4 w-4 animate-spin" />
                  {t.writingOff}
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  {t.confirmWriteOff}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}