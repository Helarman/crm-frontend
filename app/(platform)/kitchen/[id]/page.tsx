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
  inventoryItem?: {  // Make it optional if it might be missing
    name: string;
    unit: string;
  };
}

export default function KitchenOrderPage() {
  const { id: orderId } = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [order, setOrder] = useState<OrderResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [items, setItems] = useState<OrderItemWithStatus[]>([])
  const [isUpdating, setIsUpdating] = useState(false)
  const [writeOffDialogOpen, setWriteOffDialogOpen] = useState(false)
  const [currentItemId, setCurrentItemId] = useState<string | null>(null)
  const [writeOffItems, setWriteOffItems] = useState<WriteOffItem[]>([])
  const [isWritingOff, setIsWritingOff] = useState(false)

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

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Неизвестная ошибка')
        toast.error('Не удалось загрузить заказ')
      } finally {
        setLoading(false)
      }
    }

    fetchOrder()
  }, [orderId])

  const getStatusText = (status: OrderItemStatus): string => {
    const statusMap = {
      [OrderItemStatus.CREATED]: 'Создан',
      [OrderItemStatus.IN_PROGRESS]: 'В процессе',
      [OrderItemStatus.PARTIALLY_DONE]: 'Частично готов',
      [OrderItemStatus.PAUSED]: 'На паузе',
      [OrderItemStatus.COMPLETED]: 'Готов',
      [OrderItemStatus.CANCELLED]: 'Отменен',
      [OrderItemStatus.REFUNDED]: 'Возвращен'
    }
    return statusMap[status] || status
  }
  
 const handleStartCooking = async (itemId: string) => {
  try {
    const item = items.find(i => i.id === itemId)
    if (!item) return

    // Получаем данные об ингредиентах для списания
    const ingredientsToWriteOff = await Promise.all(
      item.product.ingredients.map(async (ingredient : Ingredient) => {
        try {
          return {
            id: ingredient.inventoryItemId,
            name: ingredient.inventoryItem?.name || 'Неизвестный ингредиент',
            quantity: ingredient.quantity * item.quantity,
            unit: ingredient.inventoryItem?.unit || 'шт'
          }
        } catch (error) {
          console.error(`Error processing ingredient ${ingredient.inventoryItemId}:`, error)
          return null
        }
      })
    )

    // Фильтруем null значения (если были ошибки)
    const validIngredients = ingredientsToWriteOff.filter(Boolean) as WriteOffItem[]
    
    if (validIngredients.length === 0) {
      toast.warning('Не удалось получить информацию об ингредиентах')
      return
    }

    setWriteOffItems(validIngredients)
    setCurrentItemId(itemId)
    setWriteOffDialogOpen(true)
  } catch (error) {
    console.error('Error preparing write-off:', error)
    toast.error('Ошибка при подготовке списания')
  }
}

  const handleConfirmWriteOff = async () => {
    if (!currentItemId) return

    setIsWritingOff(true)
    try {
      // Сначала списываем ингредиенты
      await Promise.all(
        writeOffItems.map(item => 
          WarehouseService.writeOffInventory(item.id, {
            quantity: item.quantity,
            reason: `Списание при приготовлении заказа #${order?.number}`
          })
        )
      )

      // Затем меняем статус на "В работе"
      await handleStatusChange(currentItemId, OrderItemStatus.IN_PROGRESS)

      toast.success('Ингредиенты списаны, статус обновлён')
      setWriteOffDialogOpen(false)
    } catch (error) {
      console.error('Error writing off inventory:', error)
      toast.error('Ошибка при списании ингредиентов')
    } finally {
      setIsWritingOff(false)
    }
  }

  const handleStatusChange = async (itemId: string, newStatus: OrderItemStatus) => {
    if (!orderId || !user?.id || isUpdating) return
  
    try {
      setIsUpdating(true)
      
      // Оптимистичное обновление UI
      const updatedItems = items.map(item => 
        item.id === itemId 
          ? { 
              ...item, 
              currentStatus: newStatus,
              assignedTo: newStatus === 'IN_PROGRESS' ? { id: user.id, name: user.name } : null
            } 
          : item
      )
      setItems(updatedItems)
  
      // Отправка запроса
      await OrderService.updateItemStatus(
        orderId as string,
        itemId,
        { 
          status: newStatus,
          userId: newStatus === 'IN_PROGRESS' ? user.id : undefined
        }
      )
  
      toast.success(`Статус обновлён: ${getStatusText(newStatus)}`)
    } catch (err) {
      // Откат при ошибке
      setItems(items)
      toast.error('Ошибка обновления статуса')
      console.error('Ошибка:', err)
    } finally {
      setIsUpdating(false)
    }
  }

  
  const isAllItemsCOMPLETED = items.every(i => i.currentStatus === 'COMPLETED')
  const isAdmin = user?.role == 'MANAGER' || user?.role == 'SUPERVISOR'
  const availableWorkshops = user?.workshops?.map((workshop: any) => workshop.workshopId) || []

  const filteredItems = isAdmin ? items : items.filter(item => {
    return item.product.workshops.some(workshop => 
      availableWorkshops.includes(workshop.workshop.id))}
  )

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
          Назад к списку заказов
        </Button>
      </Card>
    )
  }

  if (!order) {
    return (
      <Card className="space-y-6">
        <p className="text-muted-foreground">Заказ не найден</p>
        <Button onClick={() => router.push('/kitchen')} className="mt-4">
          Назад к списку заказов
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
          ← Назад к списку заказов
        </Button>

        <OrderHeader order={order} />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2 p-4 space-y-4">
            <h2 className="text-lg font-semibold">Состав заказа</h2>
            {!filteredItems.length && (<h3>Нет блюд для приготовления</h3>)}
            <div className="space-y-4">
              {filteredItems.map(item => (
                <Card key={item.id} className="p-4">  
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <h3 className="font-medium">
                        {item.product.title} × {item.quantity}
                      </h3>
                      {item.additives.length > 0 && (
                        <div className="text-sm text-muted-foreground mt-1">
                          Добавки: {item.additives.map(a => a.title).join(', ')}
                        </div>
                      )}
                      {item.comment && (
                        <div className="text-sm text-muted-foreground mt-1">
                          Комментарий: {item.comment}
                        </div>
                      )}

                      <div className="mt-2 space-x-2">
                        {item.product.workshops.map(workshop => (
                          <Badge variant="outline" key={workshop.workshop.id}>
                            {workshop.workshop.name}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      
                      
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={item.currentStatus === 'IN_PROGRESS' ? 'default' : 'outline'}
                          disabled={item.currentStatus === 'IN_PROGRESS' || isUpdating || item.currentStatus === 'REFUNDED'}
                          onClick={() => handleStartCooking(item.id)}
                        >
                          В работу
                        </Button>
                        <Button
                          size="sm"
                          variant={item.currentStatus === 'COMPLETED' ? 'default' : 'outline'}
                          disabled={item.currentStatus === 'COMPLETED' || isUpdating || item.currentStatus === 'REFUNDED'}
                          onClick={() => handleStatusChange(item.id, OrderItemStatus.COMPLETED)}
                        >
                          Готово
                        </Button>
                        
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
              <h3 className="font-medium mb-2">Информация о заказе</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Номер заказа:</span>
                  <span>{order.number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Дата:</span>
                  <span>
                    {new Date(order.createdAt).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Статус заказа:</span>
                  <span className="capitalize">
                    {order.status.toLowerCase()}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Диалог подтверждения списания */}
      <Dialog open={writeOffDialogOpen} onOpenChange={setWriteOffDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Списание ингредиентов</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p>Будут списаны следующие ингредиенты:</p>
            <ul className="list-disc pl-5 space-y-2">
              {writeOffItems.map((item, index) => (
                <li key={index}>
                  {item.name} - {item.quantity} {item.unit}
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
              Отмена
            </Button>
            <Button 
              onClick={handleConfirmWriteOff} 
              disabled={isWritingOff}
            >
              {isWritingOff ? "Списание..." : "Подтвердить списание"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AccessCheck>
  )
}