'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { OrderHeader } from '@/components/features/order/OrderHeader'
import { OrderCustomerInfo } from '@/components/features/order/OrderCustomerInfo'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/lib/hooks/useAuth'
import { OrderService, OrderItemStatus, OrderResponse, EnumOrderStatus } from '@/lib/api/order.service'
import { WarehouseService } from '@/lib/api/warehouse.service'
import { toast } from 'sonner'
import { AccessCheck } from '@/components/AccessCheck'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import { Language, useLanguageStore } from '@/lib/stores/language-store'
import { 
  ArrowLeft, 
  Check, 
  Clock, 
  Pause, 
  Play, 
  Salad, 
  Soup, 
  Utensils,
  AlertCircle,
  List,
  MessageSquare,
  Package,
  PackageCheck,
  PackageX,
  Plus
} from 'lucide-react'

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

export default function KitchenOrderPage() {
  const { id: orderId } = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { language } = useLanguageStore()
  const [order, setOrder] = useState<OrderResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [items, setItems] = useState<OrderItemWithStatus[]>([])
  const [isUpdating, setIsUpdating] = useState(false)
  const [writeOffDialogOpen, setWriteOffDialogOpen] = useState(false)
  const [currentItemId, setCurrentItemId] = useState<string | null>(null)
  const [writeOffItems, setWriteOffItems] = useState<WriteOffItem[]>([])
  const [isWritingOff, setIsWritingOff] = useState(false)
  
  const translations = {
    ru: {
      back: "Назад к списку заказов",
      orderComposition: "Состав заказа",
      noDishes: "Нет блюд для приготовления",
      additives: "Модификаторы",
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
      currentStatus: "Текущий статус"
    },
    ka: {
      back: "უკან შეკვეთების სიაში",
      orderComposition: "შეკვეთის შემადგენლობა",
      noDishes: "მომზადებისთვის კერძები არ არის",
      additives: "მოდიფიკატორები",
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
      currentStatus: "მიმდინარე სტატუსი"
    }
  } as const;

  const t = translations[language as Language];

  useEffect(() => {
    if (!orderId) {
      setError('Order ID is missing')
      setLoading(false)
      return
    }

    const fetchOrder = async () => {
      try {
        setLoading(true)
        const data = await OrderService.getById(orderId as string)
        setOrder(data)

        setItems(data.items.map(item => ({
          id: item.id,
          product: {
            title: item.product.title || 'Без названия',
            workshops: item.product.workshops.map(workshopItem => ({
              id: workshopItem.id,
              workshop: {
                id: workshopItem.workshop.id ,
                name: workshopItem.workshop.name
              }
            })),
            ingredients: item.product.ingredients
          },
          quantity: item.quantity,
          additives: item.additives.map(add => ({
            title: add.title || 'Модификатор'
          })),
          comment: item.comment,
          currentStatus: item.status || 'CREATED',
          assignedTo: null
        })))

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Неизвестная ошибка')
        toast.error(t.loadError)
      } finally {
        setLoading(false)
      }
    }

    fetchOrder()
  }, [orderId, t.loadError])

  const getStatusText = (status: OrderItemStatus): string => {
    const statusMap = {
      [OrderItemStatus.CREATED]: t.created,
      [OrderItemStatus.IN_PROGRESS]: t.inProgress,
      [OrderItemStatus.PARTIALLY_DONE]: t.partiallyDoneStatus,
      [OrderItemStatus.PAUSED]: t.paused,
      [OrderItemStatus.COMPLETED]: t.completed,
      [OrderItemStatus.CANCELLED]: t.cancelled,
      [OrderItemStatus.REFUNDED]: t.refunded
    }
    return statusMap[status] || status
  }

  const getStatusIcon = (status: OrderItemStatus) => {
    switch (status) {
      case OrderItemStatus.CREATED:
        return <Package className="h-4 w-4" />;
      case OrderItemStatus.IN_PROGRESS:
        return <Utensils className="h-4 w-4" />;
      case OrderItemStatus.PARTIALLY_DONE:
        return <PackageCheck className="h-4 w-4" />;
      case OrderItemStatus.PAUSED:
        return <Pause className="h-4 w-4" />;
      case OrderItemStatus.COMPLETED:
        return <Check className="h-4 w-4" />;
      case OrderItemStatus.CANCELLED:
      case OrderItemStatus.REFUNDED:
        return <PackageX className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  }

  const handleStartCooking = async (itemId: string) => {
    try {
      const item = items.find(i => i.id === itemId)
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
     toast.error('Ошибка списания')
      await handleStatusChange(currentItemId, OrderItemStatus.IN_PROGRESS)

      toast.success(t.writeOffSuccess)
      setWriteOffDialogOpen(false)
    } catch (error) {
      console.error('Error writing off inventory:', error)
      toast.error(t.writeOffError)
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
  
      await OrderService.updateItemStatus(
        orderId as string,
        itemId,
        { 
          status: newStatus,
          userId: newStatus === 'IN_PROGRESS' ? user.id : undefined
        }
      )
  
      toast.success(`${t.statusUpdated}: ${getStatusText(newStatus)}`)
    } catch (err) {
      setItems(items)
      toast.error(t.statusUpdateError)
      console.error('Error:', err)
    } finally {
      setIsUpdating(false)
    }
  }

  const isAllItemsCOMPLETED = items.every(i => i.currentStatus === 'COMPLETED')
  const isAdmin = user?.role == 'MANAGER' || user?.role == 'SUPERVISOR'
  const availableWorkshops = user?.workshops?.map((workshop: any) => workshop.workshopId) || []

  const filteredItems = isAdmin ? items : items.filter(item => {
    return item.product.workshops.some(workshop => 
      availableWorkshops.includes(workshop.workshop.id))
  })

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-[200px]" />
          <Skeleton className="h-[200px]" />
        </div>
        <Skeleton className="h-[300px]" />
      </div>
    )
  }

  if (error) {
    return (
      <Card className="space-y-6">
        <p className="text-destructive">{error}</p>
        <Button onClick={() => router.push('/kitchen')} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t.back}
        </Button>
      </Card>
    )
  }

  if (!order) {
    return (
      <Card className="space-y-6">
        <p className="text-muted-foreground">{t.orderNotFound}</p>
        <Button onClick={() => router.push('/kitchen')} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t.back}
        </Button>
      </Card>
    )
  }

  return (
    <AccessCheck allowedRoles={['COOK', 'CHEF', 'MANAGER', 'SUPERVISOR']}>
      <div className="space-y-6">
        <Button 
          variant="outline" 
          onClick={() => router.push('/kitchen')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t.back}
        </Button>

        <OrderHeader order={order} />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2 p-4 space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <List className="h-5 w-5" />
              {t.orderComposition}
            </h2>
            {!filteredItems.length && (
              <div className="flex items-center justify-center h-32 text-muted-foreground">
                <Salad className="mr-2 h-5 w-5" />
                {t.noDishes}
              </div>
            )}
            <div className="space-y-4">
              {filteredItems.map(item => (
                <Card key={item.id} className="p-4">  
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <h3 className="font-medium flex items-center gap-2">
                        {item.product.title.includes('Салат') ? (
                          <Salad className="h-4 w-4 text-green-600" />
                        ) : item.product.title.includes('Суп') ? (
                          <Soup className="h-4 w-4 text-orange-600" />
                        ) : (
                          <Utensils className="h-4 w-4" />
                        )}
                        {item.product.title} × {item.quantity}
                      </h3>
                      
                      {item.additives.length > 0 && (
                        <div className="text-sm text-muted-foreground mt-1 flex items-center">
                          <Plus className="h-3 w-3 mr-1" />
                          {t.additives}: {item.additives.map(a => a.title).join(', ')}
                        </div>
                      )}
                      
                      {item.comment && (
                        <div className="text-sm text-muted-foreground mt-1 flex items-center">
                          <MessageSquare className="h-3 w-3 mr-1" />
                          {t.comment}: {item.comment}
                        </div>
                      )}

                      <div className="mt-2 space-x-2">
                        {item.product.workshops.map(workshop => (
                          <Badge variant="outline" key={workshop.workshop.id}>
                            {workshop.workshop.name}
                          </Badge>
                        ))}
                      </div>
                      
                      <div className="mt-3 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <span>{t.currentStatus}:</span>
                          <Badge variant="secondary" className="flex items-center gap-1">
                            {getStatusIcon(item.currentStatus)}
                            {getStatusText(item.currentStatus)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex flex-wrap gap-2 justify-end">
                        {item.currentStatus === 'CREATED' && (
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleStartCooking(item.id)}
                            disabled={isUpdating}
                          >
                            <Play className="mr-2 h-4 w-4" />
                            {t.startCooking}
                          </Button>
                        )}
                        
                        {item.currentStatus === 'IN_PROGRESS' && (
                          <>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleStatusChange(item.id, OrderItemStatus.PARTIALLY_DONE)}
                              disabled={isUpdating}
                            >
                              <Clock className="mr-2 h-4 w-4" />
                              {t.partiallyDone}
                            </Button>
                            
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusChange(item.id, OrderItemStatus.PAUSED)}
                              disabled={isUpdating}
                            >
                              <Pause className="mr-2 h-4 w-4" />
                              {t.pause}
                            </Button>
                          </>
                        )}
                        
                        {item.currentStatus === 'PARTIALLY_DONE' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusChange(item.id, OrderItemStatus.PAUSED)}
                              disabled={isUpdating}
                            >
                              <Pause className="mr-2 h-4 w-4" />
                              {t.pause}
                            </Button>
                          </>
                        )}
                        
                        {item.currentStatus === 'PAUSED' && (
                          <>
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleStatusChange(item.id, OrderItemStatus.IN_PROGRESS)}
                              disabled={isUpdating}
                            >
                              <Play className="mr-2 h-4 w-4" />
                              {t.startCooking}
                            </Button>
                            
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleStatusChange(item.id, OrderItemStatus.PARTIALLY_DONE)}
                              disabled={isUpdating}
                            >
                              <Clock className="mr-2 h-4 w-4" />
                              {t.partiallyDone}
                            </Button>
                          </>
                        )}
                        
                        {(item.currentStatus === 'IN_PROGRESS' || 
                          item.currentStatus === 'PARTIALLY_DONE' || 
                          item.currentStatus === 'PAUSED') && (
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleStatusChange(item.id, OrderItemStatus.COMPLETED)}
                            disabled={isUpdating}
                          >
                            <Check className="mr-2 h-4 w-4" />
                            {t.ready}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </Card>

          <div className="space-y-4">
            {order.customer && (
              <Card className="p-4">
                <OrderCustomerInfo customer={order.customer} />
              </Card>
            )}

            <Card className="p-4">
              <h3 className="font-medium mb-2 flex items-center gap-2">
                <Package className="h-5 w-5" />
                {t.orderInfo}
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t.orderNumber}:</span>
                  <span>#{order.number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t.date}:</span>
                  <span>
                    {new Date(order.createdAt).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t.orderStatus}:</span>
                  <span className="capitalize">
                    {order.status.toLowerCase()}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

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
    </AccessCheck>
  )
}